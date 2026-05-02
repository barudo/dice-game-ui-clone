import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dice Game UI Clone",
  description: "Stake-style dice game UI built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
