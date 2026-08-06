import { ChevronLeft, Search } from "lucide-react";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#D9EEF0]">
      <div className="flex items-center gap-3 px-4 h-14">
        {showBack && (
          <button onClick={onBack} className="w-8 h-8 icon-gradient flex items-center justify-center rounded-full active:scale-95 transition-all">
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
            <h1 className="flex-1 text-lg font-900 text-[#102326]">{title}</h1>
            {showSearch && (
              <button onClick={() => setSearchOpen(true)} className="w-8 h-8 icon-gradient flex items-center justify-center rounded-full active:scale-95 transition-all">
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
