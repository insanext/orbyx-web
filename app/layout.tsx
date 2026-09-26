import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Orbyx | Agenda y reservas para tu negocio",
  description:
    "Orbyx es la plataforma de agenda y reservas online para negocios de servicios en Chile: booking público, gestión de horarios, personal y clientes en un solo panel.",
  // PWA instalable (Fase 1 app móvil): el <link rel="manifest"> lo agrega
  // app/manifest.ts y el apple-touch-icon app/apple-icon.png.
  applicationName: "Orbyx",
  appleWebApp: {
    capable: true,
    title: "Orbyx",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} ${dmSerif.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
