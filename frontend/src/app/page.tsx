export default function DashboardPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Action Warehouse Slotting Module</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">Warehouse</p>
          <p className="text-2xl font-bold">15 aisles</p>
          <p className="text-sm text-[var(--muted-foreground)]">3,000 locations</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">SKU Catalog</p>
          <p className="text-2xl font-bold">10,000 SKUs</p>
          <p className="text-sm text-[var(--muted-foreground)]">9 categories</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">Optimization</p>
          <p className="text-2xl font-bold text-green-400">Ready</p>
          <p className="text-sm text-[var(--muted-foreground)]">No run yet</p>
        </div>
      </div>
      <div className="flex gap-4">
        <a href="/warehouse" className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
          View Warehouse 3D
        </a>
        <a href="/opex" className="px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition-colors">
          Opex Dashboard
        </a>
      </div>
    </div>
  );
}
