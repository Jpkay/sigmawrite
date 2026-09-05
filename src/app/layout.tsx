import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

/** Legible reading face for the dys-friendly reader mode (roadmap 8.8). */
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-legible",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "Plume",
  title: {
    default: "Plume — Lecture et maîtrise du français",
    template: "%s · Plume",
  },
  description:
    "Lecture académique française personnalisée pour les élèves du secondaire.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plume",
  },
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${atkinson.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var e=document.documentElement,t=localStorage.getItem('plume-theme')||localStorage.getItem('sigmawrite-theme'),s=localStorage.getItem('plume-reading-scale')||localStorage.getItem('sigmawrite-reading-scale')||'normal',r=localStorage.getItem('plume-reduced-motion')||localStorage.getItem('sigmawrite-reduced-motion')||'false',d=t==='dark';e.classList.toggle('dark',d);e.dataset.readingScale=s;e.dataset.reducedMotion=r}catch(e){}})()` }} />
      </head>
      <body className="flex min-h-full flex-col"><PwaRegister />{children}</body>
    </html>
  );
}
