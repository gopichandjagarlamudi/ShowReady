import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"]
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"]
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "ShowReady",
  description: "Smart buyer pre-qualification for real estate agents."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} ${mono.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
