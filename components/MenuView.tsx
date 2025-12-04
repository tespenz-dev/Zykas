import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BilliardTable, Product, TableStatus, ProductCategory } from '../types';
import { Clock, ArrowRightLeft, PlusCircle, Search, ShoppingCart, Plus, Trash2, Coffee, ChevronDown, ChevronUp, User, CheckCircle, AlertCircle, X, Square } from 'lucide-react';
import { BILLIARD_HOURLY_RATE } from '../constants';

// --- Subcomponents ---

const TableCard: React.FC<{ 
  table: BilliardTable; 
  onSelect: (table: BilliardTable) => void;
  onTopUp: (table: BilliardTable) => void;
  onStop: (table: BilliardTable) => void;
  onMove: (table: BilliardTable) => void;
}> = ({ table, onSelect, onTopUp, onStop, onMove }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (table.status === TableStatus.OCCUPIED && table.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.floor((now - table.startTime!) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [table.status, table.startTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = (table.durationMinutes * 60) - elapsed;
  const isOvertime = remainingSeconds < 0;

  return (
    <div 
      className={`relative p-3 md:p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.01] shadow-lg flex flex-col justify-between min-h-[140px] ${
        table.status === TableStatus.AVAILABLE 
          ? 'border-emerald-500/50 bg-slate-800 hover:bg-slate-700 cursor-pointer active:scale-95' 
          : 'border-rose-500/50 bg-slate-800'
      }`}
      onClick={(e) => {
          if (table.status === TableStatus.AVAILABLE) onSelect(table);
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-lg md:text-xl font-bold text-white leading-none">{table.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          table.status === TableStatus.AVAILABLE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {table.status === TableStatus.AVAILABLE ? 'Ready' : 'In Use'}
        </span>
      </div>

      {/* Info Body */}
      <div className="space-y-1 relative z-10 flex-1">
        {table.status === TableStatus.OCCUPIED ? (
          <>
            <div className="text-slate-400 text-xs md:text-sm flex items-center gap-2">
              <Clock size={14} />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
             <div className="text-slate-300 text-xs md:text-sm truncate font-medium">
              {table.customerName}
            </div>
            {table.durationMinutes > 0 && (
              <div className={`text-[10px] md:text-xs font-bold ${isOvertime ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`}>
                Sisa: {formatTime(Math.max(0, remainingSeconds))}
              </div>
            )}
            
            {/* Direct Action Buttons for Occupied Table */}
            <div className="grid grid-cols-3 gap-2 mt-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); onTopUp(table); }}
                    className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded py-1.5 flex items-center justify-center transition-colors"
                    title="Tambah Jam"
                >
                    <PlusCircle size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onMove(table); }}
                    className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 rounded py-1.5 flex items-center justify-center transition-colors"
                    title="Pindah Meja"
                >
                    <ArrowRightLeft size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onStop(table); }}
                    className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded py-1.5 flex items-center justify-center transition-colors"
                    title="Stop Timer"
                >
                    <Square size={14} fill="currentColor" />
                </button>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-xs md:text-sm italic mt-2">Tap untuk sewa</div>
        )}
      </div>

      {/* Visual Cue Ball */}
      <div className={`absolute bottom-3 right-3 w-7 h-7 md:w-8 md:h-8 rounded-full shadow-inner flex items-center justify-center pointer-events-none ${
        table.status === TableStatus.OCCUPIED ? 'bg-gradient-to-br from-rose-400 to-rose-600 opacity-20' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
      }`}>
        <span className="text-white font-bold text-xs md:text-sm">{table.id}</span>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; effectiveStock: number; onAdd: () => void }> = ({ product, effectiveStock, onAdd }) => (
  <div 
    onClick={() => effectiveStock > 0 && onAdd()}
    className={`
        relative bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col justify-between 
        transition-all group h-full w-full overflow-hidden select-none min-h-[100px]
        ${effectiveStock > 0 ? 'hover:border-emerald-500/50 hover:bg-slate-750 cursor-pointer active:scale-95 shadow-sm hover:shadow-md' : 'opacity-50 cursor-not-allowed grayscale'}
      `}
  >
    <div>
      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-tight">{product.name}</h3>
      <span className={`${effectiveStock > 0 ? 'text-emerald-400' : 'text-rose-400'} text-[10px] font-mono font-bold`}>
         Stok: {effectiveStock}
      </span>
    </div>

    <div className="mt-auto flex items-center justify-between pt-2">
      <p className="text-slate-300 font-bold text-xs">Rp {product.price.toLocaleString()}</p>
      {effectiveStock > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-700 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
            <Plus size={14} strokeWidth={3} />
        </div>
      )}
    </div>
  </div>
);

// --- Main Component ---

export const MenuView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'BILLIARD' | ProductCategory>('BILLIARD');
  
  // Cart Logic
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  // Checkout Modal & Payment Logic
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Table Move Modal
  const [moveTableData, setMoveTableData] = useState<{ fromId: number; toId: string } | null>(null);

  // Filter Data
  const filteredTables = state.tables;
  const filteredProducts = state.products.filter(p => {
    // Exclude Raw Materials from POS
    if (p.category === ProductCategory.RAW_MATERIAL) return false;

    if (searchTerm) {
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return activeTab === 'BILLIARD' ? false : p.category === activeTab;
  });

  // Helper to get stock (handles linked stock)
  const getEffectiveStock = (product: Product): number => {
      if (product.stockLinkedToId) {
          const parent = state.products.find(p => p.id === product.stockLinkedToId);
          return parent ? parent.stock : 0;
      }
      return product.stock;
  };

  // Cart Calculations
  const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = state.cart.reduce((a,b) => a + b.quantity, 0);
  const hasTableInCart = state.cart.some(item => item.itemType === 'BILLIARD');
  
  // Payment Calculations
  const changeAmount = paidAmount - cartTotal;
  const isPaymentSufficient = paidAmount >= cartTotal;

  // --- Handlers ---

  const handleTableSelect = (table: BilliardTable) => {
    dispatch({ type: 'ADD_TABLE_TO_CART', payload: table });
  };

  const handleTopUpTable = (table: BilliardTable) => {
    dispatch({ type: 'ADD_TABLE_TO_CART', payload: table });
  };

  const handleStopTable = (table: BilliardTable) => {
     dispatch({ type: 'STOP_TABLE', payload: { tableId: table.id } });
  };

  const handleMoveTableClick = (table: BilliardTable) => {
      setMoveTableData({ fromId: table.id, toId: '' });
  };

  const confirmMoveTable = () => {
      if (moveTableData && moveTableData.toId) {
          dispatch({ type: 'MOVE_TABLE', payload: { fromId: moveTableData.fromId, toId: parseInt(moveTableData.toId) } });
          setMoveTableData(null);
      }
  };

  const handleOpenCheckout = () => {
      setPaidAmount(0); // Reset payment input
      setShowCheckoutModal(true);
  };

  const processPayment = () => {
    if (hasTableInCart && !customerName.trim()) {
        setShowCheckoutModal(false);
        alert("Mohon isi Nama Pelanggan untuk sewa meja.");
        setTimeout(() => {
            customerInputRef.current?.focus();
        }, 100);
        return;
    }

    if (!isPaymentSufficient) {
        alert("Uang pembayaran kurang!");
        return;
    }

    dispatch({ 
        type: 'CHECKOUT', 
        payload: { 
            total: cartTotal, 
            cashierName: state.user?.name || 'Kasir',
            customerName: customerName.trim()
        } 
    });
    
    // Reset
    setCustomerName('');
    setIsCartOpenMobile(false);
    setShowCheckoutModal(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
      
      {/* --- Left Side: Catalog --- */}
      <div className="flex-1 flex flex-col min-w-0 border-r-0 md:border-r border-slate-700/50 bg-slate-950">
        
        {/* Header Section */}
        <div className="p-4 md:p-6 pb-2 shrink-0 z-20 bg-slate-950">
           {/* Header Layout: Tabs on top, Search bar below */}
           <div className="flex flex-col gap-4">
              
              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full scrollbar-hide pb-1">
                  <button 
                      onClick={() => { setActiveTab('BILLIARD'); setSearchTerm(''); }}
                      className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === 'BILLIARD' ? 'bg-emerald-500 text-white shadow-emerald-900/50' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  >
                      Billiard
                  </button>
                  {Object.values(ProductCategory)
                    .filter(cat => cat !== ProductCategory.RAW_MATERIAL) // Hide Raw Material
                    .map(cat => (
                      <button 
                          key={cat}
                          onClick={() => { setActiveTab(cat); setSearchTerm(''); }}
                          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === cat ? 'bg-amber-500 text-white shadow-amber-900/50' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>

               {/* Search Bar - Moved below tabs */}
               <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari meja atau menu..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600 transition-all shadow-sm focus:shadow-md"
                    />
               </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2 pb-32 md:pb-6">
            
            {/* Billiard Tables Section */}
            {activeTab === 'BILLIARD' && !searchTerm && (
                <div className="mb-8 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {filteredTables.map(table => (
                            <TableCard 
                                key={table.id} 
                                table={table} 
                                onSelect={handleTableSelect}
                                onTopUp={handleTopUpTable}
                                onStop={handleStopTable}
                                onMove={handleMoveTableClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {(activeTab !== 'BILLIARD' || searchTerm) && (
                <div className="animate-fade-in">
                    {searchTerm && filteredProducts.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">
                            <p>Produk "{searchTerm}" tidak ditemukan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                            {filteredProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    effectiveStock={getEffectiveStock(product)}
                                    onAdd={() => dispatch({ type: 'ADD_PRODUCT_TO_CART', payload: product })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --- Right Side: Cart Sidebar --- */}
      <div className={`
        fixed inset-x-0 bottom-16 md:bottom-0 z-[60] transform transition-transform duration-300 md:relative md:transform-none md:w-80 lg:w-96 bg-slate-900 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 shadow-2xl
        ${isCartOpenMobile ? 'translate-y-0 h-[70vh]' : 'translate-y-[calc(100%-48px)] md:translate-y-0 h-auto md:h-full'}
      `}>
        
        {/* Mobile Toggle Handle */}
        <div 
            className="md:hidden h-12 bg-slate-850 flex items-center justify-between px-6 border-t border-emerald-500/30 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setIsCartOpenMobile(!isCartOpenMobile)}
        >
            <div className="flex items-center gap-2 font-bold text-white text-sm">
                <ShoppingCart size={16} />
                <span>{cartCount} Items</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm">Rp {cartTotal.toLocaleString()}</span>
                {isCartOpenMobile ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
        </div>

        {/* Cart Header (Desktop) */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-850 hidden md:block">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCart size={20} />
            Pesanan ({cartCount})
          </h3>
        </div>

        {/* Customer Info Input */}
        <div className="p-4 bg-slate-900 border-b border-slate-800">
             <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    ref={customerInputRef}
                    type="text" 
                    placeholder="Nama Pelanggan (Wajib untuk Meja)" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full bg-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 border focus:ring-2 outline-none transition-all ${!customerName && hasTableInCart ? 'border-amber-500/50 focus:ring-amber-500 placeholder:text-amber-500/50' : 'border-slate-700 focus:ring-emerald-500'}`}
                />
             </div>
             {hasTableInCart && !customerName && (
                 <p className="text-[10px] text-amber-500 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Nama wajib diisi untuk sewa meja
                 </p>
             )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900 min-h-0">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
                <Coffee size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : (
            state.cart.map((item) => (
              <div key={item.itemId} className="bg-slate-800 p-3 rounded-xl flex justify-between items-center group border border-transparent hover:border-slate-700 transition-all">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="text-white font-medium text-sm truncate">{item.name}</div>
                    <div className="text-slate-400 text-xs flex items-center gap-2">
                        <span>Rp {item.price.toLocaleString()}</span>
                        {item.itemType === 'BILLIARD' && <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 rounded">SEWA</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-slate-800">
                   <button 
                     onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.itemId })}
                     className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                   >
                     <Trash2 size={14} />
                   </button>
                   <span className="text-white font-mono text-xs font-bold w-4 text-center">
                       {item.itemType === 'BILLIARD' ? `${item.quantity}j` : item.quantity}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section (Fixed Bottom) */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 pb-safe">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm">Total Tagihan</span>
            <span className="text-xl md:text-2xl font-bold text-emerald-400">Rp {cartTotal.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={handleOpenCheckout}
            disabled={state.cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* --- Modals --- */}

      {/* Move Table Modal */}
      {moveTableData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Pindah Meja</h3>
                  <p className="text-slate-400 text-sm mb-4">
                      Pindahkan sesi dari <strong className="text-white">{state.tables.find(t => t.id === moveTableData.fromId)?.name}</strong> ke:
                  </p>
                  <select 
                      className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 outline-none mb-6"
                      value={moveTableData.toId}
                      onChange={(e) => setMoveTableData({...moveTableData, toId: e.target.value})}
                  >
                      <option value="">Pilih Meja Tujuan...</option>
                      {state.tables.filter(t => t.status === TableStatus.AVAILABLE).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setMoveTableData(null)}
                          className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 font-bold"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={confirmMoveTable}
                          disabled={!moveTableData.toId}
                          className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold"
                      >
                          Pindah
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <CheckCircle className="text-emerald-500" size={20} />
                          Konfirmasi Pembayaran
                      </h3>
                      <button onClick={() => setShowCheckoutModal(false)} className="text-slate-500 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto">
                      {/* Customer Info */}
                      <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700/50">
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Pelanggan</div>
                          <div className="text-lg text-white font-medium">{customerName || 'Umum'}</div>
                      </div>

                      {/* Order Summary Details */}
                      <div className="mb-6">
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Rincian Pesanan</div>
                          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                                <div className="max-h-40 overflow-y-auto">
                                    {state.cart.map((item) => (
                                        <div key={item.itemId} className="flex justify-between items-start p-3 border-b border-slate-700/30 last:border-0 text-sm">
                                            <div className="flex-1 pr-2">
                                                <div className="text-white font-medium line-clamp-1">{item.name}</div>
                                                <div className="text-slate-500 text-xs mt-0.5">
                                                    {item.quantity} x Rp {item.price.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-slate-300 font-mono text-right whitespace-nowrap">
                                                Rp {(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                          </div>
                      </div>

                      {/* Payment Input Section */}
                      <div className="mb-6">
                           <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Uang Diterima</div>
                           <div className="relative mb-3">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
                               <input 
                                  type="number"
                                  value={paidAmount || ''}
                                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-800 text-white text-2xl font-bold rounded-xl pl-12 pr-4 py-3 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                  placeholder="0"
                                  autoFocus
                               />
                           </div>
                           
                           {/* Quick Cash Buttons */}
                           <div className="grid grid-cols-3 gap-2">
                               <button 
                                  onClick={() => setPaidAmount(cartTotal)}
                                  className="py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                               >
                                  Uang Pas
                               </button>
                               <button 
                                  onClick={() => setPaidAmount(50000)}
                                  className="py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                               >
                                  50.000
                               </button>
                               <button 
                                  onClick={() => setPaidAmount(100000)}
                                  className="py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                               >
                                  100.000
                               </button>
                           </div>
                      </div>

                      {/* Calculations Display */}
                      <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Total Tagihan</span>
                              <span className="text-white font-mono">Rp {cartTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Uang Diterima</span>
                              <span className="text-white font-mono">Rp {paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-800 my-1"></div>
                          <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-bold">
                                  {changeAmount >= 0 ? 'Kembalian' : 'Kurang'}
                              </span>
                              <span className={`text-xl font-bold font-mono ${changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Rp {Math.abs(changeAmount).toLocaleString()}
                              </span>
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-800 border-t border-slate-700 grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => setShowCheckoutModal(false)}
                          className="py-3.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 font-bold transition-colors"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={processPayment}
                          disabled={!isPaymentSufficient}
                          className="py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors"
                      >
                          Proses Bayar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};