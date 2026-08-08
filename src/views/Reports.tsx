import {
  Award,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  PackageSearch,
  Sheet,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import { useApp } from "../context/AppContext";
import TopBar from "../components/TopBar";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Period = "7d" | "30d" | "90d" | "all";
type ReportTab = "sales" | "products" | "clients" | "financial";
type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const periods: [Period, string][] = [["7d", "7 dias"], ["30d", "30 dias"], ["90d", "90 dias"], ["all", "Tudo"]];
const tabs: { id: ReportTab; label: string; icon: IconComponent }[] = [
  { id: "sales", label: "Vendas", icon: BarChart3 },
  { id: "products", label: "Produtos", icon: Package },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "financial", label: "Financeiro", icon: WalletCards },
];

const paymentMap: Record<string, { label: string; icon: IconComponent }> = {
  pix: { label: "Pix", icon: Zap },
  dinheiro: { label: "Dinheiro", icon: Banknote },
  credito: { label: "Credito", icon: CreditCard },
  debito: { label: "Debito", icon: CreditCard },
  parcelado: { label: "Parcelado", icon: CalendarDays },
};

export default function Reports() {
  const { sales, products, clients, transactions } = useApp();
  const [period, setPeriod] = useState<Period>("30d");
  const [tab, setTab] = useState<ReportTab>("sales");

  const cutoff = (() => {
    const d = new Date();
    if (period === "7d") d.setDate(d.getDate() - 7);
    else if (period === "30d") d.setDate(d.getDate() - 30);
    else if (period === "90d") d.setDate(d.getDate() - 90);
    else return "2000-01-01";
    return d.toISOString().slice(0, 10);
  })();

  const filteredSales = sales.filter(s => s.date >= cutoff);
  const filteredTx = transactions.filter(t => t.date >= cutoff);
  const totalRevenue = filteredSales.reduce((a, s) => a + s.total, 0);
  const totalExpenses = filteredTx.filter(t => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredSales.forEach(s => s.items.forEach(item => {
    if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
    productSales[item.productId].qty += item.quantity;
    productSales[item.productId].revenue += item.unitPrice * item.quantity;
  }));
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);

  const clientSales: Record<string, { name: string; total: number; count: number }> = {};
  filteredSales.forEach(s => {
    if (!clientSales[s.clientId]) clientSales[s.clientId] = { name: s.clientName, total: 0, count: 0 };
    clientSales[s.clientId].total += s.total;
    clientSales[s.clientId].count += 1;
  });
  const topClients = Object.entries(clientSales).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const defaulters = clients.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

  const byPayment: Record<string, number> = {};
  filteredSales.forEach(s => {
    byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total;
  });

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Relatorios" />

      <div className="bg-brand-gradient px-4 pt-4 pb-8">
        <p className="text-white/75 text-xs font-700 uppercase tracking-wide mb-3">Analise do periodo</p>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="Vendas" value={fmt(totalRevenue)} icon={TrendingUp} />
          <SummaryCard label="Despesas" value={fmt(totalExpenses)} icon={TrendingDown} />
          <SummaryCard label="Lucro" value={fmt(totalProfit)} icon={DollarSign} />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {periods.map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-9 rounded-xl text-xs font-800 transition-all ${period === p ? "bg-brand-gradient text-white shadow-[0_10px_22px_rgba(31,205,226,0.22)]" : "bg-white text-[#6D8185] border border-[#D9EEF0]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#D9EEF0] p-1 grid grid-cols-4 gap-1 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-800 transition-all leading-tight ${tab === id ? "bg-brand-gradient text-white" : "text-[#6D8185]"}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              {label}
            </button>
          ))}
        </div>

        {tab === "sales" && (
          <div className="space-y-3">
            <Panel title="Resumo do periodo" icon={BarChart3}>
              <StatRow label="Total de vendas" value={filteredSales.length.toString()} unit="vendas" />
              <StatRow label="Ticket medio" value={fmt(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0)} />
              <StatRow label="Vendas pagas" value={filteredSales.filter(s => s.status === "pago").length.toString()} unit="vendas" />
              <StatRow label="Vendas parceladas" value={filteredSales.filter(s => s.paymentMethod === "parcelado").length.toString()} unit="vendas" />
            </Panel>

            <Panel title="Por forma de pagamento" icon={CreditCard}>
              {Object.entries(byPayment).length === 0 && <EmptyState icon={WalletCards} text="Nenhuma venda no periodo" />}
              {Object.entries(byPayment).map(([pm, value]) => {
                const payment = paymentMap[pm] || { label: pm, icon: CreditCard };
                const Icon = payment.icon;
                return (
                  <div key={pm} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="flex items-center gap-2 text-xs font-700 text-[#102326]">
                        <span className="h-7 w-7 rounded-xl icon-gradient-list flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </span>
                        {payment.label}
                      </span>
                      <span className="text-xs font-900 text-[#102326]">{fmt(value)}</span>
                    </div>
                    <Progress value={totalRevenue > 0 ? (value / totalRevenue) * 100 : 0} />
                  </div>
                );
              })}
            </Panel>
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-3">
            <SectionTitle icon={Award} title="Mais vendidos" />
            {topProducts.length === 0 && <EmptyState icon={PackageSearch} text="Nenhuma venda no periodo selecionado" />}
            {topProducts.map(([id, data], i) => (
              <RankRow key={id} rank={i + 1} icon={Package} title={data.name} sub={`${data.qty} unid. vendidas`} value={fmt(data.revenue)} />
            ))}

            <SectionTitle icon={Package} title="Estoque atual" />
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#D9EEF0] px-4 py-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#E9FBF5] text-[#08AFC8] flex items-center justify-center shrink-0">
                  {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5" strokeWidth={2.2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-800 text-sm text-[#102326] truncate">{p.name}</p>
                  <p className="text-[#6D8185] text-xs">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-900 text-base ${p.stock <= p.minStock ? "text-red-500" : "text-[#102326]"}`}>{p.stock}</p>
                  <p className="text-[#6D8185] text-[10px]">unid.</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "clients" && (
          <div className="space-y-3">
            <SectionTitle icon={Star} title="Clientes que mais compraram" />
            {topClients.length === 0 && <EmptyState icon={Users} text="Nenhuma venda no periodo selecionado" />}
            {topClients.map(([id, data], i) => (
              <RankRow key={id} rank={i + 1} icon={Users} title={data.name} sub={`${data.count} compra${data.count !== 1 ? "s" : ""}`} value={fmt(data.total)} />
            ))}

            <SectionTitle icon={WalletCards} title="Clientes inadimplentes" />
            {defaulters.length === 0 && <EmptyState icon={CheckCircle2} text="Nenhuma cliente inadimplente" />}
            {defaulters.map(client => (
              <div key={client.id} className="bg-white rounded-2xl border border-red-200 px-4 py-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(239,68,68,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-900 shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-800 text-sm text-[#102326] truncate">{client.name}</p>
                  <p className="text-[#6D8185] text-xs">{client.phone}</p>
                </div>
                <p className="font-900 text-red-500 shrink-0">{fmt(client.balance)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "financial" && (
          <div className="space-y-3">
            <Panel title="Resultado do periodo" icon={WalletCards}>
              <StatRow label="Receitas" value={fmt(totalRevenue)} positive />
              <StatRow label="Despesas" value={fmt(totalExpenses)} negative />
              <div className="pt-2 border-t border-[#D9EEF0]">
                <div className="flex justify-between">
                  <span className="font-800 text-[#102326]">Lucro</span>
                  <span className={`font-900 text-base ${totalProfit >= 0 ? "text-[#18B976]" : "text-red-500"}`}>{fmt(totalProfit)}</span>
                </div>
              </div>
            </Panel>

            <Panel title="Despesas por categoria" icon={TrendingDown}>
              <ExpenseCategories filteredTx={filteredTx} />
            </Panel>

            <div className="grid grid-cols-2 gap-2">
              <ExportButton icon={FileText} label="Exportar PDF" />
              <ExportButton icon={Sheet} label="Exportar Excel" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: IconComponent }) {
  return (
    <div className="rounded-2xl p-3 border border-white/22 bg-white/14 text-white">
      <div className="h-7 w-7 rounded-xl bg-white/18 flex items-center justify-center mb-2">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <p className="text-white/65 text-[10px] font-700 uppercase">{label}</p>
      <p className="text-white text-sm font-900 mt-0.5 leading-tight">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: IconComponent; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9EEF0] p-4 space-y-3 shadow-[0_12px_28px_rgba(8,175,200,0.09)]">
      <h3 className="font-800 text-[#102326] text-sm flex items-center gap-2">
        <span className="h-8 w-8 rounded-xl icon-gradient-list flex items-center justify-center">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: IconComponent; title: string }) {
  return (
    <h3 className="font-800 text-[#102326] flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#08AFC8]" strokeWidth={2.3} />
      {title}
    </h3>
  );
}

function RankRow({ rank, icon: Icon, title, sub, value }: { rank: number; icon: IconComponent; title: string; sub: string; value: string }) {
  const rankClass = rank === 1 ? "bg-[#FFF9EA] text-[#D89009]" : rank === 2 ? "bg-[#F4FFFB] text-[#08AFC8]" : rank === 3 ? "bg-[#EFFDF7] text-[#18B976]" : "bg-white text-[#6D8185]";

  return (
    <div className="bg-white rounded-2xl border border-[#D9EEF0] px-4 py-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
      <span className={`h-9 w-9 rounded-xl border border-[#D9EEF0] flex items-center justify-center shrink-0 ${rankClass}`}>
        {rank <= 3 ? <Award className="h-4 w-4" strokeWidth={2.25} /> : <span className="text-xs font-900">{rank}</span>}
      </span>
      <div className="h-9 w-9 rounded-xl icon-gradient-list flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-800 text-sm text-[#102326] truncate">{title}</p>
        <p className="text-[#6D8185] text-xs">{sub}</p>
      </div>
      <p className="font-900 text-sm text-[#08AFC8] shrink-0">{value}</p>
    </div>
  );
}

function StatRow({ label, value, unit, positive, negative }: { label: string; value: string; unit?: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-[#6D8185] text-sm font-600">{label}</span>
      <span className={`text-sm font-900 text-right ${positive ? "text-[#18B976]" : negative ? "text-red-500" : "text-[#102326]"}`}>
        {value}{unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 bg-[#F4FFFB] rounded-full overflow-hidden">
      <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ExpenseCategories({ filteredTx }: { filteredTx: ReturnType<typeof useApp>["transactions"] }) {
  const byCategory: Record<string, number> = {};
  filteredTx.filter(t => t.type === "despesa").forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return <EmptyState icon={TrendingDown} text="Nenhuma despesa no periodo" />;

  return entries.map(([cat, val]) => (
    <div key={cat} className="mb-3 last:mb-0">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-700 text-[#102326]">{cat}</span>
        <span className="text-xs font-900 text-red-500">{fmt(val)}</span>
      </div>
      <div className="h-2 bg-[#F4FFFB] rounded-full overflow-hidden">
        <div className="h-full bg-red-400 rounded-full" style={{ width: `${total > 0 ? (val / total) * 100 : 0}%` }} />
      </div>
    </div>
  ));
}

function EmptyState({ icon: Icon, text }: { icon: IconComponent; text: string }) {
  return (
    <div className="py-8 text-center text-[#6D8185] text-sm font-600 flex flex-col items-center gap-2">
      <span className="h-10 w-10 rounded-2xl icon-gradient-list flex items-center justify-center">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {text}
    </div>
  );
}

function ExportButton({ icon: Icon, label }: { icon: IconComponent; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 bg-white border border-[#D9EEF0] rounded-2xl py-3 text-sm font-800 text-[#102326] shadow-[0_10px_24px_rgba(8,175,200,0.08)] active:scale-95 transition-transform">
      <Icon className="h-4 w-4 text-[#08AFC8]" strokeWidth={2.25} />
      {label}
    </button>
  );
}
