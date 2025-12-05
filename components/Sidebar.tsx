import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { LayoutDashboard, LogOut, UtensilsCrossed, History, Box, Cloud, RefreshCw, CheckCircle, AlertCircle, Lock, Unlock } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { state, dispatch, syncStatus } = useApp();

  const menuItems = [
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'stock', label: 'Stok', icon: Box, roles: [Role.ADMIN] },
    { id: 'history', label: 'Riwayat', icon: History, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'admin', label: 'Laporan', icon: LayoutDashboard, roles: [Role.ADMIN] },
  ];

  // Helper untuk merender ikon status cloud
  const renderCloudStatus = () => {
      if (!state.settings?.googleScriptUrl) {
          return <Cloud className="text-slate-600" size={20} />; // Abu-abu (Belum aktif)
      }

      switch (syncStatus) {
          case 'PENDING':
          case 'SYNCING':
              return <RefreshCw className="text-blue-400 animate-spin" size={20} />; // Biru Putar (Proses)
          case 'SUCCESS':
              return <CheckCircle className="text-emerald-400" size={20} />; // Hijau (Aman)
          case 'ERROR':
              return <AlertCircle className="text-rose-500" size={20} />; // Merah (Gagal)
          default:
              return <Cloud className="text-slate-500" size={20} />; // Idle
      }
  };

  const getStatusText = () => {
      if (!state.settings?.googleScriptUrl) return "Cloud Mati";
      if (syncStatus === 'SYNCING' || syncStatus === 'PENDING') return "Menyimpan...";
      if (syncStatus === 'SUCCESS') return "Tersimpan";
      if (syncStatus === 'ERROR') return "Gagal Sync";
      return "Cloud Siap";
  };

  const isShiftActive = !!state.activeShift;

  return (
    <div className="w-full h-16 md:w-24 md:h-full bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center justify-between md:justify-start md:py-8 px-4 md:px-0 shadow-2xl md:shadow-none z-50">
      {/* Brand Icon */}
      <div className="hidden md:block mb-8">
        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center text-slate-900 font-bold text-xl">
            C&B
        </div>
      </div>

      {/* CASHIER STATUS INDICATOR (NEW) */}
      <div className="hidden md:flex flex-col items-center justify-center mb-6 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 w-16 mx-auto" title={isShiftActive ? "Kasir Buka" : "Kasir Tutup"}>
          {isShiftActive ? (
              <Unlock size={20} className="text-emerald-400" />
          ) : (
              <Lock size={20} className="text-rose-400 animate-pulse" />
          )}
          <span className={`text-[9px] mt-1 font-bold font-mono text-center leading-tight ${isShiftActive ? 'text-emerald-400' : 'text-rose-400'}`}>
             {isShiftActive ? 'BUKA' : 'TUTUP'}
          </span>
      </div>

      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start md:space-y-6 w-full md:px-4">
        {menuItems.filter(item => item.roles.includes(state.user?.role!)).map(item => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex-1 md:flex-none md:w-full aspect-auto md:aspect-square py-2 md:py-0 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group ${
              currentView === item.id 
                ? 'bg-slate-800 md:bg-slate-800 text-emerald-400 shadow-inner' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
            }`}
          >
            <item.icon size={24} className={`transition-transform group-hover:scale-110 ${currentView === item.id ? 'stroke-2' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CLOUD STATUS INDICATOR */}
      <div className="hidden md:flex flex-col items-center justify-center mb-6 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 w-16 mx-auto" title={getStatusText()}>
          {renderCloudStatus()}
          <span className="text-[9px] text-slate-500 mt-1 font-mono text-center leading-tight">
             {state.settings?.googleScriptUrl ? 'AUTO' : 'MATI'}
          </span>
      </div>

      {/* Logout */}
      <button 
        onClick={() => dispatch({ type: 'LOGOUT' })}
        className="md:mt-auto text-rose-500 hover:bg-rose-500/10 p-2 md:p-4 rounded-2xl transition-colors flex flex-col items-center"
        title="Keluar / Logout"
      >
        <LogOut size={24} />
      </button>
    </div>
  );
};