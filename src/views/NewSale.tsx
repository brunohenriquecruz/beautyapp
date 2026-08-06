import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Client, Product, SaleItem, Installment } from '../types';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface NewSaleProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'client' | 'products' | 'payment' | 'confirm';

export default function NewSale({ onBack, onComplete }: NewSaleProps) {
  const { clients, products, addSale, searchQuery, setSearchQuery } = useApp();
  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro'|'pix'|'credito'|'debito'|'parcelado'>('pix');
  const [installmentCount, setInstallmentCount] = useState(2);
  const [productSearch, setProductSearch] = useState('');
  const [success, setSuccess] = useState(false);

  const subtotal = cart.reduce((a, i) => a + (i.unitPrice * i.quantity * (1 - i.discount / 100)), 0);
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
    const today = new Date();
    return Array.from({ length: installmentCount }, (_, k) => {
      const dueDate = new Date(today);
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
    const isInstallment = paymentMethod === 'parcelado';
    const installments = isInstallment ? buildInstallments() : undefined;

    addSale({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      items: cart,
      subtotal,
      discount,
      total,
      paymentMethod,
      installmentCount: isInstallment ? installmentCount : undefined,
      installments,
      status: isInstallment ? 'parcial' : 'pago',
      date: new Date().toISOString().slice(0, 10),
    });

    setSuccess(true);
    setTimeout(() => { setSuccess(false); onComplete(); }, 2000);
  };

  const filteredProducts = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.includes(productSearch)
  );

  const filteredClients = clients.filter(c =>
    !productSearch || c.name.toLowerCase().includes(productSearch.toLowerCase()) || c.phone.includes(productSearch)
  );

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF7F9] px-6 text-center page-enter">
      <div className="w-24 h-24 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4 animate-bounce">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 className="text-2xl font-900 text-[#1C1019]">Venda registrada!</h2>
      <p className="text-[#9C8A93] font-600 mt-2">{fmt(total)} para {selectedClient?.name.split(' ')[0]}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF7F9] flex flex-col page-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EDE0E7]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FCEEF4] active:scale-95 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C2553" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="font-900 text-[#1C1019] text-lg">Nova Venda</h1>
          {cart.length > 0 && (
            <span className="ml-auto bg-[#9C2553] text-white text-xs font-700 px-2 py-0.5 rounded-full">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex px-4 pb-3 gap-2">
          {(['client', 'products', 'payment', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${
              s === step ? 'bg-[#9C2553]' :
              (['client', 'products', 'payment', 'confirm'].indexOf(step) > i) ? 'bg-[#9C2553]/40' : 'bg-[#EDE0E7]'
            }`} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">

        {/* STEP 1: Select client */}
        {step === 'client' && (
          <>
            <p className="font-800 text-[#1C1019] text-base">Selecione a cliente</p>
            <input
              value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="🔍 Buscar cliente..."
              className="w-full bg-white border border-[#EDE0E7] rounded-2xl px-4 py-3 text-sm font-600 outline-none focus:border-[#9C2553] transition-colors"
            />
            <div className="space-y-2">
              {filteredClients.map(client => (
                <button key={client.id} onClick={() => { setSelectedClient(client); setProductSearch(''); setStep('products'); }}
                  className={`w-full bg-white rounded-2xl px-4 py-3 border flex items-center gap-3 active:scale-98 transition-transform ${selectedClient?.id === client.id ? 'border-[#9C2553] bg-[#FCEEF4]' : 'border-[#EDE0E7]'}`}>
                  <div className="w-10 h-10 rounded-xl bg-[#FCEEF4] flex items-center justify-center font-900 text-[#9C2553] shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-700 text-sm text-[#1C1019]">{client.name}</p>
                    <p className="text-[#9C8A93] text-xs">{client.phone}</p>
                  </div>
                  {client.balance > 0 && (
                    <span className="ml-auto text-xs font-700 text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">deve {fmt(client.balance)}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2: Products */}
        {step === 'products' && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#FCEEF4] flex items-center justify-center font-900 text-[#9C2553] text-sm shrink-0">
                {selectedClient?.name.charAt(0)}
              </div>
              <p className="font-700 text-[#1C1019]">{selectedClient?.name}</p>
            </div>

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#EDE0E7] p-3 space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <p className="flex-1 text-xs font-600 text-[#1C1019] truncate">{item.productName}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-[#FBF7F9] font-900 text-sm flex items-center justify-center active:scale-95">−</button>
                      <span className="text-sm font-800 w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-[#FBF7F9] font-900 text-sm flex items-center justify-center active:scale-95">+</button>
                    </div>
                    <p className="text-sm font-800 text-[#9C2553] w-20 text-right shrink-0">{fmt(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#EDE0E7] flex justify-between">
                  <span className="text-sm font-700 text-[#9C8A93]">Subtotal</span>
                  <span className="text-sm font-900 text-[#1C1019]">{fmt(subtotal)}</span>
                </div>
              </div>
            )}

            <input
              value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="🔍 Buscar produto..."
              className="w-full bg-white border border-[#EDE0E7] rounded-2xl px-4 py-3 text-sm font-600 outline-none focus:border-[#9C2553] transition-colors"
            />

            <div className="space-y-2">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.productId === product.id);
                return (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className={`w-full bg-white rounded-2xl border p-3 flex items-center gap-3 active:scale-98 transition-transform ${inCart ? 'border-[#9C2553] bg-[#FCEEF4]/30' : 'border-[#EDE0E7]'} ${product.stock === 0 ? 'opacity-50' : ''}`}
                    disabled={product.stock === 0}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FCEEF4] shrink-0">
                      {product.photo ? <img src={product.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">💄</div>}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-700 text-sm text-[#1C1019] truncate">{product.name}</p>
                      <p className="text-[#9C8A93] text-xs">{product.stock === 0 ? '❌ Sem estoque' : `${product.stock} unid. disponíveis`}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-800 text-sm text-[#9C2553]">{fmt(product.salePrice)}</p>
                      {inCart && <span className="text-[10px] font-700 bg-[#9C2553] text-white px-1.5 rounded-full">{inCart.quantity} un.</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 3: Payment */}
        {step === 'payment' && (
          <>
            <p className="font-800 text-[#1C1019] text-base">Forma de pagamento</p>

            {/* Discount */}
            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4">
              <p className="text-[#9C8A93] text-xs font-700 uppercase tracking-wide mb-3">Desconto geral (%)</p>
              <div className="flex items-center gap-3">
                {[0, 5, 10, 15, 20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-700 transition-all ${discount === d ? 'bg-[#9C2553] text-white' : 'bg-[#FBF7F9] text-[#9C8A93]'}`}>
                    {d === 0 ? 'Sem' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'pix', label: 'Pix', icon: '⚡' },
                { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                { value: 'credito', label: 'Crédito', icon: '💳' },
                { value: 'debito', label: 'Débito', icon: '💳' },
                { value: 'parcelado', label: 'Parcelado', icon: '📆' },
              ].map(pm => (
                <button key={pm.value} onClick={() => setPaymentMethod(pm.value as typeof paymentMethod)}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${paymentMethod === pm.value ? 'border-[#9C2553] bg-[#FCEEF4]' : 'border-[#EDE0E7] bg-white'}`}>
                  <span className="text-2xl">{pm.icon}</span>
                  <span className={`text-sm font-700 ${paymentMethod === pm.value ? 'text-[#9C2553]' : 'text-[#1C1019]'}`}>{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Installment options */}
            {paymentMethod === 'parcelado' && (
              <div className="bg-white rounded-2xl border border-[#9C2553]/30 p-4">
                <p className="text-[#9C8A93] text-xs font-700 uppercase tracking-wide mb-3">Número de parcelas</p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 6].map(n => (
                    <button key={n} onClick={() => setInstallmentCount(n)}
                      className={`py-3 rounded-xl text-sm font-700 transition-all ${installmentCount === n ? 'bg-[#9C2553] text-white' : 'bg-[#FBF7F9] text-[#9C8A93]'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-[#FBF7F9] rounded-xl p-3">
                  <p className="text-[#9C8A93] text-xs font-600">Valor de cada parcela</p>
                  <p className="text-[#9C2553] text-xl font-900">{fmt(total / installmentCount)}</p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-gradient-to-br from-[#9C2553] to-[#C2185B] rounded-2xl p-4 text-white">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70 font-600">Subtotal</span>
                <span className="font-700">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70 font-600">Desconto ({discount}%)</span>
                  <span className="font-700 text-yellow-300">−{fmt(subtotal * discount / 100)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/20 mt-2">
                <span className="text-white font-800">Total</span>
                <span className="text-2xl font-900">{fmt(total)}</span>
              </div>
            </div>
          </>
        )}

        {/* STEP 4: Confirm */}
        {step === 'confirm' && (
          <>
            <p className="font-800 text-[#1C1019] text-base">Confirmar venda</p>
            <div className="bg-white rounded-2xl border border-[#EDE0E7] p-4 space-y-3">
              <Row label="Cliente" value={selectedClient?.name || ''} />
              <Row label="Produtos" value={cart.map(i => `${i.quantity}x ${i.productName}`).join(', ')} />
              <Row label="Pagamento" value={{ pix: '⚡ Pix', dinheiro: '💵 Dinheiro', credito: '💳 Crédito', debito: '💳 Débito', parcelado: `📆 ${installmentCount}x de ${fmt(total / installmentCount)}` }[paymentMethod]} />
              {discount > 0 && <Row label="Desconto" value={`${discount}% (−${fmt(subtotal * discount / 100)})`} />}
              <div className="pt-2 border-t border-[#EDE0E7] flex justify-between">
                <span className="font-800 text-[#1C1019]">Total</span>
                <span className="font-900 text-[#9C2553] text-lg">{fmt(total)}</span>
              </div>
            </div>

            {/* Share via WhatsApp */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4">
              <p className="text-emerald-700 text-sm font-700 mb-2">📱 Compartilhar comprovante</p>
              <a
                href={`https://wa.me/55${selectedClient?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedClient?.name.split(' ')[0]}! 💄\n\nSeu pedido foi registrado com sucesso!\n\n${cart.map(i => `• ${i.quantity}x ${i.productName} — ${fmt(i.unitPrice * i.quantity)}`).join('\n')}\n\n${discount > 0 ? `Desconto: ${discount}%\n` : ''}*Total: ${fmt(total)}*\n\nForma de pagamento: ${{ pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Cartão Crédito', debito: 'Cartão Débito', parcelado: `Parcelado em ${installmentCount}x de ${fmt(total / installmentCount)}` }[paymentMethod]}\n\nObrigada pela preferência! 🌸`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-700 rounded-xl py-3 active:scale-95 transition-transform">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.109.549 4.09 1.509 5.818L0 24l6.335-1.492A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.375l-.36-.214-3.732.979.996-3.648-.235-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
                Enviar via WhatsApp
              </a>
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#EDE0E7] px-4 pt-3 pb-6">
        {step === 'client' && (
          <p className="text-center text-[#9C8A93] text-sm font-600">Toque em uma cliente para selecionar</p>
        )}
        {step === 'products' && (
          <button onClick={() => { if (cart.length > 0) { setProductSearch(''); setStep('payment'); } }}
            disabled={cart.length === 0}
            className="w-full bg-[#9C2553] text-white font-800 rounded-2xl py-4 disabled:opacity-40 active:scale-95 transition-transform">
            Continuar · {fmt(subtotal)}
          </button>
        )}
        {step === 'payment' && (
          <button onClick={() => setStep('confirm')}
            className="w-full bg-[#9C2553] text-white font-800 rounded-2xl py-4 active:scale-95 transition-transform">
            Revisar pedido
          </button>
        )}
        {step === 'confirm' && (
          <button onClick={handleFinish}
            className="w-full bg-[#10B981] text-white font-800 rounded-2xl py-4 active:scale-95 transition-transform shadow-lg shadow-[#10B981]/30">
            ✓ Confirmar venda — {fmt(total)}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#9C8A93] text-sm font-600 shrink-0">{label}</span>
      <span className="text-[#1C1019] text-sm font-700 text-right">{value}</span>
    </div>
  );
}
