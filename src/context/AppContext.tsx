import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Client, Product, Sale, Transaction } from '../types';
import { mockClients, mockProducts, mockSales, mockTransactions } from '../data/mockData';

interface AppContextValue {
  clients: Client[];
  products: Product[];
  sales: Sale[];
  transactions: Transaction[];
  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'totalPurchases' | 'balance'>) => void;
  updateClient: (c: Client) => void;
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (p: Product) => void;
  addSale: (s: Omit<Sale, 'id'>) => void;
  markInstallmentPaid: (saleId: string, installmentId: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextValue>(null!);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('bg_clients', mockClients));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('bg_products', mockProducts));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage('bg_sales', mockSales));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('bg_transactions', mockTransactions));
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => loadFromStorage('bg_dark', false));

  useEffect(() => { localStorage.setItem('bg_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('bg_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('bg_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('bg_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('bg_dark', JSON.stringify(darkMode)); }, [darkMode]);

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const addClient = (c: Omit<Client, 'id' | 'createdAt' | 'totalPurchases' | 'balance'>) =>
    setClients(prev => [...prev, { ...c, id: uid(), totalPurchases: 0, balance: 0, createdAt: new Date().toISOString().slice(0, 10) }]);

  const updateClient = (c: Client) =>
    setClients(prev => prev.map(x => x.id === c.id ? c : x));

  const addProduct = (p: Omit<Product, 'id' | 'createdAt'>) =>
    setProducts(prev => [...prev, { ...p, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }]);

  const updateProduct = (p: Product) =>
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));

  const addSale = (s: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...s, id: uid() };
    setSales(prev => [newSale, ...prev]);
    // Deduce stock
    s.items.forEach(item => {
      setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p));
    });
    // Update client balance & totals
    if (s.paymentMethod === 'parcelado') {
      const unpaid = (s.installments || []).filter(i => !i.paid).reduce((acc, i) => acc + i.value, 0);
      updateClient({ ...clients.find(c => c.id === s.clientId)!, balance: (clients.find(c => c.id === s.clientId)?.balance || 0) + unpaid, totalPurchases: (clients.find(c => c.id === s.clientId)?.totalPurchases || 0) + s.total });
    } else {
      const cl = clients.find(c => c.id === s.clientId);
      if (cl) updateClient({ ...cl, totalPurchases: cl.totalPurchases + s.total });
    }
    // Add transaction
    if (s.status === 'pago') {
      setTransactions(prev => [{ id: uid(), type: 'receita', description: `Venda — ${s.clientName}`, amount: s.total, date: s.date, category: 'Venda', clientId: s.clientId }, ...prev]);
    }
  };

  const markInstallmentPaid = (saleId: string, installmentId: string) => {
    setSales(prev => prev.map(sale => {
      if (sale.id !== saleId) return sale;
      const updatedInstallments = (sale.installments || []).map(i =>
        i.id === installmentId ? { ...i, paid: true, paidDate: new Date().toISOString().slice(0, 10) } : i
      );
      const allPaid = updatedInstallments.every(i => i.paid);
      const paidInst = updatedInstallments.find(i => i.id === installmentId)!;
      // Add transaction
      setTransactions(prev => [{ id: uid(), type: 'receita', description: `Parcela ${paidInst.number}/${sale.installmentCount} — ${sale.clientName}`, amount: paidInst.value, date: new Date().toISOString().slice(0, 10), category: 'Parcelamento', saleId, clientId: sale.clientId }, ...prev]);
      // Update client balance
      const cl = clients.find(c => c.id === sale.clientId);
      if (cl) updateClient({ ...cl, balance: Math.max(0, cl.balance - paidInst.value) });
      return { ...sale, installments: updatedInstallments, status: allPaid ? 'pago' : 'parcial' };
    }));
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) =>
    setTransactions(prev => [{ ...t, id: uid() }, ...prev]);

  return (
    <AppContext.Provider value={{ clients, products, sales, transactions, addClient, updateClient, addProduct, updateProduct, addSale, markInstallmentPaid, addTransaction, searchQuery, setSearchQuery, darkMode, toggleDarkMode: () => setDarkMode(d => !d) }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
