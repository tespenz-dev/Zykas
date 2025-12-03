import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory } from '../types';
import { ShoppingCart, Plus, Trash2, Coffee, ChevronUp, ChevronDown } from 'lucide-react';

const ProductCard: React.FC<{ product: Product; onAdd: () => void }> = ({ product, onAdd }) => (
  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-all group active:scale-95">
    <div>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">{product.category}</span>
        <span className={`${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'} text-[10px] md:text-xs`}>
          Stok: {product.stock}
        </span>
      </div>
      <h3 className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors line-clamp-1">{product.name}</h3>
      <p className="text-slate-300 font-medium text-sm md:text-base">Rp {product.price.toLocaleString()}</p>
    </div>
    <button 
      onClick={onAdd}
      disabled={product.stock === 0}
      className="mt-4 w-full py-2 bg-slate-700 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-bold"
    >
      <Plus size={16} /> Tambah
    </button>
  </div>
);

export const CafeView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

  const filteredProducts = activeCategory === 'ALL' 
    ? state.products 
    : state.products.filter(p => p.category === activeCategory);

  const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = state.cart.reduce((a,b) => a + b.quantity, 0);

  const handleCheckout = () => {
    if (state.cart.length === 0) return;
    if (confirm(`Proses pembayaran sebesar Rp ${cartTotal.toLocaleString()}?`)) {
      dispatch({ 
        type: 'CHECKOUT', 
        payload: { 
          total: cartTotal, 
          cashierName: state.user?.name || 'Kasir',
          customerName: 'Pelanggan Cafe'
        } 
      });
      alert('Transaksi Berhasil!');
      setIsCartOpenMobile(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
      {/* Menu Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-32 md:pb-6 border-r-0 md:border-r border-slate-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-amber-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
                Cafe Menu
            </h2>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === 'ALL' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Semua
                </button>
                {Object.values(ProductCategory).map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={() => dispatch({ type: 'ADD_PRODUCT_TO_CART', payload: product })}
            />
          ))}
        </div>
      </div>

      {/* Cart Sidebar / Bottom Sheet */}
      <div className={`
        fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 md:relative md:transform-none md:w-80 lg:w-96 bg-slate-900 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 shadow-xl
        ${isCartOpenMobile ? 'translate-y-0 h-[80vh]' : 'translate-y-[calc(100%-80px)] md:translate-y-0 h-auto md:h-full'}
      `}>
        
        {/* Mobile Toggle Handle */}
        <div 
            className="md:hidden h-12 bg-slate-850 flex items-center justify-between px-6 border-t border-emerald-500/30 cursor-pointer"
            onClick={() => setIsCartOpenMobile(!isCartOpenMobile)}
        >
            <div className="flex items-center gap-2 font-bold text-white">
                <ShoppingCart size={18} />
                <span>{cartCount} Items</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">Rp {cartTotal.toLocaleString()}</span>
                {isCartOpenMobile ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
        </div>

        <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-850 hidden md:block">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart size={20} />
            Pesanan ({cartCount})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
          {state.cart.length === 0 ? (
            <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                <Coffee size={48} className="mb-4 opacity-20" />
                <p>Keranjang kosong</p>
            </div>
          ) : (
            state.cart.map((item) => (
              <div key={item.itemId} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center group">
                <div className="flex-1">
                    <div className="text-white font-medium text-sm md:text-base">{item.name}</div>
                    <div className="text-slate-400 text-xs">Rp {item.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1">
                   <button 
                     onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.itemId })}
                     className="text-slate-400 hover:text-rose-400 p-2"
                   >
                     <Trash2 size={16} />
                   </button>
                   <span className="text-white font-mono w-6 text-center">{item.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-800 border-t border-slate-700 pb-20 md:pb-6">
          <div className="flex justify-between items-center mb-4 text-lg hidden md:flex">
            <span className="text-slate-400">Total</span>
            <span className="text-2xl font-bold text-emerald-400">Rp {cartTotal.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={state.cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 md:py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-900/20"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};