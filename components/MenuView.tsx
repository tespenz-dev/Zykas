
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BilliardTable, Product, TableStatus, ProductCategory } from '../types';
import { Clock, ArrowRightLeft, PlusCircle, Search, ShoppingCart, Plus, Trash2, Coffee, ChevronDown, ChevronUp, User, CheckCircle, AlertCircle, X, Square, Shield, Lock, Unlock, DollarSign, Wallet } from 'lucide-react';
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
      {table.status === TableStatus.OCCUPIED ? (
        <div className="space-y-1 relative z-10">
          <div className="text-white text-xs md:text-sm font-medium truncate flex items-center gap-1">
             <User size={12}/> {table.customerName || 'Tamu'}
          </div>
          <div className={`text-2xl md:text-3xl font-mono font-bold tracking-tight ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
             {formatTime(Math.abs(remainingSeconds))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
             <span>Sisa Waktu</span>
             {isOvertime && <span className="text-rose-500">Overtime</span>}
          </div>
        </div>
      ) : (
         <div className="flex-1 flex items-center justify-center relative z-10">
             <span className="text-slate-500 text-xs italic">Tap untuk sewa</span>
         </div>
      )}

      {/* Action Buttons Overlay for Occupied */}
      {table.status === TableStatus.OCCUPIED && (
          <div className="mt-3 grid grid-cols-3 gap-2 relative z-20">
              <button 
                  onClick={(e) => { e.stopPropagation(); onStop(table); }}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-1.5 flex items-center justify-center transition-colors"
                  title="Stop"
              >
                  <Square size={16} fill="currentColor" />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onTopUp(table); }}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-1.5 flex items-center justify-center transition-colors"
                  title="Tambah Waktu"
              >
                  <PlusCircle size={18} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onMove(table); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-1.5 flex items-center justify-center transition-colors"
                  title="Pindah Meja"
              >
                  <ArrowRightLeft size={18} />
              </button>
          </div>
      )}
      
      {/* Background Number Watermark */}
      <div className="absolute bottom-2 right-2 text-6xl font-black text-slate-700/20 pointer-events-none z-0">
          {table.id}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; onClick: (p: Product) => void }> = ({ product, onClick }) => (
  <button 
    onClick={() => onClick(product)}
    className={`p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-left transition-all active:scale-95 flex flex-col justify-between h-32 relative overflow-hidden group ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    disabled={product.stock === 0}
  >
    <div className="z-10">
      <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
      <div className="text-emerald-400 font-bold text-sm">Rp {product.price.toLocaleString()}</div>
    </div>
    <div className="z-10 mt-auto flex justify-between items-end w-full">
         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${product.stock <= 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-600/50 text-slate-400'}`}>
            Stok: {product.stock}
         </span>
         <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform translate-y-10 group-hover:translate-y-0 transition-transform">
            <Plus size={16} />
         </div>
    </div>
    {/* Icon Watermark */}
    <div className="absolute -bottom-2 -right-2 text-slate-700/30">
        <Coffee size={64} />
    </div>
  </button>
);

// --- Main Component ---

export const MenuView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<string>('BILLIARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  
  // Shift Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false); // Untuk Buka Kasir
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false); // Untuk Tutup Kasir
  const [startCashInput, setStartCashInput] = useState('');

  // Table Action Modals
  const [showTableModal, setShowTableModal] = useState<'START' | 'TOPUP' | 'MOVE' | null>(null);
  const [duration, setDuration] = useState(60); // Default 60 mins
  const [targetTableId, setTargetTableId] = useState<number | null>(null);

  const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isShiftActive = !!state.activeShift;

  // --- Handlers ---

  const handleOpenShift = (e: React.FormEvent) => {
      e.preventDefault();
      if (!startCashInput) return;
      
      dispatch({ 
          type: 'OPEN_SHIFT', 
          payload: {
              startCash: parseInt(startCashInput),
              cashierId: state.user?.id || 'unknown',
              cashierName: state.user?.name || 'Unknown'
          }
      });
      setIsShiftModalOpen(false);
      setStartCashInput('');
  };

  const handleCloseShift = () => {
      dispatch({ type: 'CLOSE_SHIFT' });
      setIsCloseShiftModalOpen(false);
  };

  const handleTableAction = (table: BilliardTable, action: 'START' | 'TOPUP' | 'MOVE') => {
      setActiveTableId(table.id);
      setShowTableModal(action);
      setDuration(60);
      setCustomerName('');
  };

  const handleConfirmTableAction = () => {
      if (!activeTableId) return;

      if (showTableModal === 'START') {
          if (!customerName.trim()) {
              alert('Nama Pelanggan wajib diisi!');
              return;
          }
          dispatch({ 
              type: 'START_TABLE', 
              payload: { tableId: activeTableId, duration, customer: customerName } 
          });
      } else if (showTableModal === 'TOPUP') {
          dispatch({ 
              type: 'TOPUP_TABLE', 
              payload: { tableId: activeTableId, duration } 
          });
      } else if (showTableModal === 'MOVE') {
          if (!targetTableId) return;
          dispatch({ 
              type: 'MOVE_TABLE', 
              payload: { fromId: activeTableId, toId: targetTableId } 
          });
      }
      setShowTableModal(null);
  };

  const handleAddToCart = (product: Product) => {
      dispatch({ type: 'ADD_PRODUCT_TO_CART', payload: product });
  };

  const handleCheckout = () => {
    if (!isShiftActive) {
        setIsShiftModalOpen(true);
        return;
    }
    if (state.cart.length === 0) return;
    
    // Check if customer name is needed (if billiard item exists)
    const hasBilliard = state.cart.some(i => i.itemType === 'BILLIARD');
    if (hasBilliard && !customerName.trim()) {
       alert("Nama Pelanggan wajib diisi untuk sewa meja!");
       return;
    }

    if (confirm(`Total Rp ${cartTotal.toLocaleString()}. Proses bayar?`)) {
      dispatch({ 
        type: 'CHECKOUT', 
        payload: { 
          total: cartTotal, 
          cashierName: state.user?.name || 'Unknown',
          customerName: customerName
        } 
      });
      setCustomerName('');
    }
  };

  // Filter Logic
  const filteredProducts = state.products.filter(p => 
      (activeTab === 'ALL' || p.category === activeTab) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      p.category !== ProductCategory.RAW_MATERIAL // Jangan tampilkan bahan baku di menu kasir
  );

  const filteredTables = state.tables.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
      
      {/* --- Left Side: Menu Grid --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        
        {/* Header & Tabs */}
        <div className="p-4 md:p-6 shrink-0 bg-slate-950 z-20">
            {/* SHIFT STATUS BUTTON (MOVED TO TOP FOR VISIBILITY) */}
            <div className="mb-4">
                 {isShiftActive ? (
                     <button 
                        onClick={() => setIsCloseShiftModalOpen(true)}
                        className="w-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-900/50 transition-colors shadow-lg shadow-emerald-900/10"
                     >
                        <Unlock size={18} /> 
                        <span>KASIR BUKA (ID: {state.activeShift?.id.slice(-4)})</span>
                     </button>
                 ) : (
                     <button 
                        onClick={() => setIsShiftModalOpen(true)}
                        className="w-full bg-rose-900/30 text-rose-400 border border-rose-500/50 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-900/50 transition-colors animate-pulse shadow-lg shadow-rose-900/10"
                     >
                        <Lock size={18} /> 
                        <span>KASIR TUTUP - KLIK UNTUK BUKA</span>
                     </button>
                 )}
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                 {/* Tabs */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full xl:w-auto">
                    <button 
                        onClick={() => setActiveTab('BILLIARD')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                            activeTab === 'BILLIARD' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        Billiard
                    </button>
                    {Object.values(ProductCategory).filter(c => c !== ProductCategory.RAW_MATERIAL).map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                                activeTab === cat ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Cari meja atau menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                />
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-0 pb-32 md:pb-6 scrollbar-hide">
            {activeTab === 'BILLIARD' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTables.map(table => (
                        <TableCard 
                            key={table.id} 
                            table={table} 
                            onSelect={() => handleTableAction(table, 'START')}
                            onTopUp={() => handleTableAction(table, 'TOPUP')}
                            onStop={(t) => dispatch({ type: 'STOP_TABLE', payload: { tableId: t.id } })}
                            onMove={() => handleTableAction(table, 'MOVE')}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onClick={handleAddToCart} />
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- Right Side: Cart Sidebar --- */}
      <div className="w-full md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-[40vh] md:h-full fixed bottom-0 md:relative z-40 shadow-2xl md:shadow-none rounded-t-3xl md:rounded-none">
         
         {/* Cart Header */}
         <div className="p-4 border-b border-slate-800 bg-slate-900 rounded-t-3xl md:rounded-none flex flex-col gap-3">
             {/* Operator Info Block - PROMINENT DISPLAY */}
             <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold border border-slate-600 shadow-sm">
                         <User size={20} />
                     </div>
                     <div>
                         <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operator Bertugas</div>
                         <div className="text-white font-bold text-sm">{state.user?.name}</div>
                     </div>
                 </div>
                 {/* Status indicator */}
                 <div className={`w-3 h-3 rounded-full ${isShiftActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} title={isShiftActive ? 'Shift Aktif' : 'Shift Tutup'} />
             </div>

             <div className="flex items-center gap-2 text-emerald-400 mt-2">
                 <ShoppingCart size={20} />
                 <h2 className="font-bold text-lg">Keranjang Pesanan ({state.cart.reduce((a, b) => a + b.quantity, 0)})</h2>
             </div>
             
             <input 
                 type="text" 
                 placeholder="Nama Pelanggan (Wajib untuk Meja)"
                 value={customerName}
                 onChange={(e) => setCustomerName(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none"
             />
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {state.cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                     <Coffee size={48} className="opacity-20" />
                     <p className="text-sm">Keranjang kosong</p>
                 </div>
             ) : (
                 state.cart.map((item, idx) => (
                     <div key={idx} className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center group">
                         <div>
                             <div className="text-white font-medium text-sm">{item.name}</div>
                             <div className="text-xs text-slate-500">
                                 {item.quantity} x Rp {item.price.toLocaleString()}
                             </div>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="text-emerald-400 font-bold text-sm">
                                 Rp {(item.price * item.quantity).toLocaleString()}
                             </div>
                             <button 
                                 onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.itemId })}
                                 className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                             >
                                 <X size={16} />
                             </button>
                         </div>
                     </div>
                 ))
             )}
         </div>

         {/* Cart Footer */}
         <div className="p-4 bg-slate-800 border-t border-slate-700">
             <div className="flex justify-between items-center mb-4">
                 <span className="text-slate-400 font-medium">Total Tagihan</span>
                 <span className="text-2xl font-bold text-emerald-400">Rp {cartTotal.toLocaleString()}</span>
             </div>
             
             <button 
                 onClick={handleCheckout}
                 disabled={!isShiftActive || state.cart.length === 0}
                 className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                    !isShiftActive 
                     ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                     : state.cart.length === 0 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 active:scale-95'
                 }`}
             >
                 {isShiftActive ? <CheckCircle size={20} /> : <Lock size={20} />}
                 {isShiftActive ? 'Bayar Sekarang' : 'Buka Kasir Dulu'}
             </button>
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Table Action (Start/Topup/Move) */}
      {showTableModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                      {showTableModal === 'START' ? 'Mulai Sewa Meja' : showTableModal === 'TOPUP' ? 'Tambah Waktu' : 'Pindah Meja'}
                  </h3>
                  
                  {showTableModal === 'START' && (
                      <div className="mb-4">
                          <label className="block text-sm text-slate-400 mb-1">Nama Tamu</label>
                          <input 
                              type="text" 
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                              placeholder="Masukkan nama..."
                              autoFocus
                          />
                      </div>
                  )}

                  {showTableModal !== 'MOVE' && (
                       <div className="mb-6">
                          <label className="block text-sm text-slate-400 mb-1">Durasi (Menit)</label>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                              {[60, 120, 180].map(m => (
                                  <button key={m} onClick={() => setDuration(m)} className={`py-2 rounded-lg text-sm font-bold ${duration === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                      {m / 60} Jam
                                  </button>
                              ))}
                          </div>
                          <input 
                              type="number" 
                              value={duration}
                              onChange={(e) => setDuration(parseInt(e.target.value))}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none text-center font-bold"
                          />
                      </div>
                  )}

                  {showTableModal === 'MOVE' && (
                      <div className="mb-6">
                          <label className="block text-sm text-slate-400 mb-1">Pindah ke Meja:</label>
                          <select 
                             className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                             onChange={(e) => setTargetTableId(parseInt(e.target.value))}
                             defaultValue=""
                          >
                              <option value="" disabled>Pilih Meja Kosong</option>
                              {state.tables.filter(t => t.status === TableStatus.AVAILABLE).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>
                  )}

                  <div className="flex gap-3">
                      <button onClick={() => setShowTableModal(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700">Batal</button>
                      <button onClick={handleConfirmTableAction} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500">Konfirmasi</button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Modal BUKA KASIR (Open Shift) */}
      {isShiftModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
              <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Buka Kasir</h2>
                  <p className="text-slate-400 text-sm mb-6">Masukkan jumlah uang modal awal di laci kasir.</p>
                  
                  <form onSubmit={handleOpenShift}>
                      <div className="relative mb-6">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                          <input 
                              type="number" 
                              required
                              value={startCashInput}
                              onChange={(e) => setStartCashInput(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-600 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="0"
                              autoFocus
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/30 transition-all">
                          Buka Shift Sekarang
                      </button>
                  </form>
                  <button onClick={() => setIsShiftModalOpen(false)} className="mt-4 text-slate-500 text-sm hover:text-white">Batal</button>
              </div>
          </div>
      )}

      {/* 3. Modal TUTUP KASIR (Close Shift) */}
      {isCloseShiftModalOpen && state.activeShift && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
              <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-8">
                  <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Ringkasan Shift</h2>
                      <p className="text-slate-400 text-sm">Operator: {state.activeShift.cashierName}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center p-3 bg-slate-800 rounded-xl">
                          <span className="text-slate-400 text-sm">Modal Awal</span>
                          <span className="text-white font-mono font-bold">Rp {state.activeShift.startCash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800 rounded-xl">
                          <span className="text-slate-400 text-sm">Total Penjualan</span>
                          <span className="text-emerald-400 font-mono font-bold">+ Rp {state.activeShift.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-600 my-2"></div>
                      <div className="flex justify-between items-center p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                          <span className="text-emerald-200 font-bold uppercase text-xs tracking-wider">Total Uang Laci</span>
                          <span className="text-2xl text-emerald-400 font-bold">Rp {(state.activeShift.startCash + state.activeShift.totalSales).toLocaleString()}</span>
                      </div>
                  </div>

                  <button 
                      onClick={handleCloseShift}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-900/30 transition-all mb-3"
                  >
                      Tutup Kasir & Logout
                  </button>
                  <button onClick={() => setIsCloseShiftModalOpen(false)} className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-bold">Kembali</button>
              </div>
          </div>
      )}

    </div>
  );
};
