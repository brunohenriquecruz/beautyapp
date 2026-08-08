import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CreditCard,
  DollarSign,
  Gift,
  Package,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import type React from "react";
import { useApp } from "../context/AppContext";
import TopBar from "../components/TopBar";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7);

interface DashboardProps {
  onNavigate: (page: string) => void;
}

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type Tone = "aqua" | "green" | "amber" | "red";

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { clients, products, sales, transactions } = useApp();

  const todaySales = sales.filter(s => s.date === today);
  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const monthRevenue = monthSales.reduce((a, s) => a + s.total, 0);

  const monthTransactions = transactions.filter(t => t.date.startsWith(thisMonth));
  const monthIncome = monthTransactions.filter(t => t.type === "receita").reduce((a, t) => a + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
  const monthProfit = monthIncome - monthExpense;

  const pendingInstallments = sales.flatMap(s => (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, clientName: s.clientName, saleId: s.id })));
  const overdueInstallments = pendingInstallments.filter(i => i.dueDate < today);
  const overdueTotal = overdueInstallments.reduce((a, i) => a + i.value, 0);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalDebt = clients.reduce((a, c) => a + c.balance, 0);

  const birthdayClients = clients.filter(c => {
    if (!c.birthday) return false;
    const bMonth = c.birthday.slice(5, 7);
    return bMonth === thisMonth.slice(5, 7);
  });

  const recentSales = sales.slice(0, 5);

  return (
    <div className="pb-24 page-enter">
      <TopBar title="BellaFlow" showSearch />

      <div className="bg-brand-gradient px-5 pt-5 pb-8">
        <p className="flex items-center gap-2 text-white/75 text-sm font-600">
          <span className="h-7 w-7 rounded-xl bg-white/18 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          Ola, Alyne
        </p>
        <h2 className="text-white text-2xl font-900 mt-1">
          Hoje, {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <div className="mt-4 bg-white/18 rounded-2xl p-4 backdrop-blur-sm border border-white/25 shadow-[0_18px_40px_rgba(5,150,155,0.25)]">
          <p className="text-white/75 text-xs font-700 uppercase tracking-wide">Vendas de Hoje</p>
          <p className="text-white text-3xl font-900 mt-1">{fmt(todayRevenue)}</p>
          <p className="text-white/70 text-xs font-500 mt-1">{todaySales.length} venda{todaySales.length !== 1 ? "s" : ""} realizadas</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Vendas do Mes" value={fmt(monthRevenue)} sub={`${monthSales.length} vendas`} tone="aqua" icon={TrendingUp} />
          <KpiCard label="Lucro do Mes" value={fmt(monthProfit)} sub={monthProfit >= 0 ? "Positivo" : "Atencao"} tone={monthProfit >= 0 ? "green" : "red"} icon={DollarSign} />
          <KpiCard label="A Receber" value={fmt(totalDebt)} sub={`${clients.filter(c => c.balance > 0).length} clientes`} tone="amber" icon={ReceiptText} onClick={() => onNavigate("financial")} />
          <KpiCard label="Parcelas Vencidas" value={fmt(overdueTotal)} sub={`${overdueInstallments.length} parcela${overdueInstallments.length !== 1 ? "s" : ""}`} tone={overdueInstallments.length > 0 ? "red" : "green"} icon={AlertTriangle} onClick={() => onNavigate("financial")} />
        </div>

        {(lowStockProducts.length > 0 || birthdayClients.length > 0) && (
          <div className="space-y-2">
            {lowStockProducts.length > 0 && (
              <Alert icon={Package} tone="amber" title={`${lowStockProducts.length} produto${lowStockProducts.length !== 1 ? "s" : ""} com estoque baixo`} sub="Reposicao recomendada para evitar falta" onClick={() => onNavigate("products")} />
            )}
            {birthdayClients.length > 0 && (
              <Alert icon={Gift} tone="aqua" title={`${birthdayClients.length} aniversariante${birthdayClients.length !== 1 ? "s" : ""} este mes`} sub={birthdayClients.slice(0, 2).map(c => c.name.split(" ")[0]).join(", ")} onClick={() => onNavigate("clients")} />
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-800 text-[#102326] text-base">Vendas Recentes</h3>
            <button onClick={() => onNavigate("sales")} className="text-[#08AFC8] text-sm font-800">Ver todas</button>
          </div>
          <div className="space-y-2">
            {recentSales.length === 0 && (
              <div className="text-center py-8 text-[#6D8185] text-sm font-600">Nenhuma venda ainda. Que tal comecar?</div>
            )}
            {recentSales.map(sale => (
              <SaleRow key={sale.id} sale={sale} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-800 text-[#102326] text-base mb-3">Acesso Rapido</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Users, label: "Clientes", page: "clients" },
              { icon: Package, label: "Produtos", page: "products" },
              { icon: WalletCards, label: "Financeiro", page: "financial" },
              { icon: BarChart3, label: "Relatorios", page: "reports" },
            ].map(action => (
              <button
                key={action.page}
                onClick={() => onNavigate(action.page)}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl p-3 shadow-sm border border-[#D9EEF0] active:scale-95 transition-transform"
              >
                <span className="h-10 w-10 rounded-xl icon-gradient-main flex items-center justify-center">
                  <action.icon className="h-[22px] w-[22px]" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-800 text-[#102326]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, tone, icon: Icon, onClick }: { label: string; value: string; sub: string; tone: Tone; icon: IconComponent; onClick?: () => void }) {
  const toneMap = {
    aqua: "from-[#1FCDE2]/10 to-[#71EE9E]/16 border-[#BDEFF0] text-[#08AFC8]",
    green: "from-[#67EFA2]/12 to-[#20C997]/10 border-[#BCEFD0] text-[#18B976]",
    amber: "from-[#F59E0B]/8 to-[#24D6C8]/8 border-[#F7D58C] text-[#D89009]",
    red: "from-[#EF4444]/8 to-[#1FCDE2]/8 border-[#F5BBBB] text-[#EF4444]",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white bg-gradient-to-br ${toneMap[tone]} border rounded-2xl p-3.5 text-left w-full shadow-[0_14px_32px_rgba(8,175,200,0.13)] active:scale-95 transition-transform ${onClick ? "" : "cursor-default"}`}
    >
      <div className="mb-2 h-10 w-10 rounded-xl icon-gradient-main flex items-center justify-center">
        <Icon className="h-[22px] w-[22px]" strokeWidth={2.25} />
      </div>
      <p className="text-[#102326] text-base font-900 leading-tight">{value}</p>
      <p className="text-[#61797D] text-[10px] font-700 mt-0.5">{label}</p>
      <p className="text-[#6D8185] text-[10px] font-500 mt-0.5">{sub}</p>
    </button>
  );
}

function Alert({ icon: Icon, tone, title, sub, onClick }: { icon: IconComponent; tone: "amber" | "aqua"; title: string; sub: string; onClick: () => void }) {
  const toneMap = {
    amber: "bg-[#FFF9EA] border-[#F4D77B] text-[#D89009]",
    aqua: "bg-[#EFFDF7] border-[#BDEFF0] text-[#08AFC8]",
  };

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 ${toneMap[tone]} border rounded-2xl px-4 py-3 active:scale-98 transition-transform`}>
      <span className="h-9 w-9 rounded-xl icon-gradient-list flex items-center justify-center shrink-0">
        <Icon className="h-[17px] w-[17px]" strokeWidth={2.2} />
      </span>
      <div className="text-left min-w-0">
        <p className="text-[#102326] text-sm font-800 leading-tight">{title}</p>
        <p className="text-[#6D8185] text-xs font-500 truncate">{sub}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[#6D8185]" strokeWidth={2.4} />
    </button>
  );
}

function SaleRow({ sale }: { sale: ReturnType<typeof useApp>["sales"][0] }) {
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const statusColor = { pago: "text-[#18B976] bg-[#E9FBF5]", parcial: "text-amber-600 bg-amber-50", pendente: "text-red-500 bg-red-50" };
  const statusLabel = { pago: "Pago", parcial: "Parcial", pendente: "Pendente" };
  const pmIcon = { dinheiro: DollarSign, pix: Zap, credito: CreditCard, debito: CreditCard, parcelado: CalendarDays };
  const PaymentIcon = pmIcon[sale.paymentMethod];

  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-[#D9EEF0] flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl icon-gradient-list flex items-center justify-center shrink-0">
        <PaymentIcon className="h-4 w-4" strokeWidth={2.15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-800 text-[#102326] text-sm leading-tight truncate">{sale.clientName}</p>
        <p className="text-[#6D8185] text-xs font-500">{new Date(sale.date + "T12:00:00").toLocaleDateString("pt-BR")} - {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="font-800 text-[#102326] text-sm">{fmt(sale.total)}</p>
        <span className={`text-[10px] font-800 px-1.5 py-0.5 rounded-full ${statusColor[sale.status]}`}>{statusLabel[sale.status]}</span>
      </div>
    </div>
  );
}
