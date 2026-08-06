import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Minus,
  PartyPopper,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import TopBar from "../components/TopBar";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7);

type Tab = "overview" | "receivable" | "expenses" | "installments";

export default function Financial() {
  const { transactions, sales, clients, addTransaction, markInstallmentPaid } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "Estoque" });

  const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));
  const monthIncome = monthTx.filter(t => t.type === "receita").reduce((a, t) => a + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === "despesa").reduce((a, t) => a + t.amount, 0);
  const monthProfit = monthIncome - monthExpense;

  const allPendingInstallments = sales.flatMap(s =>
    (s.installments || []).filter(i => !i.paid).map(i => ({ ...i, clientName: s.clientName, saleId: s.id, clientId: s.clientId })),
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const overdue = allPendingInstallments.filter(i => i.dueDate < today);
  const upcoming = allPendingInstallments.filter(i => i.dueDate >= today);
  const debtClients = clients.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
  const expenseCategories = ["Estoque", "Transporte", "Materiais", "Marketing", "Outros"];

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) return;
    addTransaction({
      type: "despesa",
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      date: today,
      category: expenseForm.category,
    });
    setExpenseForm({ description: "", amount: "", category: "Estoque" });
    setShowAddExpense(false);
  };

  return (
    <div className="pb-24 page-enter">
      <TopBar title="Financeiro" />

      <div className="bg-brand-gradient px-4 pt-4 pb-8">
        <p className="text-white/75 text-xs font-700 uppercase tracking-wide mb-3">
          Resumo de {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="Receita" value={fmt(monthIncome)} icon={TrendingUp} />
          <SummaryCard label="Despesas" value={fmt(monthExpense)} icon={TrendingDown} />
          <SummaryCard label="Lucro" value={fmt(monthProfit)} icon={DollarSign} />
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-[#D9EEF0] p-1 grid grid-cols-4 gap-1 shadow-sm">
          {([["overview", "Visao"], ["receivable", "A Receber"], ["installments", "Parcelas"], ["expenses", "Despesas"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 rounded-xl text-[11px] font-800 transition-all leading-tight ${tab === t ? "bg-brand-gradient text-white" : "text-[#6D8185]"}`}
            >
              {label}
              {t === "installments" && overdue.length > 0 && (
                <span className="ml-0.5 bg-red-500 text-white text-[9px] px-1 rounded-full">{overdue.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-3">
            <h3 className="font-800 text-[#102326]">Fluxo de caixa - este mes</h3>
            <div className="bg-white rounded-2xl border border-[#D9EEF0] divide-y divide-[#D9EEF0]">
              {monthTx.length === 0 && (
                <EmptyState icon={ReceiptText} text="Nenhuma transacao este mes" />
              )}
              {monthTx.sort((a, b) => b.date.localeCompare(a.date)).map(tx => {
                const isIncome = tx.type === "receita";
                const Icon = isIncome ? TrendingUp : TrendingDown;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? "icon-gradient-list" : "bg-red-50 text-red-500"}`}>
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-sm text-[#102326] truncate">{tx.description}</p>
                      <p className="text-[#6D8185] text-xs">{new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR")} - {tx.category}</p>
                    </div>
                    <p className={`font-800 text-sm shrink-0 ${isIncome ? "text-[#18B976]" : "text-red-500"}`}>
                      {isIncome ? "+" : "-"}{fmt(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "receivable" && (
          <div className="space-y-3">
            <div className="bg-[#FFF9EA] border border-[#F4D77B] rounded-2xl p-3 flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl icon-gradient-list flex items-center justify-center shrink-0">
                <ClipboardList className="h-[17px] w-[17px]" strokeWidth={2.2} />
              </span>
              <div>
                <p className="font-800 text-amber-800">Total a receber</p>
                <p className="text-amber-900 text-xl font-900">{fmt(debtClients.reduce((a, c) => a + c.balance, 0))}</p>
              </div>
            </div>
            {debtClients.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="h-11 w-11 rounded-2xl icon-gradient-main flex items-center justify-center mb-2">
                  <PartyPopper className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <p className="font-700 text-[#102326]">Todas as clientes estao em dia!</p>
              </div>
            )}
            {debtClients.map(client => (
              <div key={client.id} className="bg-white rounded-2xl border border-[#D9EEF0] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-gradient-list flex items-center justify-center font-900 shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-sm text-[#102326] truncate">{client.name}</p>
                  <p className="text-[#6D8185] text-xs">{client.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-900 text-red-500">{fmt(client.balance)}</p>
                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ola ${client.name.split(" ")[0]}!\n\nPassando para lembrar sobre o valor de *${fmt(client.balance)}* em aberto.\n\nQualquer duvida, estou a disposicao!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] text-xs font-700 flex items-center gap-1 justify-end mt-0.5"
                  >
                    Cobrar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "installments" && (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={2.3} />
                  <span className="text-sm font-800 text-red-500">Vencidas</span>
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
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-[#08AFC8]" strokeWidth={2.3} />
                  <p className="text-sm font-800 text-[#102326]">A vencer</p>
                </div>
                <div className="space-y-2">
                  {upcoming.map(inst => (
                    <InstallmentCard key={inst.id} inst={inst} onPay={() => markInstallmentPaid(inst.saleId, inst.id)} />
                  ))}
                </div>
              </div>
            )}
            {allPendingInstallments.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="h-11 w-11 rounded-2xl icon-gradient-main flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <p className="font-700 text-[#102326]">Nenhuma parcela pendente</p>
              </div>
            )}
          </div>
        )}

        {tab === "expenses" && (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#16C8DD]/35 rounded-2xl py-3 text-[#08AFC8] font-800 text-sm active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Registrar despesa
            </button>

            {showAddExpense && (
              <div className="bg-white rounded-2xl border border-[#D9EEF0] p-4 space-y-3">
                <input
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao da despesa"
                  className="w-full border border-[#D9EEF0] rounded-xl px-3 py-2.5 text-sm font-600 outline-none focus:border-[#16C8DD]"
                />
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="Valor (R$)"
                  step="0.01"
                  min="0"
                  className="w-full border border-[#D9EEF0] rounded-xl px-3 py-2.5 text-sm font-600 outline-none focus:border-[#16C8DD]"
                />
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setExpenseForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-700 transition-all ${expenseForm.category === cat ? "bg-brand-gradient text-white" : "bg-[#F4FFFB] text-[#6D8185] border border-[#D9EEF0]"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button onClick={handleAddExpense} className="w-full bg-brand-gradient text-white font-800 rounded-xl py-3 active:scale-95 transition-transform">
                  Salvar despesa
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#D9EEF0] divide-y divide-[#D9EEF0]">
              {monthTx.filter(t => t.type === "despesa").length === 0 && (
                <EmptyState icon={ReceiptText} text="Nenhuma despesa registrada este mes" />
              )}
              {monthTx.filter(t => t.type === "despesa").map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-sm text-[#102326] truncate">{tx.description}</p>
                    <p className="text-[#6D8185] text-xs">{new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR")} - {tx.category}</p>
                  </div>
                  <p className="font-800 text-sm text-red-500 shrink-0">-{fmt(tx.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }) {
  return (
    <div className="rounded-2xl p-3 border border-white/20 bg-white/12 text-white">
      <div className="h-7 w-7 rounded-xl bg-white/18 flex items-center justify-center mb-2">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <p className="text-white/65 text-[10px] font-700 uppercase">{label}</p>
      <p className="text-white text-sm font-900 mt-0.5 leading-tight">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; text: string }) {
  return (
    <div className="py-8 text-center text-[#6D8185] text-sm font-600 flex flex-col items-center gap-2">
      <span className="h-10 w-10 rounded-2xl icon-gradient-list flex items-center justify-center">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {text}
    </div>
  );
}

function InstallmentCard({ inst, onPay, overdue }: { inst: { id: string; number: number; dueDate: string; value: number; clientName: string; saleId: string }; onPay: () => void; overdue?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 ${overdue ? "border-red-200 bg-red-50/30" : "border-[#D9EEF0]"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${overdue ? "bg-red-50 text-red-500" : "icon-gradient-list"}`}>
        {overdue ? <AlertTriangle className="h-4 w-4" strokeWidth={2.2} /> : <CalendarDays className="h-4 w-4" strokeWidth={2.2} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-700 text-sm text-[#102326] truncate">{inst.clientName}</p>
        <p className="text-[#6D8185] text-xs">Parcela {inst.number} - {new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
        {overdue && <p className="text-red-500 text-[10px] font-700">Vencida ha {Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / 86400000)} dia(s)</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="font-900 text-[#102326]">{fmt(inst.value)}</p>
        <button onClick={onPay} className="text-[11px] font-800 text-[#08AFC8] bg-[#E9FBF5] px-2 py-0.5 rounded-full mt-1 active:scale-95 transition-transform">
          Receber
        </button>
      </div>
    </div>
  );
}
