import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contentmaxxer",
  description: "Frame screen recordings and design shots for Instagram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
