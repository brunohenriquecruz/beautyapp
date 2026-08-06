import { useState } from 'react';
import { useApp } from '../context/AppContext';

interface TopBarProps {
  title: string;
  showSearch?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function TopBar({ title, showSearch = false, showBack = false, onBack, rightElement }: TopBarProps) {
  const { searchQuery, setSearchQuery, darkMode, toggleDarkMode } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#EDE0E7]">
      <div className="flex items-center gap-3 px-4 h-14">
        {showBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FCEEF4] active:scale-95 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C2553" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-[#FBF7F9] border border-[#EDE0E7] rounded-xl px-3 py-1.5 text-sm font-600 outline-none focus:border-[#9C2553] transition-colors"
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-[#9C8A93] text-sm font-700">
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <h1 className="flex-1 text-lg font-900 text-[#1C1019]">{title}</h1>
            {showSearch && (
              <button onClick={() => setSearchOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FCEEF4] active:scale-95 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9C8A93" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            )}
            {rightElement}
          </>
        )}
      </div>
    </header>
  );
}
