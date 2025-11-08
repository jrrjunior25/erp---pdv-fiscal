import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, CartItem, Customer } from '../../types';
import PDVStats from './PDVStats';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>;
const GiftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>;

interface ModernPDVProps {
  products: Product[];
  cart: CartItem[];
  selectedCustomer: Customer | null;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onSelectCustomer: () => void;
  onApplyDiscount: (target: any) => void;
  onRedeemPoints: () => void;
  onFinalizeSale: () => void;
}

const ModernPDV: React.FC<ModernPDVProps> = ({
  products, cart, selectedCustomer, onAddToCart, onUpdateQuantity, onRemoveFromCart,
  onClearCart, onSelectCustomer, onApplyDiscount, onRedeemPoints, onFinalizeSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [priceCheckModal, setPriceCheckModal] = useState(false);
  const [priceCheckCode, setPriceCheckCode] = useState('');
  const [priceCheckResult, setPriceCheckResult] = useState<Product | null>(null);
  const [scrollMessage] = useState('Bem-vindo ao Sistema PDV - Atendimento Rápido e Eficiente - Aproveite nossas promoções!');
  const [showTopSellers, setShowTopSellers] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) onFinalizeSale(); }
      if (e.key === 'F3') { e.preventDefault(); onSelectCustomer(); }
      if (e.key === 'F4') { e.preventDefault(); if (cart.length > 0) onApplyDiscount({ type: 'total' }); }
      if (e.key === 'F5') { e.preventDefault(); setPriceCheckModal(true); setPriceCheckCode(''); setPriceCheckResult(null); }
      if (e.key === 'Escape') { e.preventDefault(); setSearchTerm(''); setPriceCheckModal(false); }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.length, onFinalizeSale, onSelectCustomer, onApplyDiscount]);

  const { subtotal, promotionalDiscount, total } = useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const promo = cart.reduce((sum, item) => {
      if (item.discount) {
        return sum + (item.discount.type === 'fixed' ? item.discount.amount : (item.price * item.quantity * item.discount.amount / 100));
      }
      return sum;
    }, 0);
    return { subtotal: sub, promotionalDiscount: promo, total: sub - promo };
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchTerm ? filtered : filtered.slice(0, 20);
  }, [products, searchTerm]);

  const topSellingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => ((b as any).salesCount || 0) - ((a as any).salesCount || 0))
      .slice(0, 8);
  }, [products]);

  const handleQuantityChange = useCallback((itemId: string, newQty: number) => {
    if (newQty < 1) onRemoveFromCart(itemId);
    else onUpdateQuantity(itemId, newQty);
  }, [onUpdateQuantity, onRemoveFromCart]);

  const handlePriceCheck = () => {
    const product = products.find(p => p.code?.toLowerCase() === priceCheckCode.toLowerCase() || p.name.toLowerCase().includes(priceCheckCode.toLowerCase()));
    setPriceCheckResult(product || null);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="mb-3 space-y-2">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs opacity-90">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sistema PDV Profissional</h1>
                  <p className="text-xs text-gray-500">Ponto de Venda - Gestão Completa</p>
                </div>
              </div>
            </div>
            <PDVStats 
              totalProducts={products.length} 
              cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
              cartTotal={total} 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
            <input type="text" placeholder="Buscar produto por nome ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base" autoFocus />
          </div>

          {!searchTerm && topSellingProducts.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  Produtos Mais Vendidos
                </h2>
                <button onClick={() => setShowTopSellers(!showTopSellers)} className="text-xs text-gray-600 hover:text-gray-900">
                  {showTopSellers ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showTopSellers && (
                <div className="grid grid-cols-4 gap-2">
                  {topSellingProducts.map(product => (
                    <button key={product.id} onClick={() => onAddToCart(product)} className="bg-white hover:bg-green-50 border border-green-300 rounded-lg p-2 transition-all hover:shadow-md text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-semibold text-gray-900 truncate">{product.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-green-600">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mb-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-2 p-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Catálogo de Produtos</h3>
              <span className="text-xs text-gray-500">{filteredProducts.length} produtos</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => onAddToCart(product)} className="group bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">Cód: {product.code || 'N/A'}</span>
                      {(product as any).stock < 10 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Estoque baixo</span>}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-bold text-blue-600">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Estoque: {(product as any).stock || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-center"><span className="font-bold text-blue-700">F2</span><span className="block text-gray-600 text-[10px]">Finalizar</span></div>
            <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5 text-center"><span className="font-bold text-green-700">F3</span><span className="block text-gray-600 text-[10px]">Cliente</span></div>
            <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 text-center"><span className="font-bold text-yellow-700">F4</span><span className="block text-gray-600 text-[10px]">Desconto</span></div>
            <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1.5 text-center"><span className="font-bold text-purple-700">F5</span><span className="block text-gray-600 text-[10px]">Consultar</span></div>
            <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 text-center"><span className="font-bold text-red-700">ESC</span><span className="block text-gray-600 text-[10px]">Limpar</span></div>
          </div>
        </div>
      </div>

      <div className="w-[450px] bg-white border-l border-gray-200 flex flex-col shadow-2xl">
        {selectedCustomer ? (
          <div className="bg-blue-50 border-b border-blue-200 p-3">
            <div className="flex items-start justify-between">
              <div><p className="font-semibold text-gray-900 text-sm">{selectedCustomer.name}</p><p className="text-xs text-gray-600">{(selectedCustomer as any).document || (selectedCustomer as any).cpf || ''}</p></div>
              <div className="text-right"><div className="flex items-center gap-1 text-yellow-600 font-bold text-sm"><GiftIcon /><span>{selectedCustomer.loyaltyPoints || 0}</span></div><button type="button" onClick={onSelectCustomer} className="text-xs text-blue-600 hover:underline" title="Trocar cliente">Trocar</button></div>
            </div>
            {selectedCustomer.loyaltyPoints > 0 && <button type="button" onClick={onRedeemPoints} className="w-full mt-2 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-yellow-800 rounded-lg py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1" title="Resgatar pontos de fidelidade"><GiftIcon />Resgatar Pontos</button>}
          </div>
        ) : (
          <button type="button" onClick={onSelectCustomer} className="bg-gray-50 hover:bg-gray-100 border-b border-gray-200 py-3 transition-all flex items-center justify-center gap-2 group" title="Selecionar cliente (F3)"><UserPlusIcon /><span className="font-semibold text-gray-700 text-sm">Cliente (F3)</span></button>
        )}

        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400"><div className="text-4xl mb-2">🛒</div><p className="text-sm">Carrinho vazio</p></div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              <div className="border-b-2 border-dashed border-gray-400 pb-1 mb-2"><div className="flex justify-between font-bold text-gray-700"><span>ITEM</span><span>QTD</span><span>VALOR</span></div></div>
              {cart.map(item => {
                const itemSubtotal = item.price * item.quantity;
                const discountValue = item.discount ? (item.discount.type === 'fixed' ? item.discount.amount : itemSubtotal * (item.discount.amount / 100)) : 0;
                const itemTotal = itemSubtotal - discountValue;
                return (
                  <div key={item.id} className="bg-white rounded p-2 border border-gray-200">
                    <div className="flex justify-between items-start mb-1"><span className="font-semibold text-gray-900 flex-1">{item.name}</span><button type="button" onClick={() => onRemoveFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-2" title="Remover item"><TrashIcon /></button></div>
                    <div className="flex justify-between items-center text-gray-600"><div className="flex items-center gap-1"><button type="button" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="p-0.5 bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 rounded" title="Diminuir quantidade">{item.quantity > 1 ? <MinusIcon /> : <TrashIcon />}</button><input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)} className="w-10 bg-white border border-gray-300 text-center text-gray-900 rounded py-0.5 px-1 text-xs" title="Quantidade" aria-label="Quantidade do item" /><button type="button" onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="p-0.5 bg-gray-200 hover:bg-green-100 text-gray-700 hover:text-green-600 rounded" title="Aumentar quantidade"><PlusIcon /></button><button type="button" onClick={() => onApplyDiscount({ type: 'item', itemId: item.id })} className="p-0.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded ml-1" title="Aplicar desconto"><TagIcon /></button></div><span className="font-bold text-blue-600">{itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    {discountValue > 0 && <div className="text-green-600 text-xs mt-0.5">Desc: -{discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-400 p-4 bg-white">
          <div className="space-y-1 mb-3 font-mono text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span className="font-semibold text-gray-900">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            {promotionalDiscount > 0 && <div className="flex justify-between text-gray-600"><span>Descontos:</span><span className="font-semibold text-green-600">-{promotionalDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}
          </div>

          <div className="flex justify-between items-center mb-4 py-3 border-t-2 border-b-2 border-gray-300"><span className="text-lg font-bold text-gray-900">TOTAL:</span><span className="text-3xl font-bold text-blue-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onApplyDiscount({ type: 'total' })} disabled={cart.length === 0} className="py-2.5 px-2 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-yellow-700 rounded-lg font-semibold transition-all disabled:opacity-30 flex items-center justify-center gap-1 text-xs"><TagIcon />Desc.</button>
            <button onClick={onFinalizeSale} disabled={cart.length === 0} className="col-span-2 py-2.5 px-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all disabled:opacity-30 shadow-lg flex items-center justify-center gap-2"><CreditCardIcon />Pagar (F2)</button>
          </div>
        </div>
      </div>

      {priceCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPriceCheckModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full m-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultar Preço (F5)</h2>
            <input type="text" placeholder="Digite o código ou nome do produto" value={priceCheckCode} onChange={(e) => setPriceCheckCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePriceCheck()} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 mb-4 focus:ring-2 focus:ring-blue-500" autoFocus />
            <button onClick={handlePriceCheck} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 mb-4">Consultar</button>
            {priceCheckResult ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4"><h3 className="font-bold text-gray-900 mb-2">{priceCheckResult.name}</h3><p className="text-sm text-gray-600 mb-2">Código: {priceCheckResult.code}</p><p className="text-3xl font-bold text-green-600">{priceCheckResult.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><p className="text-sm text-gray-600 mt-2">Estoque: {(priceCheckResult as any).stock || 0} un.</p></div>
            ) : priceCheckCode && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"><p className="text-red-600 font-semibold">Produto não encontrado</p></div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ModernPDV;
