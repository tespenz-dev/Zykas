
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, BilliardTable, ProductCategory, TableStatus, CartItem } from '../types';
import { ReceiptData } from '../utils/printer';
import { Coffee, Beer, IceCream, Plus, Trash2, X, ShoppingCart, DollarSign, Printer, User as UserIcon, Minus, Clock } from 'lucide-react';

// --- KOMPONEN MODAL CHECKOUT ---
const CheckoutModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
}> = ({ isOpen, onClose, cart, total }) => {
  const { state, dispatch, printReceipt } = useApp();
  const [customerName, setCustomerName] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    const cashierName = state.user?.name || 'Unknown';
    
    // Kirim data ke reducer
    dispatch({ type: 'CHECKOUT', payload: { total, cashierName, customerName } });

    // Siapkan data untuk struk
    const receiptData: ReceiptData = {
      transaction: { // Buat objek transaksi sementara untuk dicetak
        id: `TX-${Date.now()}`,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        total,
        type: 'MIXED',
        details: cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
        cashierName,
        customerName: customerName || 'Pelanggan Umum',
      },
      cart,
      storeName: state.settings.storeName || 'Toko Anda',
      storeAddress: state.settings.storeAddress,
      storePhone: state.settings.storePhone,
      customReceiptFooter: state.settings.customReceiptFooter,
      cashierName,
    };

    // Cetak struk
    await printReceipt(receiptData);

    onClose();
    setCustomerName(''); // Reset nama pelanggan
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500" size={20} /> Konfirmasi Pembayaran
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-sm text-slate-400">Total Tagihan</div>
            <div className="text-4xl font-bold text-emerald-400">Rp {total.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <UserIcon size={14}/> Nama Pelanggan (Opsional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Pelanggan Umum"
            />
          </div>
        </div>
        <div className="p-4 bg-slate-800 border-t border-slate-700 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 font-bold transition-colors">
            Batal
          </button>
          <button onClick={handleCheckout} className="py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2">
            <Printer size={18} /> Bayar & Cetak
          </button>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA MENUVIEW ---
export const MenuView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeBilliardTab, setActiveBilliardTab] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');

  const cartTotal = useMemo(() => {
    return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [state.cart]);

  const productCategories = Object.values(ProductCategory);
  
  const filteredProducts = useMemo(() => {
    return state.products.filter(p => activeTab === 'ALL' || p.category === activeTab);
  }, [state.products, activeTab]);

  const filteredTables = useMemo(() => {
    return state.tables.filter(t => {
        if (activeBilliardTab === 'ALL') return true;
        return t.status === activeBilliardTab;
    });
  }, [state.tables, activeBilliardTab]);
  
  const getCategoryIcon = (category: ProductCategory) => {
    switch(category) {
      case ProductCategory.HOT_DRINK: return <Coffee size={18} />;
      case ProductCategory.COLD_DRINK: return <Beer size={18} />;
      case ProductCategory.SNACK: return <IceCream size={18} />;
      default: return null;
    }
  };

  const getTimeRemaining = (table: BilliardTable): string => {
      if (!table.startTime || table.status !== TableStatus.OCCUPIED) return '';
      const endTime = table.startTime + table.durationMinutes * 60 * 1000;
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) return 'Waktu Habis';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleAddToCart = (item: Product | BilliardTable, type: 'PRODUCT' | 'BILLIARD') => {
      if (type === 'PRODUCT') {
          dispatch({ type: 'ADD_PRODUCT_TO_CART', payload: item as Product });
      } else {
          // Hanya meja kosong yang bisa ditambah ke keranjang untuk memulai sewa baru
          const table = item as BilliardTable;
          if (table.status === TableStatus.AVAILABLE) {
              dispatch({ type: 'ADD_TABLE_TO_CART', payload: table });
          } else {
              // Jika meja sudah terisi, mungkin tambahkan logika top-up di sini jika diperlukan
              alert(`${table.name} sedang digunakan.`);
          }
      }
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Content (Kiri) */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Menu & Meja</h2>
        
        {/* Tabs Kategori */}
        <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-hide pb-4 shrink-0">
          <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === 'ALL' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Semua Menu</button>
          <button onClick={() => setActiveTab('BILLIARD')} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === 'BILLIARD' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Meja Billiard</button>
          {productCategories.filter(c => c !== ProductCategory.RAW_MATERIAL).map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === cat ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{cat}</button>
          ))}
        </div>

        {/* Konten Grid */}
        <div className="flex-1">
          {activeTab === 'BILLIARD' ? (
            <div>
                 <div className="flex bg-slate-800 p-1 rounded-lg w-fit my-4">
                    <button onClick={() => setActiveBilliardTab('ALL')} className={`px-3 py-1 text-xs rounded ${activeBilliardTab === 'ALL' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Semua</button>
                    <button onClick={() => setActiveBilliardTab('AVAILABLE')} className={`px-3 py-1 text-xs rounded ${activeBilliardTab === 'AVAILABLE' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Kosong</button>
                    <button onClick={() => setActiveBilliardTab('OCCUPIED')} className={`px-3 py-1 text-xs rounded ${activeBilliardTab === 'OCCUPIED' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Terisi</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredTables.map(table => (
                      <button key={table.id} onClick={() => handleAddToCart(table, 'BILLIARD')} disabled={table.status === TableStatus.OCCUPIED} className={`group relative p-4 rounded-xl border-2 transition-all text-left ${table.status === TableStatus.AVAILABLE ? 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-700' : 'bg-rose-900/50 border-rose-500/30 cursor-not-allowed'}`}>
                        <h3 className="font-bold text-white text-lg">{table.name}</h3>
                        <p className="text-xs text-slate-400">{table.status === TableStatus.AVAILABLE ? `Rp ${table.hourlyRate.toLocaleString()}/jam` : `a/n ${table.customerName || 'N/A'}`}</p>
                        {table.status === TableStatus.OCCUPIED && (
                          <div className="absolute bottom-2 right-2 text-xs font-mono bg-slate-900 px-2 py-1 rounded text-amber-400 flex items-center gap-1"><Clock size={12}/>{getTimeRemaining(table)}</div>
                        )}
                      </button>
                    ))}
                </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <button key={product.id} onClick={() => handleAddToCart(product, 'PRODUCT')} className="group bg-slate-800 p-3 rounded-xl border border-slate-700 text-left hover:bg-slate-700 hover:border-slate-500 transition-all active:scale-95 flex flex-col">
                  <div className="flex-1">
                    <div className="flex justify-between items-center text-slate-500 mb-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        {getCategoryIcon(product.category)}
                        <span>{product.category}</span>
                      </div>
                      <span className="text-xs font-mono">{product.stock > 99 ? '99+' : product.stock}</span>
                    </div>
                    <h3 className="font-bold text-white leading-tight mb-1">{product.name}</h3>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 mt-2">Rp {product.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar (Kanan) */}
      <div className="w-full md:w-96 bg-slate-900 border-l-2 border-slate-800 flex flex-col shrink-0 h-full">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart size={20}/> Keranjang</h3>
          <button onClick={() => dispatch({ type: 'CLEAR_CART' })} className="text-xs text-rose-500 hover:text-rose-400">Bersihkan</button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
              <ShoppingCart size={40} className="mb-2"/>
              <p className="text-sm font-medium">Keranjang kosong</p>
              <p className="text-xs">Pilih item dari menu untuk ditambahkan.</p>
            </div>
          ) : (
            state.cart.map(item => (
              <div key={item.itemId} className="bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">Rp {item.price.toLocaleString()} x {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">Rp {(item.price * item.quantity).toLocaleString()}</p>
                <button onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.itemId })} className="text-slate-500 hover:text-rose-500 p-1"><Trash2 size={16}/></button>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {state.cart.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Subtotal</span>
              <span className="text-white font-bold text-lg">Rp {cartTotal.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              Bayar
            </button>
          </div>
        )}
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} cart={state.cart} total={cartTotal} />
    </div>
  );
};
