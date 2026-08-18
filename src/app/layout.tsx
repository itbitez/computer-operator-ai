import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Computer Operator AI",
  description: "Bengali-first DOCX generation for coaching centers",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
