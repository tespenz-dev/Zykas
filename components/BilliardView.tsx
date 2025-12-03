import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BilliardTable, TableStatus } from '../types';
import { Play, Square, Clock, ArrowRightLeft, PlusCircle } from 'lucide-react';
import { BILLIARD_HOURLY_RATE } from '../constants';

const TableCard: React.FC<{ 
  table: BilliardTable; 
  onSelect: (table: BilliardTable) => void;
}> = ({ table, onSelect }) => {
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

  // Calculate remaining time if fixed duration
  const remainingSeconds = (table.durationMinutes * 60) - elapsed;
  const isOvertime = remainingSeconds < 0;

  return (
    <div 
      onClick={() => onSelect(table)}
      className={`relative p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg ${
        table.status === TableStatus.AVAILABLE 
          ? 'border-emerald-500/50 bg-slate-800 hover:bg-slate-700' 
          : 'border-rose-500/50 bg-slate-800 hover:bg-slate-750'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-white">{table.name}</h3>
        <span className={`px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${
          table.status === TableStatus.AVAILABLE ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {table.status === TableStatus.AVAILABLE ? 'Available' : 'In Use'}
        </span>
      </div>

      <div className="space-y-2">
        {table.status === TableStatus.OCCUPIED ? (
          <>
            <div className="text-slate-400 text-sm flex items-center gap-2">
              <Clock size={16} />
              <span>{formatTime(elapsed)}</span>
            </div>
             <div className="text-slate-400 text-sm truncate">
              Cust: <span className="text-white font-medium">{table.customerName}</span>
            </div>
            {table.durationMinutes > 0 && (
              <div className={`text-sm font-medium ${isOvertime ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`}>
                Sisa: {formatTime(Math.max(0, remainingSeconds))} {isOvertime && '(OT)'}
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-500 text-sm italic">Tap untuk sewa</div>
        )}
      </div>

      {/* Visual Cue Ball */}
      <div className={`absolute bottom-4 right-4 w-10 h-10 md:w-12 md:h-12 rounded-full shadow-inner flex items-center justify-center ${
        table.status === TableStatus.OCCUPIED ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
      }`}>
        <span className="text-white font-bold text-base md:text-lg">{table.id}</span>
      </div>
    </div>
  );
};

export const BilliardView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedTable, setSelectedTable] = useState<BilliardTable | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [moveToId, setMoveToId] = useState<string>('');

  const calculateCost = (table: BilliardTable) => {
    if (!table.startTime) return 0;
    const now = Date.now();
    const durationHours = (now - table.startTime) / (1000 * 60 * 60);
    return Math.ceil(durationHours * BILLIARD_HOURLY_RATE);
  };

  const handleStart = () => {
    if (selectedTable && customerName) {
      dispatch({ 
        type: 'START_TABLE', 
        payload: { tableId: selectedTable.id, duration, customer: customerName } 
      });
      setSelectedTable(null);
      setCustomerName('');
      setDuration(60);
    }
  };

  const handleStop = () => {
    if (selectedTable) {
      const cost = calculateCost(selectedTable);
      if(confirm(`Stop timer untuk ${selectedTable.name}? Total Biaya: Rp ${cost.toLocaleString()}`)) {
        dispatch({ type: 'STOP_TABLE', payload: { tableId: selectedTable.id } });
        setSelectedTable(null);
      }
    }
  };

  const handleTopUp = () => {
    if (selectedTable) {
      dispatch({ type: 'TOPUP_TABLE', payload: { tableId: selectedTable.id, duration: 60 } });
      alert('Berhasil tambah 1 jam.');
      setSelectedTable(null);
    }
  };

  const handleMove = () => {
    if (selectedTable && moveToId) {
      dispatch({ type: 'MOVE_TABLE', payload: { fromId: selectedTable.id, toId: parseInt(moveToId) } });
      setSelectedTable(null);
      setMoveToId('');
    }
  };

  return (
    <div className="h-full p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white flex items-center gap-3">
        <span className="bg-emerald-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
        Area Billiard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {state.tables.map(table => (
          <TableCard key={table.id} table={table} onSelect={setSelectedTable} />
        ))}
      </div>

      {/* Modal for Table Actions */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
          <div className="bg-slate-900 border-t md:border border-slate-700 w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in">
            <div className="p-4 md:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl md:text-2xl font-bold text-white">{selectedTable.name}</h3>
              <button 
                onClick={() => setSelectedTable(null)} 
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                Tutup
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {selectedTable.status === TableStatus.AVAILABLE ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nama Pelanggan</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Masukkan nama..."
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Durasi Awal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(h => (
                        <button 
                          key={h}
                          onClick={() => setDuration(h * 60)}
                          className={`py-3 rounded-lg border font-medium ${duration === h * 60 ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 text-slate-400 hover:bg-slate-800'}`}
                        >
                          {h} Jam
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={handleStart}
                    disabled={!customerName}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    <Play size={20} fill="currentColor" /> Mulai Sewa
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700">
                      <div className="text-slate-400 text-xs uppercase mb-1">Pelanggan</div>
                      <div className="text-white font-bold truncate">{selectedTable.customerName}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700">
                      <div className="text-slate-400 text-xs uppercase mb-1">Estimasi Biaya</div>
                      <div className="text-emerald-400 font-bold">Rp {calculateCost(selectedTable).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleTopUp}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
                    >
                      <PlusCircle size={18} /> Tambah 1 Jam
                    </button>
                    
                    <div className="flex gap-2">
                      <select 
                        className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 flex-1 outline-none h-12"
                        value={moveToId}
                        onChange={(e) => setMoveToId(e.target.value)}
                      >
                        <option value="">Pindah ke...</option>
                        {state.tables.filter(t => t.status === TableStatus.AVAILABLE).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleMove}
                        disabled={!moveToId}
                        className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/50 px-4 rounded-lg disabled:opacity-50 h-12 flex items-center justify-center"
                      >
                        <ArrowRightLeft size={18} />
                      </button>
                    </div>

                    <button 
                      onClick={handleStop}
                      className="bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-4 transition-all shadow-lg shadow-rose-900/20"
                    >
                      <Square size={20} fill="currentColor" /> Selesai & Bayar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};