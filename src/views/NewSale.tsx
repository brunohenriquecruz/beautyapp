import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Minus,
  Package,
  Phone,
  Search,
  Send,
  ShoppingBag,
  User,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import { useApp } from "../context/AppContext";
import type { Client, Installment, Product, SaleItem } from "../types";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface NewSaleProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = "client" | "products" | "payment" | "confirm";
type PaymentMethod = "dinheiro" | "pix" | "credito" | "debito" | "parcelado";
type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const steps: { id: Step; label: string }[] = [
  { id: "client", label: "Cliente" },
  { id: "products", label: "Itens" },
  { id: "payment", label: "Pagamento" },
  { id: "confirm", label: "Revisao" },
];

const paymentOptions: { value: PaymentMethod; label: string; icon: IconComponent }[] = [
  { value: "pix", label: "Pix", icon: Zap },
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "credito", label: "Credito", icon: CreditCard },
  { value: "debito", label: "Debito", icon: CreditCard },
  { value: "parcelado", label: "Parcelado", icon: CalendarDays },
];

export default function NewSale({ onBack, onComplete }: NewSaleProps) {
  const { clients, products, addSale } = useApp();
  const [step, setStep] = useState<Step>("client");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [installmentCount, setInstallmentCount] = useState(2);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState(false);

  const subtotal = cart.reduce((a, i) => a + i.unitPrice * i.quantity * (1 - i.discount / 100), 0);
  const total = Math.max(0, subtotal * (1 - discount / 100));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.salePrice, discount: 0 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productId !== productId));
    else setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const buildInstallments = (): Installment[] => {
    const instValue = total / installmentCount;
    const baseDate = new Date();
    return Array.from({ length: installmentCount }, (_, k) => {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + k + 1);
      return {
        id: `${Date.now()}-${k}`,
        number: k + 1,
        dueDate: dueDate.toISOString().slice(0, 10),
        value: k === installmentCount - 1 ? parseFloat((total - instValue * (installmentCount - 1)).toFixed(2)) : parseFloat(instValue.toFixed(2)),
        paid: false,
      };
    });
  };

  const handleFinish = () => {
    if (!selectedClient || cart.length === 0) return;
    const isInstallment = paymentMethod === "parcelado";

    addSale({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      items: cart,
      subtotal,
      discount,
      total,
      paymentMethod,
      installmentCount: isInstallment ? installmentCount : undefined,
      installments: isInstallment ? buildInstallments() : undefined,
      status: isInstallment ? "parcial" : "pago",
      date: new Date().toISOString().slice(0, 10),
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onComplete();
    }, 1600);
  };

  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search));
  const filteredClients = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  const paymentLabel = paymentOptions.find(p => p.value === paymentMethod)?.label || paymentMethod;

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4FFFB] px-6 text-center page-enter">
        <div className="w-24 h-24 icon-gradient-main rounded-3xl flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.4} />
        </div>
        <h2 className="text-2xl font-900 text-[#102326]">Venda registrada</h2>
        <p className="text-[#6D8185] font-700 mt-2">{fmt(total)} para {selectedClient?.name.split(" ")[0]}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FFFB] flex flex-col page-enter">
      <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-[#D9EEF0]">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={onBack} className="w-9 h-9 icon-gradient flex shrink-0 items-center justify-center rounded-full active:scale-95 transition-all">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-900 text-[#102326] text-lg leading-tight">Nova Venda</h1>
            <p className="text-[#6D8185] text-[11px] font-700">{steps.find(s => s.id === step)?.label}</p>
          </div>
          {cart.length > 0 && (
            <span className="bg-[#E9FBF5] text-[#08AFC8] border border-[#BDEFF0] text-xs font-900 px-2.5 py-1 rounded-full">
              {cart.length} item{cart.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s, i) => {
              const activeIndex = steps.findIndex(x => x.id === step);
              const isActive = s.id === step;
              const isDone = activeIndex > i;
              return (
                <div key={s.id} className={`h-1.5 rounded-full transition-all ${isActive || isDone ? "bg-brand-gradient" : "bg-[#D9EEF0]"}`} />
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">
        {step === "client" && (
          <>
            <SectionTitle icon={User} title="Selecione a cliente" />
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar cliente..." />
            <div className="space-y-2">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setSearch("");
                    setStep("products");
                  }}
                  className={`w-full bg-white rounded-2xl px-4 py-3 border flex items-center gap-3 active:scale-98 transition-transform shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${selectedClient?.id === client.id ? "border-[#16C8DD]" : "border-[#D9EEF0]"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-900 shrink-0 ${client.balance > 0 ? "bg-red-50 text-red-500" : "icon-gradient-list"}`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-800 text-sm text-[#102326] truncate">{client.name}</p>
                    <p className="text-[#6D8185] text-xs flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" strokeWidth={2.1} />
                      {client.phone}
                    </p>
                  </div>
                  {client.balance > 0 && (
                    <span className="text-xs font-900 text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-full shrink-0">
                      Deve {fmt(client.balance)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "products" && (
          <>
            <SelectedClient client={selectedClient} />
            {cart.length > 0 && <CartSummary cart={cart} subtotal={subtotal} updateQty={updateQty} />}
            <SearchBox value={search} onChange={setSearch} placeholder="Buscar produto..." />
            <div className="space-y-2">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.productId === product.id);
                const outOfStock = product.stock === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`w-full bg-white rounded-2xl border p-3 flex items-center gap-3 active:scale-98 transition-transform shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${inCart ? "border-[#16C8DD] bg-[#E9FBF5]" : "border-[#D9EEF0]"} ${outOfStock ? "opacity-60" : ""}`}
                    disabled={outOfStock}
                  >
                    <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${outOfStock ? "bg-red-50 text-red-500" : "bg-[#E9FBF5] text-[#08AFC8]"}`}>
                      {product.photo ? <img src={product.photo} alt="" className="w-full h-full object-cover" /> : <Package className="h-5 w-5" strokeWidth={2.2} />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-800 text-sm text-[#102326] truncate">{product.name}</p>
                      <p className={`text-xs font-600 ${outOfStock ? "text-red-500" : "text-[#6D8185]"}`}>
                        {outOfStock ? "Sem estoque" : `${product.stock} unid. disponiveis`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-900 text-sm text-[#08AFC8]">{fmt(product.salePrice)}</p>
                      {inCart && <span className="text-[10px] font-800 bg-brand-gradient text-white px-1.5 rounded-full">{inCart.quantity} un.</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <SectionTitle icon={WalletCards} title="Forma de pagamento" />
            <Panel>
              <p className="text-[#6D8185] text-xs font-800 uppercase tracking-wide mb-3">Desconto geral (%)</p>
              <div className="flex items-center gap-2">
                {[0, 5, 10, 15, 20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)} className={`flex-1 py-2 rounded-xl text-sm font-800 transition-all ${discount === d ? "bg-brand-gradient text-white" : "bg-[#F4FFFB] text-[#6D8185] border border-[#D9EEF0]"}`}>
                    {d === 0 ? "Sem" : `${d}%`}
                  </button>
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-all active:scale-95 shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${paymentMethod === pm.value ? "border-[#16C8DD] bg-[#E9FBF5]" : "border-[#D9EEF0] bg-white"}`}
                >
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === pm.value ? "icon-gradient-list" : "bg-[#F4FFFB] text-[#08AFC8]"}`}>
                    <pm.icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="text-sm font-800 text-[#102326]">{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === "parcelado" && (
              <Panel danger>
                <p className="text-red-500 text-xs font-900 uppercase tracking-wide mb-3">Parcelas a receber</p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 6].map(n => (
                    <button key={n} onClick={() => setInstallmentCount(n)} className={`py-3 rounded-xl text-sm font-800 transition-all ${installmentCount === n ? "bg-red-500 text-white" : "bg-white text-red-500 border border-red-100"}`}>
                      {n}x
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-red-50 rounded-xl p-3 border border-red-100">
                  <p className="text-red-400 text-xs font-800">Valor de cada parcela</p>
                  <p className="text-red-500 text-xl font-900">{fmt(total / installmentCount)}</p>
                </div>
              </Panel>
            )}

            <TotalCard subtotal={subtotal} discount={discount} total={total} />
          </>
        )}

        {step === "confirm" && (
          <>
            <SectionTitle icon={ShoppingBag} title="Confirmar venda" />
            <Panel>
              <Row label="Cliente" value={selectedClient?.name || ""} />
              <Row label="Produtos" value={cart.map(i => `${i.quantity}x ${i.productName}`).join(", ")} />
              <Row label="Pagamento" value={paymentMethod === "parcelado" ? `${installmentCount}x de ${fmt(total / installmentCount)}` : paymentLabel} />
              {discount > 0 && <Row label="Desconto" value={`${discount}% (-${fmt(subtotal * discount / 100)})`} />}
              <div className="pt-2 border-t border-[#D9EEF0] flex justify-between">
                <span className="font-800 text-[#102326]">Total</span>
                <span className="font-900 text-[#08AFC8] text-lg">{fmt(total)}</span>
              </div>
            </Panel>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 shadow-[0_10px_24px_rgba(34,197,94,0.08)]">
              <p className="text-emerald-700 text-sm font-800 mb-2 flex items-center gap-2">
                <Send className="h-4 w-4" strokeWidth={2.2} />
                Compartilhar comprovante
              </p>
              <a
                href={`https://wa.me/55${selectedClient?.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ola ${selectedClient?.name.split(" ")[0]}!\n\nSeu pedido foi registrado com sucesso.\n\n${cart.map(i => `- ${i.quantity}x ${i.productName}: ${fmt(i.unitPrice * i.quantity)}`).join("\n")}\n\n${discount > 0 ? `Desconto: ${discount}%\n` : ""}Total: ${fmt(total)}\n\nForma de pagamento: ${paymentMethod === "parcelado" ? `Parcelado em ${installmentCount}x de ${fmt(total / installmentCount)}` : paymentLabel}\n\nObrigada pela preferencia!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-800 rounded-xl py-3 active:scale-95 transition-transform"
              >
                <Send className="h-4 w-4" strokeWidth={2.3} />
                Enviar via WhatsApp
              </a>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/96 backdrop-blur-md border-t border-[#D9EEF0] px-4 pt-3 pb-6 shadow-[0_-18px_40px_rgba(16,35,38,0.08)]">
        {step === "client" && <p className="text-center text-[#6D8185] text-sm font-700">Toque em uma cliente para selecionar</p>}
        {step === "products" && (
          <button onClick={() => { if (cart.length > 0) { setSearch(""); setStep("payment"); } }} disabled={cart.length === 0} className="w-full bg-brand-gradient text-white font-900 rounded-2xl py-4 disabled:opacity-40 active:scale-95 transition-transform shadow-[0_14px_26px_rgba(31,205,226,0.22)]">
            Continuar - {fmt(subtotal)}
          </button>
        )}
        {step === "payment" && (
          <button onClick={() => setStep("confirm")} className="w-full bg-brand-gradient text-white font-900 rounded-2xl py-4 active:scale-95 transition-transform shadow-[0_14px_26px_rgba(31,205,226,0.22)]">
            Revisar pedido
          </button>
        )}
        {step === "confirm" && (
          <button onClick={handleFinish} className="w-full bg-[#18B976] text-white font-900 rounded-2xl py-4 active:scale-95 transition-transform shadow-[0_14px_26px_rgba(24,185,118,0.24)]">
            Confirmar venda - {fmt(total)}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: IconComponent; title: string }) {
  return (
    <p className="font-900 text-[#102326] text-base flex items-center gap-2">
      <Icon className="h-5 w-5 text-[#08AFC8]" strokeWidth={2.4} />
      {title}
    </p>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="w-full bg-white border border-[#D9EEF0] rounded-2xl px-4 py-3 text-sm font-700 outline-none focus-within:border-[#16C8DD] transition-colors flex items-center gap-2 shadow-[0_10px_24px_rgba(8,175,200,0.08)]">
      <Search className="h-4 w-4 text-[#08AFC8]" strokeWidth={2.3} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#6D8185]/70" />
    </label>
  );
}

function SelectedClient({ client }: { client: Client | null }) {
  if (!client) return null;
  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${client.balance > 0 ? "bg-red-50 border-red-100" : "bg-white border-[#D9EEF0]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-900 shrink-0 ${client.balance > 0 ? "bg-white text-red-500 border border-red-100" : "icon-gradient-list"}`}>
        {client.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-800 text-[#102326] truncate">{client.name}</p>
        <p className={`text-xs font-700 ${client.balance > 0 ? "text-red-500" : "text-[#6D8185]"}`}>
          {client.balance > 0 ? `Saldo em aberto: ${fmt(client.balance)}` : "Cliente em dia"}
        </p>
      </div>
    </div>
  );
}

function CartSummary({ cart, subtotal, updateQty }: { cart: SaleItem[]; subtotal: number; updateQty: (productId: string, qty: number) => void }) {
  return (
    <Panel>
      {cart.map(item => (
        <div key={item.productId} className="flex items-center gap-3">
          <p className="flex-1 text-xs font-700 text-[#102326] truncate">{item.productName}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-full bg-[#F4FFFB] text-[#6D8185] font-900 text-sm flex items-center justify-center active:scale-95 border border-[#D9EEF0]">
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <span className="text-sm font-900 w-5 text-center">{item.quantity}</span>
            <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 rounded-full icon-gradient-list font-900 text-sm flex items-center justify-center active:scale-95">+</button>
          </div>
          <p className="text-sm font-900 text-[#08AFC8] w-20 text-right shrink-0">{fmt(item.unitPrice * item.quantity)}</p>
        </div>
      ))}
      <div className="pt-2 border-t border-[#D9EEF0] flex justify-between">
        <span className="text-sm font-800 text-[#6D8185]">Subtotal</span>
        <span className="text-sm font-900 text-[#102326]">{fmt(subtotal)}</span>
      </div>
    </Panel>
  );
}

function Panel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 shadow-[0_10px_24px_rgba(8,175,200,0.08)] ${danger ? "border-red-100 bg-red-50/45" : "border-[#D9EEF0]"}`}>
      {children}
    </div>
  );
}

function TotalCard({ subtotal, discount, total }: { subtotal: number; discount: number; total: number }) {
  return (
    <div className="bg-brand-gradient rounded-2xl p-4 text-white shadow-[0_16px_30px_rgba(31,205,226,0.22)]">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70 font-700">Subtotal</span>
        <span className="font-800">{fmt(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-white/70 font-700">Desconto ({discount}%)</span>
          <span className="font-800 text-yellow-200">-{fmt(subtotal * discount / 100)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-white/20 mt-2">
        <span className="text-white font-900">Total</span>
        <span className="text-2xl font-900">{fmt(total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6D8185] text-sm font-700 shrink-0">{label}</span>
      <span className="text-[#102326] text-sm font-800 text-right">{value}</span>
    </div>
  );
}
