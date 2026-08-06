import { Home, Package, Plus, Users, WalletCards } from "lucide-react";
import type React from "react";

interface BottomNavProps {
  page: string;
  onNavigate: (page: string) => void;
  onNewSale: () => void;
}

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const tabs: { id: string; icon: IconComponent; label: string }[] = [
  { id: "dashboard", icon: Home, label: "Inicio" },
  { id: "clients", icon: Users, label: "Clientes" },
  { id: "products", icon: Package, label: "Produtos" },
  { id: "financial", icon: WalletCards, label: "Financeiro" },
];

export default function BottomNav({ page, onNavigate, onNewSale }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/96 backdrop-blur-md border-t border-[#D9EEF0] z-50 pb-safe shadow-[0_-18px_40px_rgba(16,35,38,0.08)]">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 relative">
        {tabs.slice(0, 2).map(tab => (
          <TabButton key={tab.id} {...tab} active={page === tab.id} onClick={() => onNavigate(tab.id)} />
        ))}

        <div className="flex flex-col items-center -mt-6">
          <button
            onClick={onNewSale}
            className="w-14 h-14 rounded-full icon-gradient-main flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Nova venda"
          >
            <Plus className="h-8 w-8 text-white" strokeWidth={2.6} />
          </button>
          <span className="text-[10px] font-800 text-[#08AFC8] mt-1">Vender</span>
        </div>

        {tabs.slice(2).map(tab => (
          <TabButton key={tab.id} {...tab} active={page === tab.id} onClick={() => onNavigate(tab.id)} />
        ))}
      </div>
    </nav>
  );
}

function TabButton({ icon: Icon, label, active, onClick }: { id: string; icon: IconComponent; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 min-w-[52px] active:scale-95 transition-transform">
      <div className={`p-1.5 rounded-xl transition-all ${active ? "icon-gradient-list" : ""}`}>
        <Icon className={`h-[21px] w-[21px] ${active ? "text-white" : "text-[#6D8185]"}`} strokeWidth={active ? 2.35 : 2.05} />
      </div>
      <span className={`text-[10px] font-800 transition-colors ${active ? "text-[#08AFC8]" : "text-[#6D8185]"}`}>{label}</span>
    </button>
  );
}
