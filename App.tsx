

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { MenuView } from './components/MenuView';
import { AdminView } from './components/AdminView';
import { HistoryView } from './components/HistoryView';
import { StockView } from './components/StockView';

const MainLayout: React.FC = () => {
  const { state } = useApp();
  const [currentView, setCurrentView] = useState('menu');

  if (!state.user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'menu': return <MenuView />;
      case 'stock': return <StockView />;
      case 'history': return <HistoryView />;
      case 'admin': return <AdminView />;
      default: return <MenuView />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar: Order last on mobile (bottom nav), first on desktop (left sidebar) */}
      <div className="order-last md:order-first z-50 shrink-0">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      </div>
      
      <main className="flex-1 h-full relative overflow-hidden bg-slate-950 flex flex-col min-w-0">
        {/* Header User Info - Absolute on Desktop, Relative/Hidden on mobile if needed */}
        <div className="absolute top-0 right-0 p-4 md:p-6 flex items-center gap-3 z-10 pointer-events-none w-full justify-end bg-gradient-to-b from-slate-900/80 to-transparent md:bg-none">
           <div className="text-right pointer-events-auto drop-shadow-md">
              <div className="text-sm font-bold text-white">{state.user.name}</div>
              <div className="text-xs text-slate-300 md:text-slate-500 uppercase">{state.user.role}</div>
           </div>
           <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shadow-lg backdrop-blur-sm">
             {state.user.username[0].toUpperCase()}
           </div>
        </div>
        
        {/* View Content */}
        <div className="flex-1 overflow-hidden h-full flex flex-col">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}