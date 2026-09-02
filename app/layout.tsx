import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Evaluation — Caption Foto Arsip Sukarno",
  description: "Instrumen evaluasi fluency, accuracy, dan factual error pada caption foto arsip.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
