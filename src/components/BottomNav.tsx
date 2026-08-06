import React from 'react';

interface BottomNavProps {
  page: string;
  onNavigate: (page: string) => void;
  onNewSale: () => void;
}

type IconComponent = () => React.ReactElement;

const tabs: { id: string; icon: IconComponent; label: string }[] = [
  { id: 'dashboard', icon: HomeIcon, label: 'Início' },
  { id: 'clients', icon: UsersIcon, label: 'Clientes' },
  { id: 'products', icon: BoxIcon, label: 'Produtos' },
  { id: 'financial', icon: WalletIcon, label: 'Financeiro' },
];

export default function BottomNav({ page, onNavigate, onNewSale }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#EDE0E7] z-50 pb-safe">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 relative">
        {tabs.slice(0, 2).map(tab => (
          <TabButton key={tab.id} {...tab} active={page === tab.id} onClick={() => onNavigate(tab.id)} />
        ))}

        {/* Center FAB */}
        <div className="flex flex-col items-center -mt-6">
          <button
            onClick={onNewSale}
            className="w-14 h-14 rounded-full bg-[#9C2553] shadow-lg shadow-[#9C2553]/40 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Nova venda"
          >
            <PlusIcon />
          </button>
          <span className="text-[10px] font-600 text-[#9C2553] mt-1">Vender</span>
        </div>

        {tabs.slice(2).map(tab => (
          <TabButton key={tab.id} {...tab} active={page === tab.id} onClick={() => onNavigate(tab.id)} />
        ))}
      </div>
    </nav>
  );
}

function TabButton({ id, icon: Icon, label, active, onClick }: { id: string; icon: IconComponent; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 min-w-[52px] active:scale-95 transition-transform">
      <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-[#FCEEF4]' : ''}`}>
        <Icon />
      </div>
      <span className={`text-[10px] font-700 transition-colors ${active ? 'text-[#9C2553]' : 'text-[#9C8A93]'}`}>{label}</span>
    </button>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inherit">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
