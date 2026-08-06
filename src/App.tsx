'use client';

import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Clients from './views/Clients';
import Products from './views/Products';
import NewSale from './views/NewSale';
import Financial from './views/Financial';
import Reports from './views/Reports';
import BottomNav from './components/BottomNav';

type Page = 'dashboard' | 'clients' | 'products' | 'financial' | 'reports' | 'new-sale';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

function AppShell() {
  const [page, setPage] = useState<Page>('dashboard');
  const [prevPage, setPrevPage] = useState<Page>('dashboard');

  const navigate = (p: string) => setPage(p as Page);

  const openNewSale = () => {
    setPrevPage(page);
    setPage('new-sale');
  };

  if (page === 'new-sale') {
    return <NewSale onBack={() => setPage(prevPage)} onComplete={() => setPage('dashboard')} />;
  }

  return (
    <div className="relative">
      {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {page === 'clients'   && <Clients />}
      {page === 'products'  && <Products />}
      {page === 'financial' && <Financial />}
      {page === 'reports'   && <Reports />}
      <BottomNav page={page} onNavigate={navigate} onNewSale={openNewSale} />
    </div>
  );
}
