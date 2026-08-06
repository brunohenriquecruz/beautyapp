import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7);

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { clients, products, sales, transactions } = useApp();

  const todaySales = sales.filter(s => s.date === today);
  const monthSales = sales.filter(s => s.date.startsWith(thisMonth));
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const monthRevenue = monthSales.reduce((a, s) => a + s.total, 0);

  const monthTransactions = transactions.filter(t => t.date.startsWith(thisMonth));
  const monthIncome = monthTransactions.filter(t => t.type === 'receita').reduce((a, t) => a + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'despesa').reduce((a, t) => a + t.amount, 0);
  const monthProfit = monthIncome - monthExpense;

  const pendingInstallments = sales.flatMap(s => (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, clientName: s.clientName, saleId: s.id })));
  const overdueInstallments = pendingInstallments.filter(i => i.dueDate < today);
  const overdueTotal = overdueInstallments.reduce((a, i) => a + i.value, 0);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalDebt = clients.reduce((a, c) => a + c.balance, 0);

  // Birthday clients (this month)
  const birthdayClients = clients.filter(c => {
    if (!c.birthday) return false;
    const bMonth = c.birthday.slice(5, 7);
    return bMonth === thisMonth.slice(5, 7);
  });

  const recentSales = sales.slice(0, 5);

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Beauty Gestão" showSearch />

      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-[#9C2553] to-[#C2185B] px-5 pt-5 pb-8">
        <p className="text-white/70 text-sm font-600">Olá, Gabriela! 👋</p>
        <h2 className="text-white text-2xl font-900 mt-0.5">Hoje, {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <div className="mt-4 bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <p className="text-white/70 text-xs font-600 uppercase tracking-wide">Vendas de Hoje</p>
          <p className="text-white text-3xl font-900 mt-1">{fmt(todayRevenue)}</p>
          <p className="text-white/60 text-xs font-500 mt-1">{todaySales.length} venda{todaySales.length !== 1 ? 's' : ''} realizadas</p>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Vendas do Mês"
            value={fmt(monthRevenue)}
            sub={`${monthSales.length} vendas`}
            color="rose"
            icon="📈"
          />
          <KpiCard
            label="Lucro do Mês"
            value={fmt(monthProfit)}
            sub={monthProfit >= 0 ? 'Positivo ✓' : 'Atenção!'}
            color={monthProfit >= 0 ? 'green' : 'red'}
            icon="💰"
          />
          <KpiCard
            label="A Receber"
            value={fmt(totalDebt)}
            sub={`${clients.filter(c => c.balance > 0).length} clientes`}
            color="amber"
            icon="📋"
            onClick={() => onNavigate('financial')}
          />
          <KpiCard
            label="Parcelas Vencidas"
            value={fmt(overdueTotal)}
            sub={`${overdueInstallments.length} parcela${overdueInstallments.length !== 1 ? 's' : ''}`}
            color={overdueInstallments.length > 0 ? 'red' : 'green'}
            icon="⚠️"
            onClick={() => onNavigate('financial')}
          />
        </div>

        {/* Alerts */}
        {(lowStockProducts.length > 0 || birthdayClients.length > 0) && (
          <div className="space-y-2">
            {lowStockProducts.length > 0 && (
              <Alert
                icon="📦"
                color="amber"
                title={`${lowStockProducts.length} produto${lowStockProducts.length !== 1 ? 's' : ''} com estoque baixo`}
                sub={lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                onClick={() => onNavigate('products')}
              />
            )}
            {birthdayClients.length > 0 && (
              <Alert
                icon="🎂"
                color="rose"
                title={`${birthdayClients.length} aniversariante${birthdayClients.length !== 1 ? 's' : ''} este mês`}
                sub={birthdayClients.slice(0, 2).map(c => c.name.split(' ')[0]).join(', ')}
                onClick={() => onNavigate('clients')}
              />
            )}
          </div>
        )}

        {/* Recent sales */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-800 text-[#1C1019] text-base">Vendas Recentes</h3>
            <button onClick={() => onNavigate('sales')} className="text-[#9C2553] text-sm font-700">Ver todas</button>
          </div>
          <div className="space-y-2">
            {recentSales.length === 0 && (
              <div className="text-center py-8 text-[#9C8A93] text-sm font-600">Nenhuma venda ainda. Que tal começar? 🛍️</div>
            )}
            {recentSales.map(sale => (
              <SaleRow key={sale.id} sale={sale} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="font-800 text-[#1C1019] text-base mb-3">Acesso Rápido</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '👥', label: 'Clientes', page: 'clients' },
              { icon: '📦', label: 'Produtos', page: 'products' },
              { icon: '💳', label: 'Financeiro', page: 'financial' },
              { icon: '📊', label: 'Relatórios', page: 'reports' },
            ].map(a => (
              <button
                key={a.page}
                onClick={() => onNavigate(a.page)}
                className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 shadow-sm border border-[#EDE0E7] active:scale-95 transition-transform"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[10px] font-700 text-[#1C1019]">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon, onClick }: { label: string; value: string; sub: string; color: 'rose'|'green'|'amber'|'red'; icon: string; onClick?: () => void }) {
  const colorMap = {
    rose: 'from-[#9C2553]/5 to-[#9C2553]/10 border-[#9C2553]/20',
    green: 'from-[#10B981]/5 to-[#10B981]/10 border-[#10B981]/20',
    amber: 'from-[#F59E0B]/5 to-[#F59E0B]/10 border-[#F59E0B]/20',
    red: 'from-[#EF4444]/5 to-[#EF4444]/10 border-[#EF4444]/20',
  };
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-3.5 text-left w-full active:scale-95 transition-transform ${onClick ? '' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-[#1C1019] text-base font-900 leading-tight">{value}</p>
      <p className="text-[#9C8A93] text-[10px] font-600 mt-0.5">{label}</p>
      <p className="text-[#9C8A93] text-[10px] font-500 mt-0.5">{sub}</p>
    </button>
  );
}

function Alert({ icon, color, title, sub, onClick }: { icon: string; color: 'amber'|'rose'; title: string; sub: string; onClick: () => void }) {
  const colorMap = {
    amber: 'bg-amber-50 border-amber-200',
    rose: 'bg-[#FCEEF4] border-[#EDE0E7]',
  };
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 ${colorMap[color]} border rounded-2xl px-4 py-3 active:scale-98 transition-transform`}>
      <span className="text-xl shrink-0">{icon}</span>
      <div className="text-left min-w-0">
        <p className="text-[#1C1019] text-sm font-700 leading-tight">{title}</p>
        <p className="text-[#9C8A93] text-xs font-500 truncate">{sub}</p>
      </div>
      <svg className="ml-auto shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C8A93" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}

function SaleRow({ sale }: { sale: ReturnType<typeof useApp>['sales'][0] }) {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const statusColor = { pago: 'text-[#10B981] bg-[#10B981]/10', parcial: 'text-amber-600 bg-amber-50', pendente: 'text-red-500 bg-red-50' };
  const statusLabel = { pago: 'Pago', parcial: 'Parcial', pendente: 'Pendente' };
  const pmIcon = { dinheiro: '💵', pix: '⚡', credito: '💳', debito: '💳', parcelado: '📆' };

  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-[#EDE0E7] flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#FCEEF4] flex items-center justify-center shrink-0 text-base">
        {pmIcon[sale.paymentMethod]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-700 text-[#1C1019] text-sm leading-tight truncate">{sale.clientName}</p>
        <p className="text-[#9C8A93] text-xs font-500">{new Date(sale.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="font-800 text-[#1C1019] text-sm">{fmt(sale.total)}</p>
        <span className={`text-[10px] font-700 px-1.5 py-0.5 rounded-full ${statusColor[sale.status]}`}>{statusLabel[sale.status]}</span>
      </div>
    </div>
  );
}
