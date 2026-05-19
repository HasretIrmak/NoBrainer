import "./globals.css";
import type { Metadata } from "next";
import AppNav from "../components/AppNav";

export const metadata: Metadata = {
  title: "NoBrainer",
  description: "Persona, iade riski ve urun optimizasyonu paneli.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
