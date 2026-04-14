import { PresentationProvider } from "@/context/presentation-context";

export default function PresentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PresentationProvider>
      <div className="fixed inset-0 bg-[color:var(--color-bg)] text-[color:var(--color-fg)] overflow-hidden">
        {children}
      </div>
    </PresentationProvider>
  );
}
