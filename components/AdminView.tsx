



import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, DollarSign, Plus, Trash2, Database, AlertTriangle, Download, ClipboardList, Scale, Upload, Cloud, RefreshCw, CheckCircle, Link, User, Shield, Edit, Save, X, RefreshCcw, Filter, Printer, MapPin, Phone, Store, ExternalLink } from 'lucide-react';
import { Role, ProductCategory, AppState, User as UserType } from '../types';

export const AdminView: React.FC = () => {
  const { state, dispatch, syncStatus, printerStatus, connectPrinter } = useApp();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INVENTORY' | 'AUDIT' | 'USERS' | 'SYSTEM'>('DASHBOARD');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audit State
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, string>>({});
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'RAW' | 'PRODUCT'>('ALL');

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
  const [syncAction, setSyncAction] = useState<'idle' | 'uploading' | 'downloading'>('idle');
  const [scriptUrl, setScriptUrl] = useState(state.settings?.googleScriptUrl || '');

  // New settings for store info
  const [storeNameInput, setStoreNameInput] = useState(state.settings?.storeName || '');
  const [storeAddressInput, setStoreAddressInput] = useState(state.settings?.storeAddress || '');
  const [storePhoneInput, setStorePhoneInput] = useState(state.settings?.storePhone || '');
  const [customReceiptFooterInput, setCustomReceiptFooterInput] = useState(state.settings?.customReceiptFooter || '');


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
                localStorage.setItem('ZYRA_KASIR_POS_DATA_V1', content);
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

  const handleSaveSettings = () => {
      dispatch({ 
          type: 'UPDATE_SETTINGS', 
          payload: { 
              googleScriptUrl: scriptUrl,
              storeName: storeNameInput,
              storeAddress: storeAddressInput,
              storePhone: storePhoneInput,
              customReceiptFooter: customReceiptFooterInput
          } 
      });
      alert('Pengaturan berhasil disimpan!');
  };

  const handleCloudUpload = async () => {
      if (!state.settings?.googleScriptUrl) {
          alert('Mohon isi URL Google Script terlebih dahulu.');
          return;
      }
      setSyncAction('uploading');
      try {
          const response = await fetch(state.settings.googleScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(state)
          });

          if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                  throw new Error(`Otorisasi Gagal (Error ${response.status}). INI MASALAH UTAMA.\n\nPeriksa kembali setting deployment:\n- 'Jalankan sebagai' HARUS 'Saya (Me)'.\n- 'Siapa yang memiliki akses' HARUS 'Siapa saja'.`);
              }
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("text/html") !== -1) {
                  throw new Error("Gagal: Script mengembalikan halaman HTML. Ini biasanya halaman error Google. Pastikan setting 'Jalankan sebagai' adalah 'Saya (Me)'.");
              }
              throw new Error(`Server merespon dengan status: ${response.status}`);
          }

          const result = await response.json();
          if (result.status === 'success') {
            alert('Data berhasil diunggah ke Google Cloud!');
          } else {
            throw new Error(result.message || 'Terjadi kesalahan pada script.');
          }

      } catch (error) {
          console.error("Upload error:", error);
          alert(`Gagal mengunggah data:\n\n${(error as Error).message}`);
      } finally {
          setSyncAction('idle');
      }
  };

  const handleCloudDownload = async () => {
      if (!state.settings?.googleScriptUrl) {
          alert('Mohon isi URL Google Script terlebih dahulu.');
          return;
      }

      setSyncAction('downloading');
      try {
          const response = await fetch(state.settings.googleScriptUrl);

          if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                  throw new Error(`Otorisasi Gagal (Error ${response.status}). INI MASALAH UTAMA.\n\nPeriksa kembali setting deployment:\n- 'Jalankan sebagai' HARUS 'Saya (Me)'.\n- 'Siapa yang memiliki akses' HARUS 'Siapa saja'.`);
              }
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("text/html") !== -1) {
                  throw new Error("Gagal: Script mengembalikan halaman HTML, bukan data JSON. Ini biasanya halaman login Google. Pastikan setting 'Siapa yang memiliki akses' adalah 'Siapa saja' (Anyone).");
              }
              throw new Error(`Server merespon dengan status: ${response.status} ${response.statusText}`);
          }
          
          const responseText = await response.text();
          
          let data: AppState;
          try {
              data = JSON.parse(responseText);
          } catch (e) {
              console.error("Respons dari cloud bukan JSON:", responseText);
              throw new Error('Respons bukan JSON. Pastikan fungsi doGet di Google Script Anda di-deploy dengan benar dan mengembalikan ContentService.MimeType.JSON.');
          }


          if (data && data.users && data.products) {
              if (confirm('Data dari cloud berhasil diambil. Timpa data lokal saat ini?')) {
                  dispatch({ type: 'IMPORT_DATA', payload: data });
                  alert('Data berhasil diimpor dari cloud!');
              }
          } else {
              throw new Error('Format data dari cloud tidak valid atau kosong.');
          }

      } catch (error) {
          console.error("Download error:", error);
          alert(`Gagal mengambil data dari cloud:\n\n${(error as Error).message}`);
      } finally {
          setSyncAction('idle');
      }
  };

  const handleTestUrl = () => {
    if (!state.settings?.googleScriptUrl || scriptUrl.trim() === '') {
        alert('Mohon isi URL Google Script terlebih dahulu.');
        return;
    }
    window.open(scriptUrl, '_blank');
  };

  const openUserModal = (user: UserType | null) => {
      setEditingUser(user);
      if (user) {
          setUserFormData(user);
      } else {
          setUserFormData({ name: '', username: '', role: Role.CASHIER, pin: '' });
      }
      setIsUserModalOpen(true);
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setUserFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userFormData.name || !userFormData.username || !userFormData.pin) {
          alert('Semua field wajib diisi!');
          return;
      }

      if (editingUser) {
          dispatch({ type: 'EDIT_USER', payload: { ...editingUser, ...userFormData } as UserType });
      } else {
          const newUser: UserType = {
              id: `user-${Date.now()}`,
              ...userFormData
          } as UserType;
          dispatch({ type: 'ADD_USER', payload: newUser });
      }
      setIsUserModalOpen(false);
  };

  const handleUserDelete = (id: string) => {
      if (state.users.length <= 1) {
          alert('Tidak bisa menghapus user terakhir.');
          return;
      }
      if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
          dispatch({ type: 'REMOVE_USER', payload: id });
      }
  };

  const renderCloudStatusIcon = () => {
    if (!state.settings?.googleScriptUrl) {
        return <Cloud size={16} className="text-slate-500" />;
    }
    switch (syncStatus) {
        case 'SYNCING': return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
        case 'SUCCESS': return <CheckCircle size={16} className="text-emerald-400" />;
        case 'ERROR': return <AlertTriangle size={16} className="text-rose-500" />;
        default: return <Cloud size={16} className="text-slate-400" />;
    }
  };
  
  const getCloudStatusText = () => {
      if (!state.settings?.googleScriptUrl) return "Nonaktif";
      switch (syncStatus) {
          case 'SYNCING': return "Menyimpan...";
          case 'SUCCESS': return "Tersimpan";
          case 'ERROR': return "Gagal";
          default: return "Siap";
      }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <DollarSign size={32} />
              </div>
              <div>
                  <div className="text-sm text-slate-400">Pendapatan Hari Ini</div>
                  <div className="text-3xl font-bold text-white">Rp {dailyTotal.toLocaleString()}</div>
              </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-5">
              <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-400">
                  <TrendingUp size={32} />
              </div>
              <div>
                  <div className="text-sm text-slate-400">Total Transaksi Hari Ini</div>
                  <div className="text-3xl font-bold text-white">{transactions.filter(t => new Date(t.timestamp).toDateString() === today).length}</div>
              </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-5">
              <div className="p-4 bg-amber-500/10 rounded-xl text-amber-400">
                  <Package size={32} />
              </div>
              <div>
                  <div className="text-sm text-slate-400">Item Stok Menipis</div>
                  <div className="text-3xl font-bold text-white">{state.products.filter(p => p.stock <= 10).length}</div>
              </div>
          </div>
       </div>

       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
         <h3 className="text-lg font-bold text-white mb-4">10 Transaksi Terakhir</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
               <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
               <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `Rp${Number(value)/1000}k`} />
               <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, 'Total']}
               />
               <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>
    </div>
  );

  const renderAudit = () => {
    const auditProducts = state.products.filter(p => {
        if (auditFilter === 'RAW') return p.category === ProductCategory.RAW_MATERIAL;
        if (auditFilter === 'PRODUCT') return p.category !== ProductCategory.RAW_MATERIAL;
        return true;
    });

    const handleAuditSubmit = () => {
        if (Object.keys(physicalStocks).length === 0) {
            alert("Mohon isi setidaknya satu stok fisik untuk disesuaikan.");
            return;
        }

        let changesSummary = "Ringkasan Perubahan Stok:\n\n";
        let hasChanges = false;

        for (const productId in physicalStocks) {
            const systemStock = state.products.find(p => p.id === productId)?.stock ?? 0;
            const physicalStock = parseInt(physicalStocks[productId]);

            if (!isNaN(physicalStock) && systemStock !== physicalStock) {
                const productName = state.products.find(p => p.id === productId)?.name;
                changesSummary += `- ${productName}: ${systemStock} -> ${physicalStock}\n`;
                hasChanges = true;
            }
        }
        
        if (!hasChanges) {
            alert("Tidak ada perbedaan stok yang ditemukan.");
            return;
        }

        if (confirm(changesSummary + "\nApakah Anda yakin ingin menerapkan perubahan ini?")) {
            for (const productId in physicalStocks) {
                const physicalStock = parseInt(physicalStocks[productId]);
                if (!isNaN(physicalStock)) {
                    dispatch({ type: 'SET_PRODUCT_STOCK', payload: { productId, stock: physicalStock } });
                }
            }
            alert("Stok berhasil disesuaikan!");
            setPhysicalStocks({});
        }
    };
    
    return (
      <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><ClipboardList size={20}/> Stok Opname / Audit Fisik</h3>
                  <p className="text-sm text-slate-400 mt-1">Hitung stok fisik lalu masukkan ke kolom "Fisik" untuk menyesuaikan data sistem.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-700 p-1 rounded-lg">
                    <button onClick={() => setAuditFilter('ALL')} className={`px-3 py-1.5 text-xs rounded ${auditFilter === 'ALL' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Semua</button>
                    <button onClick={() => setAuditFilter('PRODUCT')} className={`px-3 py-1.5 text-xs rounded ${auditFilter === 'PRODUCT' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Produk Jual</button>
                    <button onClick={() => setAuditFilter('RAW')} className={`px-3 py-1.5 text-xs rounded ${auditFilter === 'RAW' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>Bahan Baku</button>
                </div>
                <button onClick={handleAuditSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <Save size={16}/> Terapkan
                </button>
              </div>
          </div>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-900/50 sticky top-0 text-slate-400 uppercase text-xs z-10">
                      <tr>
                          <th className="p-4">Nama Produk</th>
                          <th className="p-4 text-center">Stok Sistem</th>
                          <th className="p-4 text-center w-40">Stok Fisik</th>
                          <th className="p-4 text-center">Selisih</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                      {auditProducts.map(product => {
                          const physicalStock = physicalStocks[product.id];
                          const difference = (physicalStock !== undefined && physicalStock !== '') ? parseInt(physicalStock) - product.stock : 0;
                          return (
                              <tr key={product.id} className={`${difference !== 0 ? 'bg-rose-500/10' : ''}`}>
                                  <td className="p-4 text-white font-medium">{product.name}</td>
                                  <td className="p-4 text-center text-slate-300 font-mono">{product.stock}</td>
                                  <td className="p-4">
                                      <input 
                                          type="number"
                                          value={physicalStock || ''}
                                          onChange={e => setPhysicalStocks({...physicalStocks, [product.id]: e.target.value})}
                                          className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                          placeholder="Hitung..."
                                      />
                                  </td>
                                  <td className={`p-4 text-center font-bold font-mono ${difference > 0 ? 'text-emerald-400' : difference < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                      {difference > 0 ? `+${difference}` : difference}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
    );
  };
  
  const renderUsers = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={20}/> Manajemen Pengguna</h3>
              <button onClick={() => openUserModal(null)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Plus size={16}/> Tambah User
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.users.map(user => (
                  <div key={user.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="font-bold text-white">{user.name}</div>
                              <div className="text-sm text-slate-400">@{user.username}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === Role.ADMIN ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{user.role}</span>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                          <button onClick={() => openUserModal(user)} className="flex-1 py-2 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-md">Edit</button>
                          <button onClick={() => handleUserDelete(user.id)} className="flex-1 py-2 text-sm bg-rose-600/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md">Hapus</button>
                      </div>
                  </div>
              ))}
          </div>
          
          {isUserModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                      <form onSubmit={handleUserSubmit} className="space-y-4">
                          <input name="name" value={userFormData.name} onChange={handleUserFormChange} placeholder="Nama Lengkap" className="w-full bg-slate-800 p-3 rounded-md text-white" required />
                          <input name="username" value={userFormData.username} onChange={handleUserFormChange} placeholder="Username (tanpa spasi)" className="w-full bg-slate-800 p-3 rounded-md text-white" required />
                          <input name="pin" type="password" value={userFormData.pin} onChange={handleUserFormChange} placeholder="PIN (6 digit angka)" className="w-full bg-slate-800 p-3 rounded-md text-white" required pattern="\d{6}" maxLength={6} />
                          <select name="role" value={userFormData.role} onChange={handleUserFormChange} className="w-full bg-slate-800 p-3 rounded-md text-white">
                              <option value={Role.CASHIER}>Kasir</option>
                              <option value={Role.ADMIN}>Admin</option>
                          </select>
                          <div className="flex gap-3 pt-2">
                              <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-3 bg-slate-700 rounded-md">Batal</button>
                              <button type="submit" className="flex-1 py-3 bg-emerald-600 rounded-md">Simpan</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );

  const renderSystem = () => (
      <div className="space-y-6">
          {/* Store Info Settings */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                  <Store size={24} /> Informasi Toko (Struk)
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                  <input value={storeNameInput} onChange={e => setStoreNameInput(e.target.value)} placeholder="Nama Toko" className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input value={storePhoneInput} onChange={e => setStorePhoneInput(e.target.value)} placeholder="No. Telepon Toko" className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input value={storeAddressInput} onChange={e => setStoreAddressInput(e.target.value)} placeholder="Alamat Toko" className="md:col-span-2 w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" />
                  <input value={customReceiptFooterInput} onChange={e => setCustomReceiptFooterInput(e.target.value)} placeholder="Footer Struk (cth: Password WiFi)" className="md:col-span-2 w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
          </div>
          
          {/* Cloud Sync Settings */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-3 text-white font-bold text-xl mb-2">
                  <Cloud size={24} /> Cloud Sync (Google Drive/Sheets)
              </div>
              <p className="text-sm text-slate-400 mb-2">
                  Hubungkan aplikasi dengan Google Apps Script untuk menyimpan data secara online. Ini memungkinkan sinkronisasi data antar Laptop, Tablet, dan HP.
              </p>
              <p className="text-xs text-slate-500 italic flex items-center gap-2 mb-4">
                  {renderCloudStatusIcon()}
                  Status Auto-Sync: {getCloudStatusText()}. Backup otomatis berjalan setiap 1 menit di tab aktif.
              </p>
              <div className="relative mb-2">
                  <input type="text" value={scriptUrl} onChange={e => setScriptUrl(e.target.value)} className="w-full bg-slate-800 p-3 pl-4 pr-12 rounded-lg text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500" placeholder="https://script.google.com/.../exec" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-700 rounded"><CheckCircle size={16} className="text-emerald-400" /></div>
              </div>
              <p className="text-xs text-slate-500 mb-4">*Pastikan script dideploy sebagai "Web App" dengan akses "Anyone (Siapa Saja)".</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleCloudUpload} disabled={syncAction !== 'idle'} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-wait text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      {syncAction === 'uploading' ? <><RefreshCw className="animate-spin" size={20}/> Mengunggah...</> : <><Upload size={20}/> Upload ke Cloud</>}
                  </button>
                  <button onClick={handleCloudDownload} disabled={syncAction !== 'idle'} className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-wait text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      {syncAction === 'downloading' ? <><RefreshCw className="animate-spin" size={20}/> Mengunduh...</> : <><Download size={20}/> Ambil dari Cloud</>}
                  </button>
              </div>
              <div className="mt-4">
                  <button onClick={handleTestUrl} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                      <ExternalLink size={16} /> Test URL di Browser
                  </button>
                  <p className="text-xs text-slate-500 mt-2 text-center px-4">
                      Klik tombol ini. Jika muncul halaman login Google atau error, artinya setting "Siapa yang memiliki akses" di Google Script salah.
                  </p>
              </div>
          </div>
          
          <div className="flex justify-center">
              <button onClick={handleSaveSettings} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2">
                  <Save size={18}/> Simpan Semua Pengaturan
              </button>
          </div>
          
          {/* Data & System Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-700">
              <div className="bg-slate-800 p-4 rounded-xl">
                  <h4 className="font-bold text-white mb-2">Data Lokal</h4>
                  <div className="flex gap-2">
                      <button onClick={handleExport} className="flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md">Export (.json)</button>
                      <button onClick={handleImportClick} className="flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md">Import (.json)</button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                  </div>
              </div>
              <div className="bg-rose-900/50 p-4 rounded-xl border border-rose-500/30">
                  <h4 className="font-bold text-rose-300 mb-2">Zona Berbahaya</h4>
                  <button onClick={handleReset} className="w-full py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md">Reset Aplikasi</button>
              </div>
          </div>

           {/* Printer Settings */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Printer size={18}/> Printer Bluetooth</h4>
              <p className="text-xs text-slate-400 mb-3">Hubungkan dengan printer thermal bluetooth untuk mencetak struk.</p>
              <div className="flex items-center gap-3">
                  <button 
                      onClick={connectPrinter} 
                      disabled={printerStatus === 'connecting' || printerStatus === 'connected'}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg"
                  >
                      {printerStatus === 'connecting' ? 'Menghubungkan...' : (printerStatus === 'connected' ? 'Terhubung' : 'Cari & Hubungkan')}
                  </button>
                  <div className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${printerStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {/* FIX: `printerStatus` is a string, not a function. It should not be called with `()`. */}
                      <span className="text-slate-300">Status: {printerStatus}</span>
                  </div>
              </div>
          </div>

      </div>
  );

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-rose-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
                Panel Admin
            </h2>
            <p className="text-slate-400 text-sm mt-1">Laporan penjualan, manajemen stok, dan pengaturan sistem.</p>
          </div>
          <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full md:w-auto">
              <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'DASHBOARD' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('AUDIT')} className={`px-4 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'AUDIT' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Audit Stok</button>
              <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'USERS' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Pengguna</button>
              <button onClick={() => setActiveTab('SYSTEM')} className={`px-4 py-2.5 text-sm font-bold rounded-lg ${activeTab === 'SYSTEM' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Sistem</button>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'DASHBOARD' && renderDashboard()}
        {activeTab === 'AUDIT' && renderAudit()}
        {activeTab === 'USERS' && renderUsers()}
        {activeTab === 'SYSTEM' && renderSystem()}
      </div>
    </div>
  );
};