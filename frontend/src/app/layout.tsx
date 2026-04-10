import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Action Warehouse Slotting",
  description: "AI-driven warehouse slotting optimization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
        <aside className="w-60 min-h-screen bg-[#0d0d14] border-r border-[var(--border)] flex flex-col p-4">
          <div className="mb-8">
            <h1 className="text-lg font-bold text-white tracking-tight">Action Slotting</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Warehouse Optimization</p>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            <a href="/" className="px-3 py-2 rounded-md text-sm hover:bg-[var(--muted)] transition-colors">Dashboard</a>
            <a href="/warehouse" className="px-3 py-2 rounded-md text-sm hover:bg-[var(--muted)] transition-colors">3D Warehouse</a>
            <a href="/opex" className="px-3 py-2 rounded-md text-sm hover:bg-[var(--muted)] transition-colors">Opex Dashboard</a>
          </nav>
          <div className="mt-auto pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              API Connected
            </div>
          </div>
        </aside>
        <main className="flex-1 min-h-screen overflow-auto">{children}</main>
      </body>
    </html>
  );
}
