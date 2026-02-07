import type { Metadata } from "next";
import { Rubik, Fragment_Mono, Rubik_Bubbles } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
});

const rubikBubbles = Rubik_Bubbles({
  variable: "--font-rubik-bubbles",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nonsense — A Wearable Statements Pop Up",
  description: "A new fashion company. Archive sale pop-up event.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rubik.variable} ${fragmentMono.variable} ${rubikBubbles.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
