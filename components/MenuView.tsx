
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BilliardTable, Product, TableStatus, ProductCategory, Transaction } from '../types';
import { PlusCircle, Search, ShoppingCart, Plus, X, Square, Wallet, Lock, Unlock, User, CheckCircle, ArrowRightLeft, Coffee, Monitor, CircleCheck, CircleX, ChevronRight, Trash2 } from 'lucide-react';
import { BILLIARD_HOURLY_RATE } from '../constants';
import { ReceiptData } from '../utils/printer';

// --- Subcomponents (Memoized for Performance) ---

const TableCard: React.FC<{ 
  table: BilliardTable; 
  onSelect: (table: BilliardTable) => void;
  onTopUp: (table: BilliardTable) => void;
  onStop: (table: BilliardTable) => void;
  onMove: (table: BilliardTable) => void;
}> = React.memo(({ table, onSelect, onTopUp, onStop, onMove }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (table.status === TableStatus.OCCUPIED && table.startTime) {
      // Calculate immediately
      setElapsed(Math.floor((Date.now() - table.startTime) / 1000));
      
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
      className={`relative p-3 md:p-4 rounded-2xl border-2 transition-all transform active:scale-95 shadow-lg flex flex-col justify-between min-h-[140px] md:min-h-[160px] ${
        table.status === TableStatus.AVAILABLE 
          ? 'border-emerald-500/50 bg-slate-800 hover:bg-slate-700 cursor-pointer' 
          : 'border-rose-500/50 bg-slate-800'
      }`}
      onClick={(e) => {
          if (table.status === TableStatus.AVAILABLE) onSelect(table);
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-lg md:text-xl font-bold text-white leading-none truncate pr-2">{table.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
          table.status === TableStatus.AVAILABLE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {table.status === TableStatus.AVAILABLE ? 'KOSONG' : 'DIPAKAI'}
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
             {isOvertime && <span className="text-rose-500">Lewat Waktu</span>}
          </div>
        </div>
      ) : (
         <div className="flex-1 flex items-center justify-center relative z-10">
             <div className="text-center">
                <span className="text-emerald-400 font-bold text-sm block">+ Tambah</span>
                <span className="text-slate-500 text-[10px] italic">1 Klik = 1 Jam</span>
             </div>
         </div>
      )}

      {/* Action Buttons Overlay for Occupied */}
      {table.status === TableStatus.OCCUPIED && (
          <div className="mt-3 grid grid-cols-3 gap-2 relative z-20">
              <button 
                  onClick={(e) => { e.stopPropagation(); onStop(table); }}
                  className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2 md:py-1.5 flex items-center justify-center transition-colors"
                  title="Stop / Selesai"
              >
                  <Square size={18} fill="currentColor" />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onTopUp(table); }}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 md:py-1.5 flex items-center justify-center transition-colors"
                  title="Tambah Waktu"
              >
                  <PlusCircle size={20} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onMove(table); }}
                  className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2 md:py-1.5 flex items-center justify-center transition-colors"
                  title="Pindah Meja"
              >
                  <ArrowRightLeft size={20} />
              </button>
          </div>
      )}
      
      {/* Background Number Watermark */}
      <div className="absolute bottom-2 right-2 text-6xl font-black text-slate-700/20 pointer-events-none z-0">
          {table.id}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
    // Custom comparison function for performance
    return (
        prevProps.table.id === nextProps.table.id &&
        prevProps.table.status === nextProps.table.status &&
        prevProps.table.startTime === nextProps.table.startTime &&
        prevProps.table.durationMinutes === nextProps.table.durationMinutes &&
        prevProps.table.customerName === nextProps.table.customerName &&
        prevProps.table.name === nextProps.table.name
    );
});

const ProductCard: React.FC<{ product: Product; onClick: (p: Product) => void }> = React.memo(({ product, onClick }) => (
  <button 
    onClick={() => onClick(product)}
    className={`p-3 md:p-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-left transition-all active:scale-95 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group w-full ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    disabled={product.stock === 0}
  >
    <div className="z-10 w-full">
      <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 leading-tight mb-2 pr-4">{product.name}</h3>
      <div className="text-emerald-400 font-bold text-sm md:text-base">Rp {product.price.toLocaleString()}</div>
    </div>
    <div className="z-10 mt-auto flex justify-between items-end w-full">
         <span className={`text-[10px] px-2 py-1 rounded font-bold ${product.stock <= 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-600/50 text-slate-400'}`}>
            Stok: {product.stock}
         </span>
         <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform translate-y-1 md:translate-y-10 group-hover:translate-y-0 transition-transform">
            <Plus size={20} />
         </div>
    </div>
    {/* Icon Watermark */}
    <div className="absolute -bottom-2 -right-2 text-slate-700/30">
        <Coffee size={72} />
    </div>
  </button>
));

// --- Custom Payment Confirmation Modal ---
interface PaymentConfirmationModalProps {
    total: number;
    customerName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({ total, customerName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fade-in">
        <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Konfirmasi Pembayaran</h2>
            <p className="text-slate-400 text-sm mb-6">Pastikan jumlah total sudah benar.</p>
            
            <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-sm">Total Tagihan</span>
                    <span className="text-2xl font-bold text-emerald-400">Rp {total.toLocaleString()}</span>
                </div>
                {customerName && <p className="text-left text-xs text-slate-500">Pelanggan: {customerName}</p>}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onCancel} 
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={onConfirm} 
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-colors"
                >
                    Konfirmasi Bayar
                </button>
            </div>
        </div>
    </div>
);

// --- Custom Status Message Modal (Success/Error) ---
interface StatusMessageModalProps {
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
}

const StatusMessageModal: React.FC<StatusMessageModalProps> = ({ type, title, message, onClose }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fade-in">
        <div className={`bg-slate-900 border-2 ${type === 'success' ? 'border-emerald-700' : 'border-rose-700'} w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center`}>
            <div className={`w-16 h-16 ${type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {type === 'success' ? <CircleCheck size={32} /> : <CircleX size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            
            <button 
                onClick={onClose} 
                className={`w-full py-3 ${type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'} text-white rounded-xl font-bold shadow-lg transition-colors`}
            >
                OK
            </button>
        </div>
    </div>
);

// --- Main Component ---

export const MenuView: React.FC = () => {
  const { state, dispatch, printReceipt } = useApp();
  const [activeTab, setActiveTab] = useState<string>('BILLIARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  
  // Shift Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [startCashInput, setStartCashInput] = useState('');
  const [selectedShiftOperatorId, setSelectedShiftOperatorId] = useState('');

  // Table Action Modals
  const [showTableModal, setShowTableModal] = useState<'TOPUP' | 'MOVE' | null>(null);
  const [duration, setDuration] = useState(60);
  const [targetTableId, setTargetTableId] = useState<number | null>(null);

  // Custom Payment Modals State
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [paymentStatusModal, setPaymentStatusModal] = useState<{ type: 'success' | 'error'; title: string; message: string; } | null>(null);

  // State for mobile cart visibility toggling
  const [mobileCartVisible, setMobileCartVisible] = useState(false);

  const cartTotal = useMemo(() => state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [state.cart]);
  const cartCount = useMemo(() => state.cart.reduce((a, b) => a + b.quantity, 0), [state.cart]);
  const isShiftActive = !!state.activeShift;

  // Initialize selected operator when modal opens
  useEffect(() => {
    if (isShiftModalOpen && state.users.length > 0 && !selectedShiftOperatorId) {
      setSelectedShiftOperatorId(state.users[0].id);
    }
  }, [isShiftModalOpen, state.users, selectedShiftOperatorId]);

  // --- Handlers ---

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOperator = state.users.find(u => u.id === selectedShiftOperatorId);

    if (!startCashInput || !selectedOperator) {
      alert("Pastikan operator dipilih dan modal awal diisi.");
      return;
    }
    
    dispatch({ 
        type: 'OPEN_SHIFT', 
        payload: {
            startCash: parseInt(startCashInput),
            cashierId: selectedOperator.id,
            cashierName: selectedOperator.name
        }
    });
    setIsShiftModalOpen(false);
    setStartCashInput('');
    setSelectedShiftOperatorId('');
  };

  const handleCloseShift = () => {
      dispatch({ type: 'CLOSE_SHIFT' });
      setIsCloseShiftModalOpen(false);
  };

  const handleTableAction = (table: BilliardTable, action: 'TOPUP' | 'MOVE') => {
      setActiveTableId(table.id);
      setShowTableModal(action);
      setDuration(60);
      setCustomerName('');
  };

  const handleConfirmTableAction = () => {
      if (!activeTableId) return;

      if (showTableModal === 'TOPUP') {
          // MODIFIED LOGIC: Top Up now adds to cart as a transaction
          const table = state.tables.find(t => t.id === activeTableId);
          if (table) {
              const hours = duration / 60;
              dispatch({ 
                  type: 'ADD_TABLE_TO_CART', 
                  payload: { 
                      table: table, 
                      quantity: hours 
                  } 
              });
              // Open cart to show the addition
              setMobileCartVisible(true);
          }
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

  const handleCheckoutInitiate = async () => {
    if (!isShiftActive) {
        setIsShiftModalOpen(true);
        return;
    }
    if (state.cart.length === 0) {
        setPaymentStatusModal({ type: 'error', title: 'Keranjang Kosong', message: 'Mohon tambahkan item ke keranjang belanja.' });
        return;
    }
    
    // Check if customer name is needed (if billiard item exists)
    const hasBilliard = state.cart.some(i => i.itemType === 'BILLIARD');
    if (hasBilliard && !customerName.trim()) {
       setPaymentStatusModal({ type: 'error', title: 'Nama Pelanggan Wajib', message: 'Nama Pelanggan wajib diisi untuk sewa meja.' });
       return;
    }

    setShowPaymentConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentConfirmModal(false); // Close confirmation modal
    
    // Safety check for active shift
    if (!state.activeShift) {
        setPaymentStatusModal({ type: 'error', title: 'Shift Tidak Aktif', message: 'Tidak bisa checkout karena tidak ada shift yang aktif.' });
        return;
    }
    
    // Create a temporary transaction object for printing, as the state update is async.
    const transactionToPrint: Transaction = {
        id: `TX-${Date.now()}`,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        total: cartTotal,
        type: 'MIXED',
        details: state.cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
        // CRITICAL: Use cashier name from the active shift
        cashierName: state.activeShift.cashierName,
        customerName: customerName || 'Pelanggan Umum'
    };
    
    const receiptData: ReceiptData = {
        transaction: transactionToPrint,
        cart: [...state.cart],
        storeName: state.settings.storeName || 'ZYRA KASIR',
        storeAddress: state.settings.storeAddress,
        storePhone: state.settings.storePhone,
        customReceiptFooter: state.settings.customReceiptFooter,
        // CRITICAL: Use cashier name from the active shift for the receipt
        cashierName: state.activeShift.cashierName,
    };

    // Dispatch checkout action to update state
    dispatch({ 
      type: 'CHECKOUT', 
      payload: { 
        total: cartTotal, 
        // Note: The reducer will ignore this and use the shift's cashier name, but we pass it for consistency.
        cashierName: state.activeShift.cashierName,
        customerName: customerName
      } 
    });
    setCustomerName('');

    // After state is dispatched, try to print.
    try {
        await printReceipt(receiptData);
        setPaymentStatusModal({ type: 'success', title: 'Transaksi Berhasil!', message: 'Struk telah dicetak.' });
    } catch (error) {
        console.error("Gagal mencetak struk:", error);
        setPaymentStatusModal({ type: 'error', title: 'Gagal Cetak', message: `Transaksi berhasil, tapi struk gagal dicetak: ${(error as Error).message}` });
    }
  };

  // Filter Logic (Memoized to prevent recalc on every render)
  const filteredProducts = useMemo(() => state.products.filter(p => 
      (activeTab === 'ALL' || p.category === activeTab) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      p.category !== ProductCategory.RAW_MATERIAL
  ), [state.products, activeTab, searchTerm]);

  const filteredTables = useMemo(() => state.tables.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [state.tables, searchTerm]);

  const CartPanel = () => (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-xl w-full">
         {/* Drawer Header */}
         <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <div className="flex items-center gap-2 text-emerald-400">
                <ShoppingCart size={24} />
                <h2 className="font-bold text-lg">Keranjang ({cartCount})</h2>
            </div>
            {/* Show close button only on mobile when it acts as a modal/drawer */}
            <div className="md:hidden">
                <button 
                    onClick={() => setMobileCartVisible(false)}
                    className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>

        {/* Operator Info */}
        <div className="px-4 pt-4">
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold border border-slate-600 shadow-sm">
                        <User size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                           {isShiftActive ? 'PENANGGUNG JAWAB SHIFT' : 'Operator Login'}
                        </div>
                        <div className="text-white font-bold text-sm">
                           {isShiftActive ? state.activeShift.cashierName : state.user?.name}
                        </div>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isShiftActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} title={isShiftActive ? 'Shift Aktif' : 'Shift Tutup'} />
            </div>
            
            <div className="mt-4">
                <input 
                    type="text" 
                    placeholder="Nama Pelanggan (Wajib untuk Meja)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                />
            </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Coffee size={48} className="opacity-20" />
                    <p className="text-sm">Keranjang kosong</p>
                </div>
            ) : (
                state.cart.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center group border border-transparent hover:border-slate-700 transition-all animate-fade-in">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="text-white font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-slate-500">
                                {item.quantity} {item.itemType === 'BILLIARD' ? 'Jam' : 'x'} @ Rp {item.price.toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-emerald-400 font-bold text-sm">
                                Rp {(item.price * item.quantity).toLocaleString()}
                            </div>
                            <button 
                                onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.itemId })}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 text-slate-500 flex items-center justify-center transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 pb-safe">
            <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-medium">Total Tagihan</span>
                <span className="text-2xl font-bold text-emerald-400">Rp {cartTotal.toLocaleString()}</span>
            </div>
            
            <button 
                onClick={handleCheckoutInitiate} 
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
  );

  return (
    <div className="flex h-full overflow-hidden relative">
      
      {/* --- Main Content (Left Column) --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        
        {/* Header & Tabs */}
        <div className="p-3 md:p-6 shrink-0 bg-slate-950 z-20 space-y-3 md:space-y-4">
            
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                 {/* Tabs (Left) Combined with Cashier Status */}
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full items-center touch-pan-x">
                    <button 
                        onClick={() => setActiveTab('BILLIARD')}
                        className={`shrink-0 px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap shadow-sm ${
                            activeTab === 'BILLIARD' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        Billiard
                    </button>
                    {Object.values(ProductCategory).filter(c => c !== ProductCategory.RAW_MATERIAL).map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`shrink-0 px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap shadow-sm ${
                                activeTab === cat ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}

                    <div className="w-px h-6 bg-slate-800 mx-2 shrink-0"></div>

                     {/* KASIR STATUS BUTTON */}
                     {isShiftActive ? (
                         <button 
                            onClick={() => setIsCloseShiftModalOpen(true)}
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-sm whitespace-nowrap"
                         >
                            <Unlock size={18} className="text-emerald-200" /> 
                            <span>KASIR BUKA</span>
                         </button>
                     ) : (
                         <button 
                            onClick={() => setIsShiftModalOpen(true)}
                            className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse transition-all text-sm whitespace-nowrap"
                         >
                            <Lock size={18} className="text-rose-200" /> 
                            <span>KASIR TUTUP</span>
                         </button>
                     )}
                 </div>
                 
                 {/* NEW: PROMINENT SHIFT INFO DISPLAY */}
                 {isShiftActive && (
                    <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-2 px-4 flex items-center justify-center gap-3 text-sm shrink-0 w-full xl:w-auto">
                        <User size={18} className="text-emerald-400" />
                        <div>
                            <div className="text-emerald-500 text-[10px] font-bold">SHIFT AKTIF OLEH</div>
                            <div className="font-bold text-white -mt-1">{state.activeShift.cashierName}</div>
                        </div>
                    </div>
                 )}
            </div>

            {/* Search Bar & Mobile Cart Toggle */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                        type="text" 
                        placeholder="Cari meja atau menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner text-sm"
                    />
                </div>
                {/* Mobile-only Cart Button */}
                <button 
                    className="md:hidden bg-slate-800 p-3 rounded-2xl text-emerald-400 relative"
                    onClick={() => setMobileCartVisible(true)}
                >
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pt-0 pb-20 scrollbar-hide touch-pan-y">
            {activeTab === 'BILLIARD' ? (
                // Responsive Grid: 1 col (mobile), 2 (tablet), 3 (small desktop), 4 (large desktop)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 pb-24">
                    {filteredTables.map(table => (
                        <TableCard 
                            key={table.id} 
                            table={table} 
                            onSelect={(t) => dispatch({ type: 'ADD_TABLE_TO_CART', payload: { table: t } })}
                            onTopUp={() => handleTableAction(table, 'TOPUP')}
                            onStop={(t) => dispatch({ type: 'STOP_TABLE', payload: { tableId: t.id } })}
                            onMove={() => handleTableAction(table, 'MOVE')}
                        />
                    ))}
                </div>
            ) : (
                // Responsive Grid: 2 cols (mobile), 3 (tablet), 4 (small desktop), 5/6 (large desktop)
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-24">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onClick={handleAddToCart} />
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- Right Column: Cart (Desktop: Split View, Mobile: Overlay) --- */}
      
      {/* Desktop Permanent Sidebar */}
      <div className="hidden md:flex w-80 lg:w-96 xl:w-[400px] shrink-0">
          <CartPanel />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileCartVisible && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileCartVisible(false)} />
            <div className="relative w-full max-w-sm h-full animate-slide-in-right">
                <CartPanel />
            </div>
        </div>
      )}


      {/* --- MODALS --- */}

      {/* 1. Modal Table Action (Topup/Move) */}
      {showTableModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                      {showTableModal === 'TOPUP' ? 'Tambah Waktu' : 'Pindah Meja'}
                  </h3>
                  
                  {showTableModal !== 'MOVE' && (
                       <div className="mb-6">
                          <label className="block text-sm text-slate-400 mb-1">Durasi (Menit)</label>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                              {[60, 120, 180].map(m => (
                                  <button key={m} onClick={() => setDuration(m)} className={`py-3 rounded-lg text-sm font-bold ${duration === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
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
                          <p className="text-xs text-amber-500 mt-2">
                             *Waktu akan ditambahkan ke tagihan (Cart) dan baru aktif setelah checkout.
                          </p>
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
              <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Buka Kasir</h2>
                    <p className="text-slate-400 text-sm mb-6">Pilih operator dan masukkan modal awal.</p>
                  </div>
                  
                  <form onSubmit={handleOpenShift} className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2 text-center">Pilih Operator Shift</label>
                        <select
                           value={selectedShiftOperatorId}
                           onChange={(e) => setSelectedShiftOperatorId(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-600 rounded-xl py-3 px-4 text-white font-bold text-center appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            {state.users.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-slate-400 mb-2 text-center">Modal Awal</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                            <input 
                                type="number" 
                                required
                                value={startCashInput}
                                onChange={(e) => setStartCashInput(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/30 transition-all">
                            Buka Shift Sekarang
                        </button>
                      </div>
                  </form>
                  <button onClick={() => setIsShiftModalOpen(false)} className="mt-4 text-slate-500 text-sm hover:text-white w-full">Batal</button>
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

      {/* 4. Custom Payment Confirmation Modal */}
      {showPaymentConfirmModal && (
          <PaymentConfirmationModal
              total={cartTotal}
              customerName={customerName}
              onConfirm={handleConfirmPayment}
              onCancel={() => {
                  setShowPaymentConfirmModal(false);
                  console.log('Konfirmasi pembayaran dibatalkan oleh pengguna (melalui modal kustom).');
              }}
          />
      )}

      {/* 5. Custom Payment Status Modal (Success/Error) */}
      {paymentStatusModal && (
          <StatusMessageModal
              type={paymentStatusModal.type}
              title={paymentStatusModal.title}
              message={paymentStatusModal.message}
              onClose={() => setPaymentStatusModal(null)}
          />
      )}

    </div>
  );
};