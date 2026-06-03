import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { Nav } from "./nav";
import { Toaster } from "@/components/ui-kit/toaster";

export const metadata: Metadata = {
  title: "Летнее расписание 2026",
  description: "Расписание, КБЖУ и тренировки",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
