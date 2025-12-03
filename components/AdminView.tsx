

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, DollarSign, Plus, Trash2, Database, AlertTriangle, Download, ClipboardList, Search, Scale } from 'lucide-react';
import { Role, ProductCategory } from '../types';

export const AdminView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INVENTORY' | 'AUDIT' | 'USERS' | 'SYSTEM'>('DASHBOARD');
  
  // Audit State
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, string>>({});

  // Chart Data Preparation
  const transactions = state.transactions;
  const today = new Date().toDateString();
  const dailyTotal = transactions
    .filter(t => new Date(t.timestamp).toDateString() === today)
    .reduce((acc, t) => acc + t.total, 0);
  
  const chartData = transactions.slice(0, 10).reverse().map(t => ({
    time: t.date.split('T')[1].substring(0, 5),
    amount: t.total
  }));

  const handleReset = () => {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA data (transaksi, stok, user) dan kembali ke pengaturan awal. Anda yakin?')) {
        if (confirm('Yakin 100%? Tindakan ini tidak dapat dibatalkan.')) {
            dispatch({ type: 'RESET_APP' });
            window.location.reload();
        }
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "backup_pos.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePhysicalStockChange = (id: string, value: string) => {
      setPhysicalStocks(prev => ({ ...prev, [id]: value }));
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400"><DollarSign size={24} /></div>
            <span className="text-slate-400 font-medium text-sm md:text-base">Pendapatan Hari Ini</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">Rp {dailyTotal.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><TrendingUp size={24} /></div>
            <span className="text-slate-400 font-medium text-sm md:text-base">Total Transaksi</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">{transactions.length}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Package size={24} /></div>
            <span className="text-slate-400 font-medium text-sm md:text-base">Total Produk</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">{state.products.length} Menu</div>
        </div>
      </div>

      <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 h-80 md:h-96">
        <h3 className="text-lg md:text-xl font-bold text-white mb-6">Grafik Transaksi Terakhir</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#34d399' }}
            />
            <Bar dataKey="amount" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden pb-20 md:pb-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
            <tr>
                <th className="p-4">Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4 text-center">Stok</th>
                <th className="p-4 text-center">Aksi</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
            {state.products.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="p-4 font-medium text-white">{p.name}</td>
                <td className="p-4 text-slate-400 text-sm">{p.category}</td>
                <td className="p-4 text-right font-mono text-emerald-400">Rp {p.price.toLocaleString()}</td>
                <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-white'}`}>
                    {p.stock} {p.unit}
                    </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                    <button 
                    onClick={() => dispatch({ type: 'UPDATE_STOCK', payload: { productId: p.id, quantity: 10 } })}
                    className="p-2 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors"
                    title="Tambah Stok (+10)"
                    >
                    <Plus size={18} />
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudit = () => {
    const rawMaterials = state.products.filter(p => p.category === ProductCategory.RAW_MATERIAL);
    
    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <ClipboardList className="text-amber-500" /> Audit Bahan Baku & Kecurangan
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                    Bandingkan stok fisik dengan stok sistem untuk mendeteksi kehilangan atau takaran yang tidak sesuai.
                    <br/><span className="text-slate-500 italic">*Input sisa stok fisik (hasil timbangan/hitungan) pada kolom "Stok Fisik".</span>
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Nama Bahan</th>
                                <th className="p-4 text-center">Estimasi Porsi</th>
                                <th className="p-4 text-center">Stok Sistem</th>
                                <th className="p-4 text-center w-32">Stok Fisik</th>
                                <th className="p-4 text-center">Selisih</th>
                                <th className="p-4 text-right">Estimasi Rugi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {rawMaterials.map(mat => {
                                const systemStock = mat.stock;
                                const physicalStockStr = physicalStocks[mat.id];
                                const physicalStock = physicalStockStr !== undefined && physicalStockStr !== '' ? parseFloat(physicalStockStr) : systemStock;
                                const diff = physicalStock - systemStock;
                                
                                // Determine loss value
                                // Find products linked to this material to guess "Revenue Loss"
                                const linkedProducts = state.products.filter(p => p.stockLinkedToId === mat.id);
                                const maxPrice = linkedProducts.length > 0 ? Math.max(...linkedProducts.map(p => p.price)) : 0;
                                const revenuePerUnit = maxPrice * (mat.yield || 0); // e.g. 5000 * 45 = 225,000 per Unit (KG)
                                const lossValue = Math.abs(diff * revenuePerUnit);
                                
                                const isDiscrepancy = Math.abs(diff) > 0.001;
                                const isLoss = diff < -0.001;

                                return (
                                    <tr key={mat.id} className="hover:bg-slate-700/30">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{mat.name}</div>
                                            <div className="text-xs text-slate-500">{mat.unit}</div>
                                        </td>
                                        <td className="p-4 text-center text-slate-300 font-mono text-sm">
                                            {mat.yield || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono text-blue-300 font-bold bg-blue-900/30 px-2 py-1 rounded">
                                                {systemStock.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                className={`w-full bg-slate-900 border text-center rounded-lg py-2 px-1 font-bold outline-none focus:ring-2 ${isDiscrepancy ? 'border-amber-500 focus:ring-amber-500' : 'border-slate-600 focus:ring-emerald-500'}`}
                                                value={physicalStocks[mat.id] || ''}
                                                placeholder={systemStock.toFixed(2)}
                                                onChange={(e) => handlePhysicalStockChange(mat.id, e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            {isDiscrepancy ? (
                                                <span className={`font-bold ${isLoss ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {diff > 0 ? '+' : ''}{diff.toFixed(2)} {mat.unit}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {isLoss ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                                                        <AlertTriangle size={12} />
                                                        Rp {lossValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                        ~ {Math.abs(diff * (mat.yield || 0)).toFixed(1)} Porsi
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6 pb-20 md:pb-0">
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Manajemen Pengguna</h3>
        <div className="space-y-3">
            {state.users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === Role.ADMIN ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {u.username[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-medium">{u.name}</div>
                            <div className="text-xs text-slate-500 uppercase">{u.role}</div>
                        </div>
                    </div>
                    {u.role !== Role.ADMIN && (
                        <button 
                            onClick={() => dispatch({ type: 'REMOVE_USER', payload: u.id })}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            ))}
        </div>
       </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6 pb-20 md:pb-0">
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Database size={24}/> Database System</h3>
          <p className="text-slate-400 mb-6">Kelola penyimpanan data lokal aplikasi.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
              <button 
                  onClick={handleExport}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                  <Download size={20} /> Backup Data (JSON)
              </button>
              
              <button 
                  onClick={handleReset}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                  <AlertTriangle size={20} /> Factory Reset
              </button>
          </div>
          <div className="mt-4 p-4 bg-rose-900/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
             <strong>Perhatian:</strong> Factory Reset akan menghapus semua riwayat transaksi, perubahan stok, dan pengaturan pengguna. Gunakan hanya jika aplikasi mengalami error.
          </div>
       </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <span className="bg-purple-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
            Panel Admin
        </h2>
        <div className="flex bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['DASHBOARD', 'INVENTORY', 'AUDIT', 'USERS', 'SYSTEM'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'AUDIT' ? 'AUDIT BAHAN' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'DASHBOARD' && renderDashboard()}
      {activeTab === 'INVENTORY' && renderInventory()}
      {activeTab === 'AUDIT' && renderAudit()}
      {activeTab === 'USERS' && renderUsers()}
      {activeTab === 'SYSTEM' && renderSystem()}
    </div>
  );
};