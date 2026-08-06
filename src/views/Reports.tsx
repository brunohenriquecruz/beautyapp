import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Period = '7d' | '30d' | '90d' | 'all';
type ReportTab = 'sales' | 'products' | 'clients' | 'financial';

export default function Reports() {
  const { sales, products, clients, transactions } = useApp();
  const [period, setPeriod] = useState<Period>('30d');
  const [tab, setTab] = useState<ReportTab>('sales');

  const cutoff = (() => {
    const d = new Date();
    if (period === '7d') d.setDate(d.getDate() - 7);
    else if (period === '30d') d.setDate(d.getDate() - 30);
    else if (period === '90d') d.setDate(d.getDate() - 90);
    else return '2000-01-01';
    return d.toISOString().slice(0, 10);
  })();

  const filteredSales = sales.filter(s => s.date >= cutoff);
  const filteredTx = transactions.filter(t => t.date >= cutoff);

  const totalRevenue = filteredSales.reduce((a, s) => a + s.total, 0);
  const totalExpenses = filteredTx.filter(t => t.type === 'despesa').reduce((a, t) => a + t.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // Top products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredSales.forEach(s => s.items.forEach(item => {
    if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
    productSales[item.productId].qty += item.quantity;
    productSales[item.productId].revenue += item.unitPrice * item.quantity;
  }));
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);

  // Top clients
  const clientSales: Record<string, { name: string; total: number; count: number }> = {};
  filteredSales.forEach(s => {
    if (!clientSales[s.clientId]) clientSales[s.clientId] = { name: s.clientName, total: 0, count: 0 };
    clientSales[s.clientId].total += s.total;
    clientSales[s.clientId].count += 1;
  });
  const topClients = Object.entries(clientSales).sort((a, b) => b[1].total - a[1].total).slice(0, 8);

  // Inadimplentes
  const defaulters = clients.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

  // By payment method
  const byPayment: Record<string, number> = {};
  filteredSales.forEach(s => {
    byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total;
  });

  const pmLabel: Record<string, string> = { pix: '⚡ Pix', dinheiro: '💵 Dinheiro', credito: '💳 Crédito', debito: '💳 Débito', parcelado: '📆 Parcelado' };

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Relatórios" />

      {/* Period selector */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {([['7d', '7 dias'], ['30d', '30 dias'], ['90d', '90 dias'], ['all', 'Tudo']] as [Period, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-full text-xs font-700 transition-all ${period === p ? 'bg-[#9C2553] text-white' : 'bg-white text-[#9C8A93] border border-[#EDE0E7]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KpiMini label="Vendas" value={fmt(totalRevenue)} icon="📈" />
          <KpiMini label="Despesas" value={fmt(totalExpenses)} icon="💸" />
          <KpiMini label="Lucro" value={fmt(totalProfit)} icon="💰" positive={totalProfit >= 0} />
        </div>

        {/* Tab bar */}
        <div className="flex bg-[#EDE0E7]/40 rounded-2xl p-1 mb-4">
          {([['sales', 'Vendas'], ['products', 'Produtos'], ['clients', 'Clientes'], ['financial', 'Financeiro']] as [ReportTab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-700 transition-all ${tab === t ? 'bg-white text-[#9C2553] shadow-sm' : 'text-[#9C8A93]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Sales tab */}
        {tab === 'sales' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4 space-y-3">
              <h3 className="font-800 text-[#1C1019] text-sm">Resumo do período</h3>
              <StatRow label="Total de vendas" value={filteredSales.length.toString()} unit="vendas" />
              <StatRow label="Ticket médio" value={fmt(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0)} />
              <StatRow label="Vendas pagas" value={filteredSales.filter(s => s.status === 'pago').length.toString()} unit="vendas" />
              <StatRow label="Vendas parceladas" value={filteredSales.filter(s => s.paymentMethod === 'parcelado').length.toString()} unit="vendas" />
            </div>

            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4">
              <h3 className="font-800 text-[#1C1019] text-sm mb-3">Por forma de pagamento</h3>
              {Object.entries(byPayment).length === 0 && <p className="text-[#9C8A93] text-sm text-center py-4">Nenhuma venda no período</p>}
              {Object.entries(byPayment).map(([pm, value]) => (
                <div key={pm} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-600 text-[#1C1019]">{pmLabel[pm] || pm}</span>
                    <span className="text-xs font-800 text-[#1C1019]">{fmt(value)}</span>
                  </div>
                  <div className="h-2 bg-[#FBF7F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#9C2553] rounded-full" style={{ width: `${totalRevenue > 0 ? (value / totalRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products tab */}
        {tab === 'products' && (
          <div className="space-y-3">
            <h3 className="font-800 text-[#1C1019]">Mais vendidos</h3>
            {topProducts.length === 0 && <EmptyState icon="📦" text="Nenhuma venda no período selecionado" />}
            {topProducts.map(([id, data], i) => (
              <div key={id} className="bg-white rounded-2xl border border-[#EDE0E7] px-4 py-3 flex items-center gap-3">
                <span className={`text-base font-900 w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-[#9C8A93]' : i === 2 ? 'text-amber-700' : 'text-[#9C8A93]'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#1C1019] truncate">{data.name}</p>
                  <p className="text-[#9C8A93] text-xs">{data.qty} unid. vendidas</p>
                </div>
                <p className="font-800 text-sm text-[#9C2553] shrink-0">{fmt(data.revenue)}</p>
              </div>
            ))}

            <h3 className="font-800 text-[#1C1019] mt-4">Estoque atual</h3>
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#EDE0E7] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FCEEF4] shrink-0">
                  {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">💄</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#1C1019] truncate">{p.name}</p>
                  <p className="text-[#9C8A93] text-xs">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-900 text-base ${p.stock <= p.minStock ? 'text-red-500' : 'text-[#1C1019]'}`}>{p.stock}</p>
                  <p className="text-[#9C8A93] text-[10px]">unid.</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clients tab */}
        {tab === 'clients' && (
          <div className="space-y-3">
            <h3 className="font-800 text-[#1C1019]">Clientes que mais compraram</h3>
            {topClients.length === 0 && <EmptyState icon="👥" text="Nenhuma venda no período selecionado" />}
            {topClients.map(([id, data], i) => (
              <div key={id} className="bg-white rounded-2xl border border-[#EDE0E7] px-4 py-3 flex items-center gap-3">
                <span className="text-base w-6 text-center">{i === 0 ? '⭐' : i === 1 ? '🌟' : i === 2 ? '✨' : `${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#1C1019] truncate">{data.name}</p>
                  <p className="text-[#9C8A93] text-xs">{data.count} compra{data.count !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-800 text-sm text-[#9C2553] shrink-0">{fmt(data.total)}</p>
              </div>
            ))}

            <h3 className="font-800 text-[#1C1019] mt-2">Clientes inadimplentes</h3>
            {defaulters.length === 0 && <EmptyState icon="🎉" text="Nenhuma cliente inadimplente!" />}
            {defaulters.map(client => (
              <div key={client.id} className="bg-red-50 rounded-2xl border border-red-200 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center font-900 text-red-500 shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#1C1019] truncate">{client.name}</p>
                  <p className="text-[#9C8A93] text-xs">{client.phone}</p>
                </div>
                <p className="font-900 text-red-500 shrink-0">{fmt(client.balance)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Financial tab */}
        {tab === 'financial' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4 space-y-3">
              <h3 className="font-800 text-[#1C1019] text-sm">Resultado do período</h3>
              <StatRow label="Receitas" value={fmt(totalRevenue)} positive />
              <StatRow label="Despesas" value={fmt(totalExpenses)} negative />
              <div className="pt-2 border-t border-[#EDE0E7]">
                <div className="flex justify-between">
                  <span className="font-800 text-[#1C1019]">Lucro</span>
                  <span className={`font-900 text-base ${totalProfit >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>{fmt(totalProfit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4">
              <h3 className="font-800 text-[#1C1019] text-sm mb-3">Despesas por categoria</h3>
              {(() => {
                const byCategory: Record<string, number> = {};
                filteredTx.filter(t => t.type === 'despesa').forEach(t => {
                  byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
                });
                const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
                return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                  <div key={cat} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-600 text-[#1C1019]">{cat}</span>
                      <span className="text-xs font-800 text-red-500">{fmt(val)}</span>
                    </div>
                    <div className="h-2 bg-[#FBF7F9] rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${total > 0 ? (val / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ));
              })()}
              {filteredTx.filter(t => t.type === 'despesa').length === 0 && (
                <p className="text-[#9C8A93] text-sm text-center py-4">Nenhuma despesa no período</p>
              )}
            </div>

            {/* Export buttons (decorative — real export needs backend) */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 bg-white border border-[#EDE0E7] rounded-2xl py-3 text-sm font-700 text-[#1C1019] active:scale-95 transition-transform">
                <span>📄</span> Exportar PDF
              </button>
              <button className="flex items-center justify-center gap-2 bg-white border border-[#EDE0E7] rounded-2xl py-3 text-sm font-700 text-[#1C1019] active:scale-95 transition-transform">
                <span>📊</span> Exportar Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiMini({ label, value, icon, positive }: { label: string; value: string; icon: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE0E7] p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className={`text-sm font-900 mt-1 leading-tight ${positive === false ? 'text-red-500' : positive === true ? 'text-[#10B981]' : 'text-[#1C1019]'}`}>{value}</p>
      <p className="text-[#9C8A93] text-[10px] font-600 mt-0.5">{label}</p>
    </div>
  );
}

function StatRow({ label, value, unit, positive, negative }: { label: string; value: string; unit?: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#9C8A93] text-sm font-600">{label}</span>
      <span className={`text-sm font-800 ${positive ? 'text-[#10B981]' : negative ? 'text-red-500' : 'text-[#1C1019]'}`}>
        {value}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-[#9C8A93] text-sm font-600">{text}</p>
    </div>
  );
}
