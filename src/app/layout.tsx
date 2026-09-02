import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, La_Belle_Aurore } from "next/font/google";
import "./globals.css";
import { currentAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { AdminProvider } from "@/components/AdminProvider";
import { AdminBar } from "@/components/AdminBar";
import { Nav } from "@/components/Nav";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-eb-garamond", display: "swap" });
const laBelle = La_Belle_Aurore({ subsets: ["latin"], weight: "400", variable: "--font-la-belle", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "Emma Jane Photography", template: "%s · Emma Jane Photography" },
  description: "Lifestyle photography in Tulsa, Oklahoma — families, seniors, weddings and small-business sessions. Real days, real light, softly kept.",
  openGraph: { siteName: "Emma Jane Photography", type: "website", images: ["/photos/senior-golden.jpg"] },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin().catch(() => null);
  return (
    <html lang="en" className={`${cormorant.variable} ${ebGaramond.variable} ${laBelle.variable}`}>
      <body className={admin ? "is-admin" : undefined}>
        <AdminProvider isAdmin={!!admin}>
          <div className="page">
            <Nav />
            {children}
          </div>
          <AdminBar />
        </AdminProvider>
      </body>
    </html>
  );
}
