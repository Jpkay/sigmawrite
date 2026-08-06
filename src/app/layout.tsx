import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Reading to Learn — Personalized French academic reading",
  description:
    "Learn to love reading while reading to learn. Personalized French academic reading for secondary students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var e=document.documentElement,t=localStorage.getItem('sigmawrite-theme'),d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);e.classList.toggle('dark',d);e.dataset.readingScale=localStorage.getItem('sigmawrite-reading-scale')||'normal';e.dataset.reducedMotion=localStorage.getItem('sigmawrite-reduced-motion')||'false'}catch(e){}})()` }} />
      </head>
      <body className="flex min-h-full flex-col"><PwaRegister />{children}</body>
    </html>
  );
}
