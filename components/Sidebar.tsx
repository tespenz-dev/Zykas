import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { LayoutDashboard, LogOut, UtensilsCrossed, History, Box } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { state, dispatch } = useApp();

  const menuItems = [
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'stock', label: 'Stok', icon: Box, roles: [Role.ADMIN] },
    { id: 'history', label: 'Riwayat', icon: History, roles: [Role.ADMIN, Role.CASHIER] },
    { id: 'admin', label: 'Laporan', icon: LayoutDashboard, roles: [Role.ADMIN] },
  ];

  return (
    <div className="w-full h-16 md:w-24 md:h-full bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center justify-between md:justify-start md:py-8 px-4 md:px-0 shadow-2xl md:shadow-none z-50">
      {/* Brand Icon - Hidden on mobile to save space, visible on tablet+ */}
      <div className="hidden md:block mb-12">
        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center text-slate-900 font-bold text-xl">
            C&B
        </div>
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

      {/* Logout - On mobile it's just another icon at the end */}
      <button 
        onClick={() => dispatch({ type: 'LOGOUT' })}
        className="md:mt-auto text-rose-500 hover:bg-rose-500/10 p-2 md:p-4 rounded-2xl transition-colors"
        title="Logout"
      >
        <LogOut size={24} />
      </button>
    </div>
  );
};