import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { NoZoom } from "@/components/NoZoom";
import { LaunchSplash } from "@/components/LaunchSplash";
import { ServiceWorker } from "@/components/ServiceWorker";
import { TelegramBridge } from "@/components/TelegramBridge";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const themeScript = `try{if(localStorage.getItem('usetenth:theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "usetenth", template: "%s · usetenth" },
  description: "Keep a tenth of every payment. We invest it for you.",
  appleWebApp: { capable: true, title: "usetenth", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f7f7fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramBridge />
        <NoZoom />
        <AuthProvider>
          {children}
          <NotificationWatcher />
          <LaunchSplash />
        </AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
