

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, DollarSign, Plus, Trash2, Database, AlertTriangle, Download, ClipboardList, Scale, Upload, Cloud, RefreshCw, CheckCircle, Link, User, Shield, Edit, Save, X, RefreshCcw } from 'lucide-react';
import { Role, ProductCategory, AppState, User as UserType } from '../types';

export const AdminView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INVENTORY' | 'AUDIT' | 'USERS' | 'SYSTEM'>('DASHBOARD');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audit State
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, string>>({});

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<UserType>>({
      name: '',
      username: '',
      role: Role.CASHIER,
      pin: ''
  });

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [scriptUrl, setScriptUrl] = useState(state.settings?.googleScriptUrl || '');

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
    downloadAnchorNode.setAttribute("download", `backup_pos_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const parsedData = JSON.parse(content);
          
          // Basic validation to check if it's a valid backup file
          if (parsedData.users && parsedData.products && parsedData.tables) {
            if (confirm('Apakah Anda yakin ingin me-restore data ini? Data saat ini akan tertimpa.')) {
                // Save to localStorage directly
                localStorage.setItem('CUE_BREW_POS_DATA_V3', content);
                alert('Data berhasil dipulihkan! Halaman akan dimuat ulang.');
                window.location.reload();
            }
          } else {
            alert('Format file tidak valid. Pastikan file adalah hasil backup dari aplikasi ini.');
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Gagal membaca file. Pastikan file JSON valid.');
        }
      }
    };
    reader.readAsText(fileObj);
    
    // Reset input
    event.target.value = '';
  };

  const handleSaveScriptUrl = () => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { googleScriptUrl: scriptUrl } });
      alert('URL berhasil disimpan.');
  };

  const handleCloudUpload = async () => {
      if (!state.settings?.googleScriptUrl) {
          alert('Mohon isi URL Google Script terlebih dahulu.');
          return;
      }
      setIsSyncing(true);
      try {
          const response = await fetch(state.settings.googleScriptUrl, {
              method: 'POST',
              mode: 'no-cors', // Google Scripts often require no-cors for simple posts without complex headers
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(state)
          });
          // Since no-cors is opaque, we assume success if no network error
          alert('Data berhasil dikirim ke Google Cloud (Drive/Sheets).');
      } catch (error) {
          console.error(error);
          alert('Gagal upload: ' + error);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleCloudDownload = async () => {
      if (!state.settings?.googleScriptUrl) {
          alert('Mohon isi URL Google Script terlebih dahulu.');
          return;
      }
      setIsSyncing(true);
      try {
          const response = await fetch(state.settings.googleScriptUrl);
          const data = await response.json();
          
          if (data && data.products && data.tables) {
               if(confirm(`Data ditemukan dari Cloud (Tanggal: ${new Date(data.transactions[0]?.timestamp || Date.now()).toLocaleDateString()}). Timpa data lokal?`)) {
                   dispatch({ type: 'IMPORT_DATA', payload: data as AppState });
                   alert('Sinkronisasi Berhasil!');
               }
          } else {
              alert('Format data dari cloud tidak valid.');
          }
      } catch (error) {
          console.error(error);
          alert('Gagal download. Pastikan script URL benar dan sudah di-deploy sebagai "Anyone".');
      } finally {
          setIsSyncing(false);
      }
  };

  const handlePhysicalStockChange = (id: string, value: string) => {
      setPhysicalStocks(prev => ({ ...prev, [id]: value }));
  };

  const handleAdjustStock = (productId: string, physicalQty: number, systemQty: number, productName: string) => {
      if (confirm(`SESUAIKAN STOK: \n\nAnda akan mengubah stok "${productName}" dari ${systemQty} menjadi ${physicalQty}.\n\nApakah Anda yakin perhitungan fisik sudah benar?`)) {
          dispatch({ 
              type: 'SET_PRODUCT_STOCK', 
              payload: { productId, stock: physicalQty } 
          });
          // Clear the input for this item after sync
          const newStocks = {...physicalStocks};
          delete newStocks[productId];
          setPhysicalStocks(newStocks);
      }
  };

  // User Management Handlers
  const handleOpenAddUser = () => {
      setEditingUser(null);
      setUserFormData({
          name: '',
          username: '',
          role: Role.CASHIER,
          pin: ''
      });
      setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserType) => {
      setEditingUser(user);
      setUserFormData({
          name: user.name,
          username: user.username,
          role: user.role,
          pin: user.pin
      });
      setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: string, name: string) => {
      if (confirm(`Hapus operator "${name}"?`)) {
          dispatch({ type: 'REMOVE_USER', payload: id });
      }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userFormData.name || !userFormData.username || !userFormData.pin) {
          alert("Mohon lengkapi semua data.");
          return;
      }

      if (editingUser) {
          dispatch({
              type: 'EDIT_USER',
              payload: { ...editingUser, ...userFormData } as UserType
          });
      } else {
          dispatch({
              type: 'ADD_USER',
              payload: {
                  id: `user-${Date.now()}`,
                  name: userFormData.name || '',
                  username: userFormData.username || '',
                  role: userFormData.role || Role.CASHIER,
                  pin: userFormData.pin || ''
              }
          });
      }
      setIsUserModalOpen(false);
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
    
    // Calculate estimated total loss based on current physical inputs
    let totalEstimatedLoss = 0;
    rawMaterials.forEach(mat => {
        const physicalStr = physicalStocks[mat.id];
        if (physicalStr) {
            const physical = parseFloat(physicalStr);
            const diff = physical - mat.stock;
            if (diff < 0) {
                 const linkedProducts = state.products.filter(p => p.stockLinkedToId === mat.id);
                 const maxPrice = linkedProducts.length > 0 ? Math.max(...linkedProducts.map(p => p.price)) : 0;
                 const revenuePerUnit = maxPrice * (mat.yield || 0);
                 totalEstimatedLoss += Math.abs(diff * revenuePerUnit);
            }
        }
    });

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {totalEstimatedLoss > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                         <AlertTriangle className="text-rose-500" />
                         <div>
                             <div className="font-bold text-rose-500">Terdeteksi Potensi Kerugian</div>
                             <div className="text-xs text-rose-300">Berdasarkan selisih stok fisik yang diinput</div>
                         </div>
                    </div>
                    <div className="text-xl font-bold text-rose-500">
                        Rp {totalEstimatedLoss.toLocaleString()}
                    </div>
                </div>
            )}

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <ClipboardList className="text-amber-500" /> Audit Bahan Baku & Kecurangan
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                    Bandingkan stok fisik dengan stok sistem. Masukkan jumlah real di kolom <strong>"Stok Fisik"</strong>, lalu klik tombol <strong>"Sesuaikan"</strong> jika ada perbedaan.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Nama Bahan</th>
                                <th className="p-4 text-center">Stok Sistem</th>
                                <th className="p-4 text-center w-32">Stok Fisik (Input)</th>
                                <th className="p-4 text-center">Selisih</th>
                                <th className="p-4 text-right">Estimasi Rugi</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {rawMaterials.map(mat => {
                                const systemStock = mat.stock;
                                const physicalStockStr = physicalStocks[mat.id];
                                const hasInput = physicalStockStr !== undefined && physicalStockStr !== '';
                                const physicalStock = hasInput ? parseFloat(physicalStockStr) : systemStock;
                                const diff = physicalStock - systemStock;
                                
                                // Determine loss value
                                const linkedProducts = state.products.filter(p => p.stockLinkedToId === mat.id);
                                const maxPrice = linkedProducts.length > 0 ? Math.max(...linkedProducts.map(p => p.price)) : 0;
                                const revenuePerUnit = maxPrice * (mat.yield || 0); 
                                const lossValue = Math.abs(diff * revenuePerUnit);
                                
                                const isDiscrepancy = Math.abs(diff) > 0.001;
                                const isLoss = diff < -0.001;

                                return (
                                    <tr key={mat.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{mat.name}</div>
                                            <div className="text-xs text-slate-500">{mat.unit} | Yield: {mat.yield || '-'}</div>
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
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {isDiscrepancy && hasInput && (
                                                <button 
                                                    onClick={() => handleAdjustStock(mat.id, physicalStock, systemStock, mat.name)}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 mx-auto shadow-lg shadow-emerald-900/20"
                                                >
                                                    <RefreshCcw size={14} /> Sesuaikan
                                                </button>
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
       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white">Manajemen Operator</h3>
            <p className="text-slate-400 text-sm">Kelola akun admin dan kasir yang bertugas.</p>
          </div>
          <button 
             onClick={handleOpenAddUser}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
          >
             <Plus size={18} /> Tambah Operator
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${u.role === Role.ADMIN ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {u.username[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg">{u.name}</div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-600 text-slate-400'}`}>
                                    {u.role}
                                </span>
                                <span className="text-slate-500 text-xs">@{u.username}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleOpenEditUser(u)}
                            className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit size={18} />
                        </button>
                        {u.role !== Role.ADMIN && (
                            <button 
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                                title="Hapus"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
       </div>

       {/* User Modal */}
       {isUserModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
               <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                   <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           {editingUser ? <Edit size={20} className="text-blue-500"/> : <Plus size={20} className="text-emerald-500"/>}
                           {editingUser ? 'Edit Operator' : 'Tambah Operator Baru'}
                       </h3>
                       <button onClick={() => setIsUserModalOpen(false)} className="text-slate-500 hover:text-white">
                           <X size={24} />
                       </button>
                   </div>
                   
                   <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-400 mb-1">Nama Lengkap</label>
                           <input 
                               type="text" 
                               required
                               value={userFormData.name}
                               onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                               className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                               placeholder="Contoh: Budi Santoso"
                           />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-slate-400 mb-1">Username (Inisial)</label>
                               <input 
                                   type="text" 
                                   required
                                   value={userFormData.username}
                                   onChange={e => setUserFormData({...userFormData, username: e.target.value.toLowerCase()})}
                                   className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                   placeholder="budi"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                               <select 
                                   value={userFormData.role}
                                   onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}
                                   className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                               >
                                   <option value={Role.CASHIER}>Kasir</option>
                                   <option value={Role.ADMIN}>Admin</option>
                               </select>
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-slate-400 mb-1">PIN Akses (6 Angka)</label>
                           <input 
                               type="text" 
                               required
                               pattern="[0-9]*"
                               maxLength={6}
                               minLength={6}
                               value={userFormData.pin}
                               onChange={e => setUserFormData({...userFormData, pin: e.target.value.replace(/[^0-9]/g, '')})}
                               className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono tracking-widest text-center text-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                               placeholder="123456"
                           />
                       </div>

                       <div className="flex gap-3 pt-4 border-t border-slate-700">
                           <button 
                               type="button"
                               onClick={() => setIsUserModalOpen(false)}
                               className="flex-1 py-3.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 font-bold transition-colors"
                           >
                               Batal
                           </button>
                           <button 
                               type="submit"
                               className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2"
                           >
                               <Save size={18} /> Simpan
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6 pb-20 md:pb-0">
       
       {/* Cloud Sync Section */}
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Cloud size={120} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
             <Cloud className="text-blue-500" /> Cloud Sync (Google Drive/Sheets)
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-2xl">
              Hubungkan aplikasi dengan Google Apps Script untuk menyimpan data secara online.
              Ini memungkinkan sinkronisasi data antara Laptop, Tablet, dan HP.
          </p>
          
          <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Google Apps Script Web App URL</label>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/..."
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  />
                  <button 
                      onClick={handleSaveScriptUrl}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold"
                  >
                      <CheckCircle size={20} />
                  </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                  *Pastikan script dideploy sebagai "Web App" dengan akses "Anyone (Siapa Saja)".
              </p>
          </div>

          <div className="flex gap-4">
              <button 
                  onClick={handleCloudUpload}
                  disabled={isSyncing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
              >
                  {isSyncing ? <RefreshCw className="animate-spin" /> : <Upload />} 
                  Upload ke Cloud
              </button>
              <button 
                  onClick={handleCloudDownload}
                  disabled={isSyncing}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
              >
                  {isSyncing ? <RefreshCw className="animate-spin" /> : <Download />} 
                  Ambil dari Cloud
              </button>
          </div>
       </div>

       {/* Local Backup Section */}
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Database size={24}/> Backup Lokal (File)</h3>
          
          <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             accept=".json" 
             onChange={handleFileChange}
          />

          <div className="flex flex-col md:flex-row gap-4">
              <button 
                  onClick={handleExport}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-600"
              >
                  <Download size={20} /> Backup File (.json)
              </button>
              
              <button 
                  onClick={handleImportClick}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-600"
              >
                  <Upload size={20} /> Restore File (.json)
              </button>

              <button 
                  onClick={handleReset}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                  <AlertTriangle size={20} /> Factory Reset
              </button>
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
