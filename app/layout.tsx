/**
 * Root layout — wraps every page with the header and global styles.
 * The site name/tagline come from config/site.ts.
 */
import type { Metadata } from "next";
import { site } from "@/config/site";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: site.name,
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
