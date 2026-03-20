import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GreenCredits — Sell Your Carbssss ♻️",
    template: "%s | GreenCredits",
  },
  description:
    "Carbon credits marketplace for the fest. If your stall's been too gassy, it's time to pay up. Buy, sell, and trade surplus carbon credits.",
  keywords: ["carbon credits", "green", "sustainability", "fest", "marketplace", "trading"],
  authors: [{ name: "GreenCredits" }],
  creator: "GreenCredits",
  applicationName: "GreenCredits",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    title: "GreenCredits — Sell Your Carbssss ♻️",
    description:
      "Carbon credits marketplace for the fest. Buy, sell, and trade surplus carbon credits.",
    siteName: "GreenCredits",
  },
  twitter: {
    card: "summary",
    title: "GreenCredits — Sell Your Carbssss ♻️",
    description:
      "Carbon credits marketplace for the fest. Buy, sell, and trade surplus carbon credits.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
