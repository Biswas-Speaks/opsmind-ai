import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthInitializer from "../components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpsMind AI - Intelligent IT Operations & Asset Management",
  description: "Enterprise IT Operations Management platform powered by AI troubleshooting agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}
