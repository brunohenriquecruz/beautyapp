import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Edit3,
  Gift,
  History,
  Mail,
  MapPin,
  MessageCircle,
  NotebookText,
  Package,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  User,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import { useApp } from "../context/AppContext";
import TopBar from "../components/TopBar";
import type { Client } from "../types";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = new Date().toISOString().slice(0, 10);

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type ClientTab = "info" | "history" | "installments";

export default function Clients() {
  const { clients, addClient, updateClient, sales, searchQuery } = useApp();
  const [view, setView] = useState<"list" | "detail" | "form">("list");
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});
  const [editMode, setEditMode] = useState(false);

  const filtered = clients.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery),
  ).sort((a, b) => b.totalPurchases - a.totalPurchases);

  const openDetail = (c: Client) => {
    setSelected(c);
    setView("detail");
  };

  const openNew = () => {
    setForm({});
    setEditMode(false);
    setView("form");
  };

  const openEdit = (c: Client) => {
    setForm(c);
    setEditMode(true);
    setView("form");
  };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editMode && form.id) updateClient(form as Client);
    else addClient(form as Omit<Client, "id" | "createdAt" | "totalPurchases" | "balance">);
    setView("list");
  };

  if (view === "form") return <ClientForm form={form} setForm={setForm} onSave={handleSave} onBack={() => setView("list")} editMode={editMode} />;
  if (view === "detail" && selected) return <ClientDetail client={selected} sales={sales} onBack={() => setView("list")} onEdit={() => openEdit(selected)} />;

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Clientes" showSearch rightElement={
        <button onClick={openNew} className="w-9 h-9 icon-gradient flex shrink-0 items-center justify-center rounded-full active:scale-95 transition-transform">
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </button>
      } />

      <div className="px-4 pt-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Total" value={clients.length.toString()} icon={Users} tone="aqua" />
          <StatPill label="Devedores" value={clients.filter(c => c.balance > 0).length.toString()} icon={AlertTriangle} tone="amber" />
          <StatPill label="A Receber" value={fmt(clients.reduce((a, c) => a + c.balance, 0))} icon={WalletCards} tone="green" />
        </div>

        {filtered.length === 0 && <EmptyState icon={Users} title="Nenhum cliente encontrado" sub="Toque em + para cadastrar seu primeiro cliente" />}
        {filtered.map(client => (
          <button key={client.id} onClick={() => openDetail(client)} className="w-full bg-white rounded-2xl px-4 py-3.5 border border-[#D9EEF0] flex items-center gap-3 active:scale-98 transition-transform shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
            <Avatar name={client.name} />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="font-800 text-[#102326] text-sm leading-tight truncate">{client.name}</p>
                {isBirthdayMonth(client.birthday) && <Gift className="h-4 w-4 text-[#D89009] shrink-0" strokeWidth={2.2} />}
              </div>
              <p className="text-[#6D8185] text-xs font-500 mt-0.5">{client.phone}</p>
              <p className="text-[#6D8185] text-[11px] font-500 mt-0.5">{client.neighborhood && `${client.neighborhood} - `}Total: {fmt(client.totalPurchases)}</p>
            </div>
            <div className="shrink-0 text-right">
              {client.balance > 0 ? (
                <div>
                  <p className="text-red-500 text-sm font-900">{fmt(client.balance)}</p>
                  <p className="text-red-400 text-[10px] font-700">devendo</p>
                </div>
              ) : (
                <span className="text-[10px] font-800 text-[#18B976] bg-[#E9FBF5] px-2 py-1 rounded-full">Em dia</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientDetail({ client, sales, onBack, onEdit }: { client: Client; sales: ReturnType<typeof useApp>["sales"]; onBack: () => void; onEdit: () => void }) {
  const clientSales = sales.filter(s => s.clientId === client.id);
  const [tab, setTab] = useState<ClientTab>("info");
  const pendingInstallments = clientSales.flatMap(s => (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, saleName: s.date })));

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Perfil da Cliente" showBack onBack={onBack} rightElement={
        <button onClick={onEdit} className="flex items-center gap-1.5 text-[#08AFC8] text-sm font-800">
          <Edit3 className="h-4 w-4" strokeWidth={2.3} />
          Editar
        </button>
      } />

      <div className="bg-brand-gradient px-4 pt-4 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/18 border border-white/24 flex items-center justify-center text-2xl font-900 text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-900 text-white truncate">{client.name}</h2>
            <p className="text-white/72 text-sm font-600">{client.phone}</p>
            {client.birthday && (
              <p className="text-white/68 text-xs font-600 mt-1 flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" strokeWidth={2.2} />
                {formatBirthday(client.birthday)}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <HeroMetric label="Total Comprado" value={fmt(client.totalPurchases)} icon={ReceiptText} />
          <HeroMetric label="Saldo Devedor" value={fmt(client.balance)} icon={WalletCards} warning={client.balance > 0} />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-[#D9EEF0] p-1 grid grid-cols-3 gap-1 shadow-sm">
          {([
            ["info", "Dados", User],
            ["history", "Historico", History],
            ["installments", "Parcelas", CalendarDays],
          ] as [ClientTab, string, IconComponent][]).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-800 transition-all ${tab === t ? "bg-brand-gradient text-white" : "text-[#6D8185]"}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              {label}
              {t === "installments" && pendingInstallments.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingInstallments.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-3">
            <InfoRow icon={MapPin} label="Endereco" value={[client.address, client.neighborhood, client.city].filter(Boolean).join(", ") || "-"} />
            <InfoRow icon={Mail} label="E-mail" value={client.email || "-"} />
            <InfoRow icon={Sparkles} label="Preferencias" value={client.preferences || "-"} />
            <InfoRow icon={NotebookText} label="Observacoes" value={client.notes || "-"} />
            <InfoRow icon={CalendarDays} label="Cliente desde" value={client.createdAt ? new Date(client.createdAt + "T12:00:00").toLocaleDateString("pt-BR") : "-"} />

            <a href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-800 rounded-2xl py-3.5 active:scale-95 transition-transform shadow-[0_12px_24px_rgba(37,211,102,0.22)]">
              <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
              Enviar mensagem no WhatsApp
            </a>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {clientSales.length === 0 && <EmptyState icon={Package} title="Sem compras" sub="Esta cliente ainda nao fez compras" />}
            {clientSales.map(sale => {
              const PaymentIcon = paymentIcon(sale.paymentMethod);
              return (
                <div key={sale.id} className="bg-white rounded-2xl px-4 py-3 border border-[#D9EEF0] shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-8 w-8 rounded-xl icon-gradient-list flex items-center justify-center shrink-0">
                        <PaymentIcon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <p className="font-800 text-sm text-[#102326]">{new Date(sale.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p className="font-900 text-sm text-[#102326] shrink-0">{fmt(sale.total)}</p>
                  </div>
                  <p className="text-[#6D8185] text-xs mt-2">{sale.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-700 text-[#6D8185]">{pmLabel(sale.paymentMethod)}</span>
                    <span className={`text-[10px] font-800 px-2 py-0.5 rounded-full ${statusStyle(sale.status)}`}>{statusLabel(sale.status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "installments" && (
          <div className="space-y-2">
            {pendingInstallments.length === 0 && <EmptyState icon={CheckCircle2} title="Sem parcelas pendentes" sub="Esta cliente esta em dia com os pagamentos" />}
            {pendingInstallments.map(inst => {
              const overdue = inst.dueDate < today;
              return (
                <div key={inst.id} className={`bg-white rounded-2xl px-4 py-3 border flex items-center gap-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${overdue ? "border-red-200" : "border-[#D9EEF0]"}`}>
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${overdue ? "bg-red-50 text-red-500" : "icon-gradient-list"}`}>
                    {overdue ? <AlertTriangle className="h-4 w-4" strokeWidth={2.2} /> : <CalendarDays className="h-4 w-4" strokeWidth={2.2} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-800 text-sm text-[#102326]">Parcela {inst.number}</p>
                    <p className="text-[#6D8185] text-xs mt-0.5">Vence: {new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                    {overdue && <p className="text-[10px] font-800 text-red-500 mt-0.5">Vencida</p>}
                  </div>
                  <p className="font-900 text-sm text-[#102326] shrink-0">{fmt(inst.value)}</p>
                </div>
              );
            })}
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
      <TopBar title={editMode ? "Editar Cliente" : "Novo Cliente"} showBack onBack={onBack} />
      <div className="px-4 pt-4 space-y-4">
        <Section title="Dados Pessoais">
          <Field label="Nome completo *" value={form.name || ""} onChange={v => set("name", v)} placeholder="Ex: Maria Silva" />
          <Field label="Telefone / WhatsApp *" value={form.phone || ""} onChange={v => set("phone", v)} placeholder="(00) 99999-9999" type="tel" />
          <Field label="E-mail" value={form.email || ""} onChange={v => set("email", v)} placeholder="email@exemplo.com" type="email" />
          <Field label="Data de aniversario" value={form.birthday || ""} onChange={v => set("birthday", v)} type="date" />
        </Section>
        <Section title="Endereco">
          <Field label="Endereco" value={form.address || ""} onChange={v => set("address", v)} placeholder="Rua, numero" />
          <Field label="Bairro" value={form.neighborhood || ""} onChange={v => set("neighborhood", v)} placeholder="Bairro" />
          <Field label="Cidade" value={form.city || ""} onChange={v => set("city", v)} placeholder="Cidade" />
        </Section>
        <Section title="Perfil">
          <Field label="Preferencias" value={form.preferences || ""} onChange={v => set("preferences", v)} placeholder="Ex: Perfumes florais, hidratante" multiline />
          <Field label="Observacoes" value={form.notes || ""} onChange={v => set("notes", v)} placeholder="Informacoes importantes sobre esta cliente" multiline />
        </Section>
        <button onClick={onSave} className="w-full bg-brand-gradient text-white font-800 rounded-2xl py-4 text-base active:scale-95 transition-transform shadow-[0_16px_28px_rgba(31,205,226,0.22)]">
          {editMode ? "Salvar Alteracoes" : "Cadastrar Cliente"}
        </button>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-11 h-11 rounded-2xl icon-gradient-list flex items-center justify-center font-900 text-base shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatPill({ label, value, icon: Icon, tone }: { label: string; value: string; icon: IconComponent; tone: "aqua" | "amber" | "green" }) {
  const c = {
    aqua: "from-[#1FCDE2]/10 to-[#71EE9E]/16 border-[#BDEFF0] text-[#08AFC8]",
    amber: "from-[#F59E0B]/8 to-[#24D6C8]/8 border-[#F7D58C] text-[#D89009]",
    green: "from-[#67EFA2]/12 to-[#20C997]/10 border-[#BCEFD0] text-[#18B976]",
  };
  return (
    <div className={`bg-white bg-gradient-to-br ${c[tone]} border rounded-2xl p-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)]`}>
      <Icon className="h-4 w-4 mb-1" strokeWidth={2.3} />
      <p className="font-900 text-sm leading-tight truncate text-[#102326]">{value}</p>
      <p className="text-[10px] font-700 mt-0.5 text-[#6D8185]">{label}</p>
    </div>
  );
}

function HeroMetric({ label, value, icon: Icon, warning }: { label: string; value: string; icon: IconComponent; warning?: boolean }) {
  return (
    <div className="bg-white/16 rounded-2xl p-3 border border-white/22">
      <Icon className="h-4 w-4 text-white/75 mb-2" strokeWidth={2.2} />
      <p className="text-white/65 text-[10px] font-700 uppercase">{label}</p>
      <p className={`text-lg font-900 leading-tight ${warning ? "text-yellow-200" : "text-white"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-[#D9EEF0] shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
      <p className="text-[#6D8185] text-[10px] font-800 uppercase tracking-wide flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#08AFC8]" strokeWidth={2.25} />
        {label}
      </p>
      <p className="text-[#102326] text-sm font-700 mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#6D8185] text-xs font-800 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-[#D9EEF0] overflow-hidden divide-y divide-[#D9EEF0] shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[#6D8185] text-[11px] font-800 uppercase tracking-wide mb-1">{label}</p>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full text-sm font-700 text-[#102326] bg-transparent outline-none resize-none placeholder:text-[#6D8185]/60" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm font-700 text-[#102326] bg-transparent outline-none placeholder:text-[#6D8185]/60" />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: IconComponent; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="h-12 w-12 rounded-2xl icon-gradient-list flex items-center justify-center mb-3">
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <p className="font-800 text-[#102326] text-base">{title}</p>
      <p className="text-[#6D8185] text-sm font-600 mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

function isBirthdayMonth(birthday?: string) {
  if (!birthday) return false;
  return birthday.slice(5, 7) === new Date().toISOString().slice(5, 7);
}

function formatBirthday(birthday: string) {
  const [, m, d] = birthday.split("-");
  return `${d}/${m}`;
}

function paymentIcon(pm: string) {
  const map: Record<string, IconComponent> = { dinheiro: Banknote, pix: Zap, credito: CreditCard, debito: CreditCard, parcelado: CalendarDays };
  return map[pm] || DollarSign;
}

function pmLabel(pm: string) {
  const map: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", credito: "Credito", debito: "Debito", parcelado: "Parcelado" };
  return map[pm] || pm;
}

function statusStyle(s: string) {
  return { pago: "text-[#18B976] bg-[#E9FBF5]", parcial: "text-amber-600 bg-amber-50", pendente: "text-red-500 bg-red-50" }[s] || "";
}

function statusLabel(s: string) {
  return { pago: "Pago", parcial: "Parcial", pendente: "Pendente" }[s] || s;
}
