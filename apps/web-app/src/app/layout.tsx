import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berna & Suat",
  description: "Mutlu günümüze davetlisiniz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}