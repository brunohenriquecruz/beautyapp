export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  birthday?: string;
  notes?: string;
  preferences?: string;
  totalPurchases: number;
  balance: number;
  createdAt: string;
  avatar?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  photo?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Installment {
  id: string;
  number: number;
  dueDate: string;
  value: number;
  paid: boolean;
  paidDate?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'dinheiro' | 'pix' | 'credito' | 'debito' | 'parcelado';
  installments?: Installment[];
  installmentCount?: number;
  status: 'pago' | 'parcial' | 'pendente';
  date: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  date: string;
  category: string;
  saleId?: string;
  clientId?: string;
}

export interface AppPage {
  id: 'login' | 'dashboard' | 'clients' | 'products' | 'sales' | 'new-sale' | 'financial' | 'reports' | 'agenda';
}
