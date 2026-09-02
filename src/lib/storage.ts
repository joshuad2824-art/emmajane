import "server-only";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { access, mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  readonly kind: "s3" | "local";
}

class S3Storage implements Storage {
  kind = "s3" as const;
  private client: S3Client;
  constructor(private bucket: string) {
    // Tigris (`fly storage create`) sets AWS_ENDPOINT_URL_S3 / AWS_REGION / AWS_ACCESS_KEY_ID /
    // AWS_SECRET_ACCESS_KEY / BUCKET_NAME. R2 and B2 use the same variables.
    this.client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined,
      forcePathStyle: !!process.env.AWS_S3_FORCE_PATH_STYLE,
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
  }
  async getStream(key: string) {
    const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const body = out.Body as unknown;
    if (body instanceof Readable) return body;
    if (body && typeof (body as ReadableStream).getReader === "function") return Readable.fromWeb(body as import("node:stream/web").ReadableStream);
    throw new Error("Unexpected S3 body type");
  }
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

class LocalStorage implements Storage {
  kind = "local" as const;
  constructor(private root: string) {}
  private p(key: string) {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.root, safe);
  }
  async put(key: string, body: Buffer) {
    const file = this.p(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }
  async getStream(key: string) {
    const file = this.p(key);
    await access(file); // throw now, not asynchronously mid-stream, when the object is missing
    return createReadStream(file);
  }
  async delete(key: string) {
    const file = this.p(key);
    await unlink(file).catch(() => {});
    await rmdir(path.dirname(file)).catch(() => {}); // only succeeds once the folder is empty
  }
}

let instance: Storage | null = null;
export function storage(): Storage {
  if (instance) return instance;
  if (env.bucket) {
    instance = new S3Storage(env.bucket);
  } else {
    if (env.isProd) {
      console.warn("[storage] BUCKET_NAME is not set — photos are being written to the machine's local disk and WILL NOT survive a redeploy. Run `fly storage create` to attach Tigris.");
    }
    instance = new LocalStorage(path.resolve(env.storageDir));
  }
  return instance;
}
