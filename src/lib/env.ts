const isProd = process.env.NODE_ENV === "production";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (isProd) {
    // Fail loudly rather than sign cookies with a guessable key.
    throw new Error("SESSION_SECRET must be set (at least 32 characters). `fly secrets set SESSION_SECRET=$(openssl rand -hex 32)`");
  }
  return "dev-only-secret-not-for-production-0000000000";
}

export const env = {
  isProd,
  get sessionSecret() {
    return secret();
  },
  databaseUrl: process.env.DATABASE_URL ?? "",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  bucket: process.env.BUCKET_NAME ?? "",
  storageDir: process.env.STORAGE_DIR ?? ".storage",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  notifyEmail: process.env.NOTIFY_EMAIL ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "Emma Jane Photography <no-reply@emmajanephoto.com>",
  maxUploadBytes: 50 * 1024 * 1024,
};
