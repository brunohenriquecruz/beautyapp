import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import type { Product } from '../types';
import { categories, brands } from '../data/mockData';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const profit = (p: Product) => p.salePrice - p.costPrice;
const margin = (p: Product) => p.costPrice > 0 ? ((profit(p) / p.costPrice) * 100).toFixed(0) : '0';

export default function Products() {
  const { products, addProduct, updateProduct, searchQuery } = useApp();
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [editMode, setEditMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todos');

  const allCategories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.includes(searchQuery) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'Todos' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter(p => p.stock <= p.minStock);

  const openNew = () => { setForm({ stock: 0, minStock: 3, costPrice: 0, salePrice: 0 }); setEditMode(false); setView('form'); };
  const openEdit = (p: Product) => { setForm(p); setEditMode(true); setView('form'); };
  const openDetail = (p: Product) => { setSelected(p); setView('detail'); };

  const handleSave = () => {
    if (!form.name || !form.code) return;
    if (editMode && form.id) {
      updateProduct(form as Product);
    } else {
      addProduct(form as Omit<Product, 'id' | 'createdAt'>);
    }
    setView('list');
  };

  if (view === 'form') return <ProductForm form={form} setForm={setForm} onSave={handleSave} onBack={() => setView('list')} editMode={editMode} />;
  if (view === 'detail' && selected) {
    const current = products.find(p => p.id === selected.id) || selected;
    return <ProductDetail product={current} onBack={() => setView('list')} onEdit={() => openEdit(current)} onAdjust={(p) => { updateProduct(p); setSelected(p); }} />;
  }

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Produtos" showSearch rightElement={
        <button onClick={openNew} className="w-8 h-8 flex items-center justify-center bg-[#9C2553] rounded-full active:scale-95 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      } />

      <div className="px-4 pt-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Produtos" value={products.length.toString()} color="rose" />
          <StatPill label="Estoque baixo" value={lowStock.length.toString()} color={lowStock.length > 0 ? 'amber' : 'green'} />
          <StatPill label="Valor total" value={fmt(products.reduce((a, p) => a + p.salePrice * p.stock, 0))} color="green" />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-700 transition-all ${filterCategory === cat ? 'bg-[#9C2553] text-white' : 'bg-white text-[#9C8A93] border border-[#EDE0E7]'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="text-amber-800 text-sm font-700">{lowStock.length} produto{lowStock.length > 1 ? 's' : ''} com estoque baixo</p>
              <p className="text-amber-600 text-xs font-500">{lowStock.map(p => p.name.split(' ').slice(0, 3).join(' ')).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Product list */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-5xl mb-3">📦</span>
            <p className="font-700 text-[#1C1019]">Nenhum produto encontrado</p>
            <p className="text-[#9C8A93] text-sm mt-1">Toque em + para cadastrar seu primeiro produto</p>
          </div>
        )}
        {filtered.map(product => (
          <button key={product.id} onClick={() => openDetail(product)}
            className="w-full bg-white rounded-2xl border border-[#EDE0E7] p-3 flex items-center gap-3 active:scale-98 transition-transform shadow-sm">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FCEEF4] shrink-0">
              {product.photo ? (
                <img src={product.photo} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">💄</div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-700 text-[#1C1019] text-sm leading-tight truncate">{product.name}</p>
              <p className="text-[#9C8A93] text-[11px] font-500 mt-0.5">{product.category} · Cód: {product.code}</p>
              <p className="text-[#10B981] text-xs font-700 mt-0.5">{fmt(product.salePrice)} <span className="text-[#9C8A93] font-500">· lucro {margin(product)}%</span></p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-base font-900 ${product.stock <= product.minStock ? 'text-red-500' : 'text-[#1C1019]'}`}>{product.stock}</p>
              <p className="text-[#9C8A93] text-[10px] font-600">unid.</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductDetail({ product, onBack, onEdit, onAdjust }: { product: Product; onBack: () => void; onEdit: () => void; onAdjust: (p: Product) => void }) {
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [showAdjust, setShowAdjust] = useState(false);

  const handleAdjust = () => {
    const newStock = adjustType === 'add' ? product.stock + adjustQty : Math.max(0, product.stock - adjustQty);
    onAdjust({ ...product, stock: newStock });
    setShowAdjust(false);
    setAdjustQty(0);
  };

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Produto" showBack onBack={onBack} rightElement={
        <button onClick={onEdit} className="text-[#9C2553] text-sm font-700">Editar</button>
      } />
      <div className="px-4 pt-4 space-y-4">
        {/* Product card */}
        <div className="bg-white rounded-3xl border border-[#EDE0E7] overflow-hidden shadow-sm">
          {product.photo && (
            <img src={product.photo} alt={product.name} className="w-full h-48 object-cover" />
          )}
          {!product.photo && (
            <div className="w-full h-32 bg-[#FCEEF4] flex items-center justify-center text-5xl">💄</div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-900 text-[#1C1019] text-lg leading-tight">{product.name}</h2>
                <p className="text-[#9C8A93] text-sm font-500 mt-0.5">{product.brand} · {product.category}</p>
                <p className="text-[#9C8A93] text-xs font-500 mt-0.5">Código: {product.code}</p>
              </div>
              <span className={`shrink-0 text-xs font-700 px-2 py-1 rounded-full ${product.stock <= product.minStock ? 'bg-red-50 text-red-500' : 'bg-[#D1FAE5] text-emerald-700'}`}>
                {product.stock} unid.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <PriceBox label="Custo" value={fmt(product.costPrice)} muted />
              <PriceBox label="Venda" value={fmt(product.salePrice)} highlight />
              <PriceBox label="Lucro" value={fmt(profit(product))} green />
            </div>
          </div>
        </div>

        {/* Stock adjust */}
        <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-800 text-[#1C1019]">Estoque</h3>
            <button onClick={() => setShowAdjust(!showAdjust)} className="text-[#9C2553] text-sm font-700">
              {showAdjust ? 'Cancelar' : 'Ajustar'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-[#FBF7F9] rounded-xl p-3">
              <p className="text-[#9C8A93] text-xs font-600">Atual</p>
              <p className={`text-2xl font-900 ${product.stock <= product.minStock ? 'text-red-500' : 'text-[#1C1019]'}`}>{product.stock}</p>
            </div>
            <div className="flex-1 bg-[#FBF7F9] rounded-xl p-3">
              <p className="text-[#9C8A93] text-xs font-600">Mínimo</p>
              <p className="text-2xl font-900 text-[#1C1019]">{product.minStock}</p>
            </div>
          </div>

          {showAdjust && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setAdjustType('add')} className={`flex-1 py-2 rounded-xl text-sm font-700 transition-all ${adjustType === 'add' ? 'bg-[#10B981] text-white' : 'bg-[#FBF7F9] text-[#9C8A93]'}`}>
                  + Entrada
                </button>
                <button onClick={() => setAdjustType('remove')} className={`flex-1 py-2 rounded-xl text-sm font-700 transition-all ${adjustType === 'remove' ? 'bg-red-500 text-white' : 'bg-[#FBF7F9] text-[#9C8A93]'}`}>
                  − Saída
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setAdjustQty(Math.max(0, adjustQty - 1))} className="w-10 h-10 rounded-xl bg-[#FBF7F9] font-900 text-lg active:scale-95 transition-transform">−</button>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 text-center text-xl font-900 bg-[#FBF7F9] rounded-xl py-2 outline-none" />
                <button onClick={() => setAdjustQty(adjustQty + 1)} className="w-10 h-10 rounded-xl bg-[#FBF7F9] font-900 text-lg active:scale-95 transition-transform">+</button>
              </div>
              <button onClick={handleAdjust} disabled={adjustQty === 0} className="w-full bg-[#9C2553] text-white font-700 rounded-xl py-3 active:scale-95 transition-transform disabled:opacity-40">
                Confirmar Ajuste
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductForm({ form, setForm, onSave, onBack, editMode }: { form: Partial<Product>; setForm: (f: Partial<Product>) => void; onSave: () => void; onBack: () => void; editMode: boolean }) {
  const set = (k: keyof Product, v: string | number) => setForm({ ...form, [k]: v });
  const profitCalc = ((form.salePrice || 0) - (form.costPrice || 0));

  return (
    <div className="pb-24 page-enter">
      <TopBar title={editMode ? 'Editar Produto' : 'Novo Produto'} showBack onBack={onBack} />
      <div className="px-4 pt-4 space-y-4">
        <Section title="Identificação">
          <Field label="Nome do produto *" value={form.name || ''} onChange={v => set('name', v)} placeholder="Ex: Perfume Floratta Blue 75ml" />
          <Field label="Código *" value={form.code || ''} onChange={v => set('code', v)} placeholder="Código do produto" />
          <div className="px-4 py-3">
            <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide mb-2">Categoria</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => set('category', cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-700 transition-all ${form.category === cat ? 'bg-[#9C2553] text-white' : 'bg-[#FBF7F9] text-[#9C8A93] border border-[#EDE0E7]'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide mb-2">Marca</p>
            <div className="flex flex-wrap gap-2">
              {brands.map(b => (
                <button key={b} onClick={() => set('brand', b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-700 transition-all ${form.brand === b ? 'bg-[#9C2553] text-white' : 'bg-[#FBF7F9] text-[#9C8A93] border border-[#EDE0E7]'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Preços">
          <NumField label="Preço de custo (R$)" value={form.costPrice || 0} onChange={v => set('costPrice', v)} />
          <NumField label="Preço de venda (R$)" value={form.salePrice || 0} onChange={v => set('salePrice', v)} />
          <div className="px-4 py-3 bg-[#FCEEF4]/50">
            <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide">Lucro Estimado</p>
            <p className={`text-xl font-900 mt-0.5 ${profitCalc >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>{fmt(profitCalc)}</p>
          </div>
        </Section>

        <Section title="Estoque">
          <NumField label="Quantidade atual" value={form.stock || 0} onChange={v => set('stock', v)} integer />
          <NumField label="Estoque mínimo (alerta)" value={form.minStock || 3} onChange={v => set('minStock', v)} integer />
        </Section>

        <button onClick={onSave} className="w-full bg-[#9C2553] text-white font-800 rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-[#9C2553]/30">
          {editMode ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </button>
      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string; color: 'rose'|'amber'|'green' }) {
  const c = { rose: 'bg-[#FCEEF4] text-[#9C2553]', amber: 'bg-amber-50 text-amber-700', green: 'bg-[#D1FAE5] text-emerald-700' };
  return (
    <div className={`${c[color]} rounded-2xl p-3 text-center`}>
      <p className="font-900 text-sm leading-tight truncate">{value}</p>
      <p className="text-[10px] font-600 opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

function PriceBox({ label, value, muted, highlight, green }: { label: string; value: string; muted?: boolean; highlight?: boolean; green?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${muted ? 'bg-[#FBF7F9]' : highlight ? 'bg-[#FCEEF4]' : 'bg-[#D1FAE5]/40'}`}>
      <p className="text-[#9C8A93] text-[10px] font-600">{label}</p>
      <p className={`text-sm font-800 mt-0.5 ${green ? 'text-[#10B981]' : highlight ? 'text-[#9C2553]' : 'text-[#1C1019]'}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#9C8A93] text-xs font-700 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-[#EDE0E7] overflow-hidden divide-y divide-[#EDE0E7]">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide mb-1">{label}</p>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm font-600 text-[#1C1019] bg-transparent outline-none placeholder:text-[#9C8A93]/60" />
    </div>
  );
}

function NumField({ label, value, onChange, integer }: { label: string; value: number; onChange: (v: number) => void; integer?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide mb-1">{label}</p>
      <input type="number" value={value || ''} onChange={e => onChange(integer ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
        step={integer ? 1 : 0.01} min={0}
        className="w-full text-sm font-600 text-[#1C1019] bg-transparent outline-none" />
    </div>
  );
}
