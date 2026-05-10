import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adaptive Commerce AI",
  description: "Yapay Zeka Destekli Satış Paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}