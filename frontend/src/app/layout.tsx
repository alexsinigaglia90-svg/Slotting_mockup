import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlotPilot — Warehouse Intelligence",
  description: "Warehouse slotting optimalisatie voor Action",
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
