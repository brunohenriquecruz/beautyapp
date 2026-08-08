import { ChevronLeft, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import type React from "react";
import { useApp } from "../context/AppContext";

interface TopBarProps {
  title: string;
  showSearch?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function TopBar({ title, showSearch = false, showBack = false, onBack, rightElement }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const isBrand = title === "BellaFlow";

  return (
    <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-[#D9EEF0]">
      <div className="flex min-w-0 items-center gap-3 px-4 h-16">
        {showBack && (
          <button onClick={onBack} className="w-9 h-9 icon-gradient flex shrink-0 items-center justify-center rounded-full active:scale-95 transition-all">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
        )}

        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-[#F4FFFB] border border-[#D9EEF0] rounded-xl px-3 py-1.5 text-sm font-600 outline-none focus:border-[#16C8DD] transition-colors"
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-[#6D8185] text-sm font-800">
              Cancelar
            </button>
          </div>
        ) : (
          <>
            {isBrand ? (
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 leading-none">
                  <h1 className="brand-wordmark truncate text-[1.35rem] font-900">
                    Bella<span>Flow</span>
                  </h1>
                  <p className="mt-1 truncate text-[10px] font-800 uppercase text-[#6D8185]">
                    Gestao de beleza
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="flex-1 truncate text-lg font-900 text-[#102326]">{title}</h1>
            )}
            {showSearch && (
              <button onClick={() => setSearchOpen(true)} className="w-9 h-9 icon-gradient flex shrink-0 items-center justify-center rounded-full active:scale-95 transition-all">
                <Search className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </button>
            )}
            {rightElement}
          </>
        )}
      </div>
    </header>
  );
}
