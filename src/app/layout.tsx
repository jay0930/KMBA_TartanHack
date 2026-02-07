import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0046FF",
};

export const metadata: Metadata = {
  title: "DayFlow — Your Daily Mosaic of Moments & Money",
  description: "An AI diary that pieces together your day from calendar, photos, and conversation.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/DayFlow_popicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/DayFlow_popicon/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/DayFlow_popicon/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dayflow.app",
    title: "DayFlow — Your Daily Mosaic of Moments & Money",
    description: "An AI diary that pieces together your day from calendar, photos, and conversation.",
    siteName: "DayFlow",
    images: [
      {
        url: "/images/DayFlow_logo.png",
        width: 1200,
        height: 630,
        alt: "DayFlow - AI Diary",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DayFlow — Your Daily Mosaic of Moments & Money",
    description: "An AI diary that pieces together your day from calendar, photos, and conversation.",
    images: ["/images/DayFlow_logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DayFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
