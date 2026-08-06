import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import type { Client } from '../types';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Clients() {
  const { clients, addClient, updateClient, sales, searchQuery } = useApp();
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});
  const [editMode, setEditMode] = useState(false);

  const filtered = clients.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  ).sort((a, b) => b.totalPurchases - a.totalPurchases);

  const openDetail = (c: Client) => { setSelected(c); setView('detail'); };
  const openNew = () => { setForm({}); setEditMode(false); setView('form'); };
  const openEdit = (c: Client) => { setForm(c); setEditMode(true); setView('form'); };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editMode && form.id) {
      updateClient(form as Client);
    } else {
      addClient(form as Omit<Client, 'id' | 'createdAt' | 'totalPurchases' | 'balance'>);
    }
    setView('list');
  };

  if (view === 'form') return <ClientForm form={form} setForm={setForm} onSave={handleSave} onBack={() => setView('list')} editMode={editMode} />;
  if (view === 'detail' && selected) return <ClientDetail client={selected} sales={sales} onBack={() => setView('list')} onEdit={() => openEdit(selected)} />;

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Clientes" showSearch rightElement={
        <button onClick={openNew} className="w-8 h-8 flex items-center justify-center bg-[#9C2553] rounded-full active:scale-95 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      } />

      <div className="px-4 pt-4 space-y-3">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Total" value={clients.length.toString()} color="rose" />
          <StatPill label="Devedores" value={clients.filter(c => c.balance > 0).length.toString()} color="amber" />
          <StatPill label="A Receber" value={fmt(clients.reduce((a, c) => a + c.balance, 0))} color="green" />
        </div>

        {/* Client list */}
        {filtered.length === 0 && (
          <EmptyState icon="👥" title="Nenhum cliente encontrado" sub="Toque em + para cadastrar seu primeiro cliente" />
        )}
        {filtered.map(client => (
          <button key={client.id} onClick={() => openDetail(client)} className="w-full bg-white rounded-2xl px-4 py-3.5 border border-[#EDE0E7] flex items-center gap-3 active:scale-98 transition-transform shadow-sm">
            <Avatar name={client.name} />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="font-700 text-[#1C1019] text-sm leading-tight truncate">{client.name}</p>
                {isBirthdayMonth(client.birthday) && <span className="text-base">🎂</span>}
              </div>
              <p className="text-[#9C8A93] text-xs font-500 mt-0.5">{client.phone}</p>
              <p className="text-[#9C8A93] text-[11px] font-500 mt-0.5">{client.neighborhood && `${client.neighborhood} · `}Total: {fmt(client.totalPurchases)}</p>
            </div>
            <div className="shrink-0 text-right">
              {client.balance > 0 ? (
                <div>
                  <p className="text-red-500 text-sm font-800">{fmt(client.balance)}</p>
                  <p className="text-red-400 text-[10px] font-600">devendo</p>
                </div>
              ) : (
                <span className="text-[10px] font-700 text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">Em dia ✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientDetail({ client, sales, onBack, onEdit }: { client: Client; sales: ReturnType<typeof useApp>['sales']; onBack: () => void; onEdit: () => void }) {
  const clientSales = sales.filter(s => s.clientId === client.id);
  const [tab, setTab] = useState<'info' | 'history' | 'installments'>('info');

  const pendingInstallments = clientSales.flatMap(s =>
    (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, saleName: s.date }))
  );

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Perfil da Cliente" showBack onBack={onBack} rightElement={
        <button onClick={onEdit} className="text-[#9C2553] text-sm font-700">Editar</button>
      } />

      <div className="px-4 pt-4">
        {/* Header card */}
        <div className="bg-gradient-to-br from-[#9C2553] to-[#C2185B] rounded-3xl p-5 text-white mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-900">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-900">{client.name}</h2>
              <p className="text-white/70 text-sm font-500">{client.phone}</p>
              {client.birthday && <p className="text-white/60 text-xs font-500 mt-0.5">🎂 {formatBirthday(client.birthday)}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/15 rounded-2xl p-3 border border-white/20">
              <p className="text-white/60 text-[10px] font-600 uppercase">Total Comprado</p>
              <p className="text-white text-lg font-900">{fmt(client.totalPurchases)}</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 border border-white/20">
              <p className="text-white/60 text-[10px] font-600 uppercase">Saldo Devedor</p>
              <p className={`text-lg font-900 ${client.balance > 0 ? 'text-yellow-300' : 'text-white'}`}>{fmt(client.balance)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#EDE0E7]/40 rounded-2xl p-1 mb-4">
          {(['info', 'history', 'installments'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-700 transition-all ${tab === t ? 'bg-white text-[#9C2553] shadow-sm' : 'text-[#9C8A93]'}`}>
              {t === 'info' ? 'Dados' : t === 'history' ? 'Histórico' : 'Parcelas'}
              {t === 'installments' && pendingInstallments.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingInstallments.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="space-y-3">
            <InfoRow icon="📍" label="Endereço" value={[client.address, client.neighborhood, client.city].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon="✉️" label="E-mail" value={client.email || '—'} />
            <InfoRow icon="💝" label="Preferências" value={client.preferences || '—'} />
            <InfoRow icon="📝" label="Observações" value={client.notes || '—'} />
            <InfoRow icon="📅" label="Cliente desde" value={client.createdAt ? new Date(client.createdAt + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} />

            <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-700 rounded-2xl py-3.5 active:scale-95 transition-transform mt-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.109.549 4.09 1.509 5.818L0 24l6.335-1.492A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.375l-.36-.214-3.732.979.996-3.648-.235-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
              Enviar mensagem no WhatsApp
            </a>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {clientSales.length === 0 && <EmptyState icon="🛍️" title="Sem compras" sub="Esta cliente ainda não fez compras" />}
            {clientSales.map(sale => (
              <div key={sale.id} className="bg-white rounded-2xl px-4 py-3 border border-[#EDE0E7]">
                <div className="flex items-center justify-between">
                  <p className="font-700 text-sm text-[#1C1019]">{new Date(sale.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <p className="font-800 text-sm text-[#1C1019]">{fmt(sale.total)}</p>
                </div>
                <p className="text-[#9C8A93] text-xs mt-0.5">{sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] font-600 text-[#9C8A93]">{pmLabel(sale.paymentMethod)}</span>
                  <span className={`text-[10px] font-700 px-2 py-0.5 rounded-full ${statusStyle(sale.status)}`}>{statusLabel(sale.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'installments' && (
          <div className="space-y-2">
            {pendingInstallments.length === 0 && <EmptyState icon="✅" title="Sem parcelas pendentes" sub="Esta cliente está em dia com os pagamentos" />}
            {pendingInstallments.map(inst => (
              <div key={inst.id} className={`bg-white rounded-2xl px-4 py-3 border ${inst.dueDate < new Date().toISOString().slice(0,10) ? 'border-red-200 bg-red-50/50' : 'border-[#EDE0E7]'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-700 text-sm text-[#1C1019]">Parcela {inst.number}</p>
                  <p className="font-800 text-sm text-[#1C1019]">{fmt(inst.value)}</p>
                </div>
                <p className="text-[#9C8A93] text-xs mt-0.5">Vence: {new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                {inst.dueDate < new Date().toISOString().slice(0,10) && (
                  <span className="text-[10px] font-700 text-red-500">⚠️ Vencida</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientForm({ form, setForm, onSave, onBack, editMode }: { form: Partial<Client>; setForm: (f: Partial<Client>) => void; onSave: () => void; onBack: () => void; editMode: boolean }) {
  const set = (k: keyof Client, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="pb-24 page-enter">
      <TopBar title={editMode ? 'Editar Cliente' : 'Novo Cliente'} showBack onBack={onBack} />
      <div className="px-4 pt-4 space-y-4">
        <Section title="Dados Pessoais">
          <Field label="Nome completo *" value={form.name || ''} onChange={v => set('name', v)} placeholder="Ex: Maria Silva" />
          <Field label="Telefone / WhatsApp *" value={form.phone || ''} onChange={v => set('phone', v)} placeholder="(00) 99999-9999" type="tel" />
          <Field label="E-mail" value={form.email || ''} onChange={v => set('email', v)} placeholder="email@exemplo.com" type="email" />
          <Field label="Data de aniversário" value={form.birthday || ''} onChange={v => set('birthday', v)} type="date" />
        </Section>
        <Section title="Endereço">
          <Field label="Endereço" value={form.address || ''} onChange={v => set('address', v)} placeholder="Rua, número" />
          <Field label="Bairro" value={form.neighborhood || ''} onChange={v => set('neighborhood', v)} placeholder="Bairro" />
          <Field label="Cidade" value={form.city || ''} onChange={v => set('city', v)} placeholder="Cidade" />
        </Section>
        <Section title="Perfil">
          <Field label="Preferências" value={form.preferences || ''} onChange={v => set('preferences', v)} placeholder="Ex: Perfumes florais, hidratante" multiline />
          <Field label="Observações" value={form.notes || ''} onChange={v => set('notes', v)} placeholder="Informações importantes sobre esta cliente" multiline />
        </Section>
        <button onClick={onSave} className="w-full bg-[#9C2553] text-white font-800 rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-lg shadow-[#9C2553]/30">
          {editMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const colors = ['bg-[#FCEEF4] text-[#9C2553]', 'bg-[#FEF3C7] text-amber-700', 'bg-[#D1FAE5] text-emerald-700', 'bg-[#E0E7FF] text-indigo-700'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-11 h-11 rounded-2xl ${colors[idx]} flex items-center justify-center font-900 text-base shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: 'rose'|'amber'|'green' }) {
  const c = { rose: 'bg-[#FCEEF4] text-[#9C2553]', amber: 'bg-amber-50 text-amber-700', green: 'bg-[#D1FAE5] text-emerald-700' };
  return (
    <div className={`${c[color]} rounded-2xl p-3 text-center`}>
      <p className="font-900 text-sm leading-tight truncate">{value}</p>
      <p className="text-[10px] font-600 opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-[#EDE0E7]">
      <p className="text-[#9C8A93] text-[10px] font-600 uppercase tracking-wide">{icon} {label}</p>
      <p className="text-[#1C1019] text-sm font-600 mt-0.5">{value}</p>
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

function Field({ label, value, onChange, placeholder, type = 'text', multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[#9C8A93] text-[11px] font-700 uppercase tracking-wide mb-1">{label}</p>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full text-sm font-600 text-[#1C1019] bg-transparent outline-none resize-none placeholder:text-[#9C8A93]/60" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-sm font-600 text-[#1C1019] bg-transparent outline-none placeholder:text-[#9C8A93]/60" />
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="font-700 text-[#1C1019] text-base">{title}</p>
      <p className="text-[#9C8A93] text-sm font-500 mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

function isBirthdayMonth(birthday?: string) {
  if (!birthday) return false;
  return birthday.slice(5, 7) === new Date().toISOString().slice(5, 7);
}

function formatBirthday(birthday: string) {
  const [, m, d] = birthday.split('-');
  return `${d}/${m}`;
}

function pmLabel(pm: string) {
  const map: Record<string, string> = { dinheiro: '💵 Dinheiro', pix: '⚡ Pix', credito: '💳 Crédito', debito: '💳 Débito', parcelado: '📆 Parcelado' };
  return map[pm] || pm;
}

function statusStyle(s: string) {
  return { pago: 'text-[#10B981] bg-[#10B981]/10', parcial: 'text-amber-600 bg-amber-50', pendente: 'text-red-500 bg-red-50' }[s] || '';
}

function statusLabel(s: string) {
  return { pago: 'Pago', parcial: 'Parcial', pendente: 'Pendente' }[s] || s;
}
