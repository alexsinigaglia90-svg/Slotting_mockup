import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlotPilot — Warehouse Intelligence",
  description: "AI-driven warehouse slotting optimization for Action",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
