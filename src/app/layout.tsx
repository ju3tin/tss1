import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WGP CRM - Wealth Generation Partners",
  description: "Custom CRM solution for Wealth Generation Partners - Streamlining investor onboarding and deal management.",
  keywords: ["WGP", "CRM", "Wealth Generation Partners", "Investor Management", "Deal Pipeline", "KYC"],
  authors: [{ name: "WGP Team" }],
  openGraph: {
    title: "WGP CRM",
    description: "Custom CRM solution for Wealth Generation Partners",
    url: "https://wgp.com",
    siteName: "WGP CRM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WGP CRM",
    description: "Custom CRM solution for Wealth Generation Partners",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProviderWrapper>
          {children}
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
