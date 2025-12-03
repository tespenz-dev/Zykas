import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, DollarSign, Calendar, Search, X, Receipt, User, Monitor } from 'lucide-react';
import { Transaction } from '../types';

export const HistoryView: React.FC = () => {
  const { state } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Logic for "Start of Shift" (7 AM)
  const now = new Date();
  const startOfShift = new Date(now);
  startOfShift.setHours(7, 0, 0, 0); // Set to 7:00 AM Today

  // If currently before 7 AM (e.g. 2 AM), the shift started Yesterday 7 AM
  if (now.getHours() < 7) {
    startOfShift.setDate(startOfShift.getDate() - 1);
  }

  // Filter transactions
  const filteredTransactions = state.transactions.filter(t => 
    t.timestamp >= startOfShift.getTime()
  );

  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.total, 0);

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateFull = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-cyan-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
                Riwayat Transaksi
            </h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                <Clock size={14} /> 
                Shift: {startOfShift.toLocaleDateString('id-ID')} 07:00 - Sekarang
            </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 w-full md:w-auto">
             <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                <DollarSign size={24} />
             </div>
             <div>
                <div className="text-slate-400 text-xs uppercase font-bold">Total Shift Ini</div>
                <div className="text-xl font-bold text-white">Rp {totalRevenue.toLocaleString()}</div>
             </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-700 bg-slate-850 flex justify-between items-center">
            <h3 className="font-bold text-white">Daftar Transaksi ({filteredTransactions.length})</h3>
            <div className="text-xs text-slate-500">Reset setiap 07:00 WIB</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
            {filteredTransactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p>Belum ada transaksi pada shift ini.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="p-4 w-24">Waktu</th>
                            <th className="p-4">ID Transaksi</th>
                            <th className="p-4">Detail Item</th>
                            <th className="p-4 hidden md:table-cell">Pelanggan</th>
                            <th className="p-4 hidden md:table-cell">Kasir</th>
                            <th className="p-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredTransactions.map(t => (
                            <tr 
                                key={t.id} 
                                onClick={() => setSelectedTransaction(t)}
                                className="hover:bg-slate-700/50 transition-colors cursor-pointer group active:bg-slate-700"
                            >
                                <td className="p-4 font-mono text-slate-300 text-sm group-hover:text-white transition-colors">{formatTime(t.date)}</td>
                                <td className="p-4 text-xs font-mono text-slate-500 group-hover:text-slate-400">{t.id.slice(-8).toUpperCase()}</td>
                                <td className="p-4">
                                    <div className="text-white text-sm font-medium line-clamp-1 group-hover:text-cyan-400 transition-colors">{t.details}</div>
                                </td>
                                <td className="p-4 hidden md:table-cell text-slate-300 text-sm">{t.customerName || '-'}</td>
                                <td className="p-4 hidden md:table-cell text-slate-400 text-xs">{t.cashierName}</td>
                                <td className="p-4 text-right font-bold text-emerald-400 group-hover:text-emerald-300">Rp {t.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTransaction && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Receipt className="text-cyan-500" size={20} />
                          Detail Transaksi
                      </h3>
                      <button 
                        onClick={() => setSelectedTransaction(null)} 
                        className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6">
                      
                      <div className="text-center pb-4 border-b border-slate-800 border-dashed">
                          <div className="text-3xl font-bold text-emerald-400 mb-1">Rp {selectedTransaction.total.toLocaleString()}</div>
                          <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">Total Bayar</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                  <User size={12} /> Pelanggan
                              </div>
                              <div className="text-white font-medium truncate">{selectedTransaction.customerName || 'Umum'}</div>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                  <Monitor size={12} /> Kasir
                              </div>
                              <div className="text-white font-medium truncate">{selectedTransaction.cashierName}</div>
                          </div>
                      </div>

                      <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Item Pesanan</div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm text-slate-300 leading-relaxed">
                              {selectedTransaction.details}
                          </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-500 font-mono pt-4 border-t border-slate-800">
                          <div className="flex justify-between">
                              <span>ID Transaksi</span>
                              <span className="text-slate-400">{selectedTransaction.id}</span>
                          </div>
                          <div className="flex justify-between">
                              <span>Waktu</span>
                              <span className="text-slate-400">{formatDateFull(selectedTransaction.date)}</span>
                          </div>
                      </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-800 border-t border-slate-700">
                      <button 
                          onClick={() => setSelectedTransaction(null)}
                          className="w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
                      >
                          Tutup
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};