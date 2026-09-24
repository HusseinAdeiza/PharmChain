import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { AppBackdrop } from "@/components/app-backdrop";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PharmChain | Medicine you can verify",
    template: "%s | PharmChain",
  },
  description:
    "Verify medicine passports, register batch attestations, and report safety concerns on Monad Mainnet.",
  applicationName: "PharmChain",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#04060a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${plexMono.variable} bg-void font-sans text-frost antialiased`}
      >
        <AppBackdrop />
        <Providers>
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
