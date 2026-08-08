import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claim & Support System",
  description: "Dealer claim and support management portal",
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
