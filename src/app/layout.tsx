import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ironridge Constructions — Infrastructure & Commercial Builders",
  description:
    "Highways, bridges, towers and campuses — Ironridge plans, hauls, excavates and frames the structures cities grow around.",
  openGraph: {
    title: "Ironridge Constructions",
    description: "We build what holds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121314",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
