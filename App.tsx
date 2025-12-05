
import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { MenuView } from './components/MenuView';
import { AdminView } from './components/AdminView';
import { HistoryView } from './components/HistoryView';
import { StockView } from './components/StockView';
import { SecurityGate } from './components/SecurityGate';
import { AUTO_LOCK_MINUTES } from './constants';

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
    <div className="flex flex-col md:flex-row w-full h-screen h-[100dvh] bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar: Order last on mobile (bottom nav), first on desktop (left sidebar) */}
      <div className="order-last md:order-first z-50 shrink-0 h-16 md:h-full w-full md:w-auto shadow-xl">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      </div>
      
      <main className="flex-1 h-[calc(100dvh-4rem)] md:h-full relative overflow-hidden bg-slate-950 flex flex-col min-w-0">
        {/* Header User Info - Absolute on Desktop, Relative/Hidden on mobile if needed */}
        <div className="absolute top-0 right-0 p-3 md:p-6 flex items-center gap-3 z-10 pointer-events-none w-full justify-end bg-gradient-to-b from-slate-900/90 to-transparent md:bg-none">
           <div className="text-right pointer-events-auto drop-shadow-md">
              <div className="text-sm font-bold text-white">{state.user.name}</div>
              <div className="text-[10px] md:text-xs text-slate-300 md:text-slate-500 uppercase bg-slate-800/80 px-2 py-0.5 rounded-full">{state.user.role}</div>
           </div>
           <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shadow-lg backdrop-blur-sm">
             {state.user.username[0].toUpperCase()}
           </div>
        </div>
        
        {/* View Content */}
        <div className="flex-1 overflow-hidden h-full flex flex-col w-full">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [isStoreUnlocked, setIsStoreUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockStore = () => {
    // Optional: Uncomment line below if you WANT auto-lock to force re-entry of TOTP
    // setIsStoreUnlocked(false); 
    // localStorage.removeItem('STORE_UNLOCKED'); 
    console.log("Auto-lock triggered (Soft Lock - Session Only)");
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    if (isStoreUnlocked) {
      idleTimerRef.current = setTimeout(() => {
        lockStore();
      }, AUTO_LOCK_MINUTES * 60 * 1000);
    }
  };

  // Setup Activity Listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };

    if (isStoreUnlocked) {
      events.forEach(event => document.addEventListener(event, handleActivity));
      resetIdleTimer(); // Start timer immediately
    }

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isStoreUnlocked]);


  useEffect(() => {
    // Cek apakah sesi sudah terbuka sebelumnya menggunakan localStorage (Persistent)
    const unlocked = localStorage.getItem('STORE_UNLOCKED');
    if (unlocked === 'true') {
      setIsStoreUnlocked(true);
    }
    setChecking(false);
  }, []);

  if (checking) return null; // Prevent flash

  if (!isStoreUnlocked) {
    return <SecurityGate onUnlock={() => setIsStoreUnlocked(true)} />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
