import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7);

type Tab = 'overview' | 'receivable' | 'expenses' | 'installments';

export default function Financial() {
  const { transactions, sales, clients, addTransaction, markInstallmentPaid } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Estoque' });

  const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
  const monthIncome = monthTx.filter(t => t.type === 'receita').reduce((a, t) => a + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'despesa').reduce((a, t) => a + t.amount, 0);
  const monthProfit = monthIncome - monthExpense;

  const allPendingInstallments = sales.flatMap(s =>
    (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, clientName: s.clientName, saleId: s.id, clientId: s.clientId }))
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const overdue = allPendingInstallments.filter(i => i.dueDate < today);
  const upcoming = allPendingInstallments.filter(i => i.dueDate >= today);

  const debtClients = clients.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

  const expenseCategories = ['Estoque', 'Transporte', 'Materiais', 'Marketing', 'Outros'];

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) return;
    addTransaction({
      type: 'despesa',
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      date: today,
      category: expenseForm.category,
    });
    setExpenseForm({ description: '', amount: '', category: 'Estoque' });
    setShowAddExpense(false);
  };

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Financeiro" />

      {/* Summary cards */}
      <div className="bg-gradient-to-br from-[#9C2553] to-[#C2185B] px-4 pt-4 pb-8">
        <p className="text-white/70 text-xs font-600 uppercase tracking-wide mb-3">Resumo de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="Receita" value={fmt(monthIncome)} color="green" />
          <SummaryCard label="Despesas" value={fmt(monthExpense)} color="amber" />
          <SummaryCard label="Lucro" value={fmt(monthProfit)} color={monthProfit >= 0 ? 'emerald' : 'red'} />
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-[#EDE0E7] p-1 grid grid-cols-4 gap-1">
          {([['overview', 'Visão'], ['receivable', 'A Receber'], ['installments', 'Parcelas'], ['expenses', 'Despesas']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2 rounded-xl text-[11px] font-700 transition-all leading-tight ${tab === t ? 'bg-[#9C2553] text-white' : 'text-[#9C8A93]'}`}>
              {label}
              {t === 'installments' && overdue.length > 0 && (
                <span className="ml-0.5 bg-red-500 text-white text-[9px] px-1 rounded-full">{overdue.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-3">
            <h3 className="font-800 text-[#1C1019]">Fluxo de caixa — este mês</h3>
            <div className="bg-white rounded-2xl border border-[#EDE0E7] divide-y divide-[#EDE0E7]">
              {monthTx.length === 0 && (
                <div className="py-8 text-center text-[#9C8A93] text-sm font-600">Nenhuma transação este mês</div>
              )}
              {monthTx.sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'receita' ? 'bg-[#D1FAE5]' : 'bg-red-50'}`}>
                    <span className="text-base">{tx.type === 'receita' ? '💰' : '💸'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-sm text-[#1C1019] truncate">{tx.description}</p>
                    <p className="text-[#9C8A93] text-xs">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {tx.category}</p>
                  </div>
                  <p className={`font-800 text-sm shrink-0 ${tx.type === 'receita' ? 'text-[#10B981]' : 'text-red-500'}`}>
                    {tx.type === 'receita' ? '+' : '−'}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receivable */}
        {tab === 'receivable' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-800 text-amber-800">Total a receber</p>
                <p className="text-amber-900 text-xl font-900">{fmt(debtClients.reduce((a, c) => a + c.balance, 0))}</p>
              </div>
            </div>
            {debtClients.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="text-4xl mb-2">🎉</span>
                <p className="font-700 text-[#1C1019]">Todas as clientes estão em dia!</p>
              </div>
            )}
            {debtClients.map(client => (
              <div key={client.id} className="bg-white rounded-2xl border border-[#EDE0E7] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCEEF4] flex items-center justify-center font-900 text-[#9C2553] shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#1C1019] truncate">{client.name}</p>
                  <p className="text-[#9C8A93] text-xs">{client.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-900 text-red-500">{fmt(client.balance)}</p>
                  <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${client.name.split(' ')[0]}! 💄\n\nPassando para lembrar sobre o valor de *${fmt(client.balance)}* em aberto. \n\nQualquer dúvida, estou à disposição! 🌸`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[#25D366] text-xs font-700 flex items-center gap-1 justify-end mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.109.549 4.09 1.509 5.818L0 24l6.335-1.492A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.375l-.36-.214-3.732.979.996-3.648-.235-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
                    Cobrar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installments */}
        {tab === 'installments' && (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-800 text-red-500">⚠️ Vencidas</span>
                  <span className="text-xs font-700 bg-red-100 text-red-500 px-2 py-0.5 rounded-full">{overdue.length}</span>
                </div>
                <div className="space-y-2">
                  {overdue.map(inst => (
                    <InstallmentCard key={inst.id} inst={inst} onPay={() => markInstallmentPaid(inst.saleId, inst.id)} overdue />
                  ))}
                </div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="text-sm font-800 text-[#1C1019] mb-2">📅 A vencer</p>
                <div className="space-y-2">
                  {upcoming.map(inst => (
                    <InstallmentCard key={inst.id} inst={inst} onPay={() => markInstallmentPaid(inst.saleId, inst.id)} />
                  ))}
                </div>
              </div>
            )}
            {allPendingInstallments.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="text-4xl mb-2">✅</span>
                <p className="font-700 text-[#1C1019]">Nenhuma parcela pendente</p>
              </div>
            )}
          </div>
        )}

        {/* Expenses */}
        {tab === 'expenses' && (
          <div className="space-y-3">
            <button onClick={() => setShowAddExpense(!showAddExpense)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#9C2553]/30 rounded-2xl py-3 text-[#9C2553] font-700 text-sm active:scale-95 transition-transform">
              + Registrar despesa
            </button>

            {showAddExpense && (
              <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4 space-y-3">
                <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição da despesa"
                  className="w-full border border-[#EDE0E7] rounded-xl px-3 py-2.5 text-sm font-600 outline-none focus:border-[#9C2553]" />
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="Valor (R$)" step="0.01" min="0"
                  className="w-full border border-[#EDE0E7] rounded-xl px-3 py-2.5 text-sm font-600 outline-none focus:border-[#9C2553]" />
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map(cat => (
                    <button key={cat} onClick={() => setExpenseForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-700 transition-all ${expenseForm.category === cat ? 'bg-[#9C2553] text-white' : 'bg-[#FBF7F9] text-[#9C8A93] border border-[#EDE0E7]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <button onClick={handleAddExpense} className="w-full bg-[#9C2553] text-white font-700 rounded-xl py-3 active:scale-95 transition-transform">
                  Salvar despesa
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#EDE0E7] divide-y divide-[#EDE0E7]">
              {monthTx.filter(t => t.type === 'despesa').length === 0 && (
                <div className="py-8 text-center text-[#9C8A93] text-sm font-600">Nenhuma despesa registrada este mês</div>
              )}
              {monthTx.filter(t => t.type === 'despesa').map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">💸</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-sm text-[#1C1019] truncate">{tx.description}</p>
                    <p className="text-[#9C8A93] text-xs">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {tx.category}</p>
                  </div>
                  <p className="font-800 text-sm text-red-500 shrink-0">−{fmt(tx.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-white/10 text-white',
    amber: 'bg-white/10 text-white',
    emerald: 'bg-[#10B981]/20 text-white',
    red: 'bg-red-500/20 text-red-200',
  };
  return (
    <div className={`${colorMap[color]} rounded-2xl p-3 border border-white/20`}>
      <p className="text-white/60 text-[10px] font-600 uppercase">{label}</p>
      <p className="text-white text-sm font-900 mt-0.5 leading-tight">{value}</p>
    </div>
  );
}

function InstallmentCard({ inst, onPay, overdue }: { inst: { id: string; number: number; dueDate: string; value: number; clientName: string; saleId: string }; onPay: () => void; overdue?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 ${overdue ? 'border-red-200 bg-red-50/30' : 'border-[#EDE0E7]'}`}>
      <div className="flex-1 min-w-0">
        <p className="font-700 text-sm text-[#1C1019] truncate">{inst.clientName}</p>
        <p className="text-[#9C8A93] text-xs">Parcela {inst.number} · {new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
        {overdue && <p className="text-red-500 text-[10px] font-700">Vencida há {Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / 86400000)} dia(s)</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="font-900 text-[#1C1019]">{fmt(inst.value)}</p>
        <button onClick={onPay} className="text-[11px] font-700 text-[#9C2553] bg-[#FCEEF4] px-2 py-0.5 rounded-full mt-1 active:scale-95 transition-transform">
          Receber
        </button>
      </div>
    </div>
  );
}
