import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-next"
});

export const metadata: Metadata = {
  title: "Korbly - three dinners, one Gurkerl cart",
  description: "Pick three dinners. Korbly builds the Gurkerl cart and saves your cooking plan."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
