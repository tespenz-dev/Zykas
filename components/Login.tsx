


import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Delete, User as UserIcon, LogIn, Shield, Store } from 'lucide-react';
import { User, Role } from '../types';
import { APP_LOGO_COLOR_BASE64 } from '../constants';

export const Login: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !pin) {
      setError('Pilih akun dan masukkan PIN');
      return;
    }

    if (selectedUser.pin === pin) {
      dispatch({ type: 'LOGIN', payload: selectedUser });
    } else {
      setError('PIN salah. Silakan coba lagi.');
      setPin('');
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handleNumPad = (num: string) => {
    if (!selectedUser) {
        setError('Silakan pilih akun terlebih dahulu');
        return;
    }
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm md:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[90vh] md:min-h-[600px]">
        
        {/* Left Side: Branding (Hidden on small mobile, visible on tablets+) */}
        <div className="hidden md:flex bg-gradient-to-br from-slate-900 to-slate-800 p-8 lg:p-12 flex-col justify-between border-r border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="z-10 flex-1 flex items-center justify-center">
            <img src={APP_LOGO_COLOR_BASE64} alt="Zyra Billiard & Coffee" className="w-auto h-64 object-contain" />
          </div>

          <div className="z-10 text-xs text-slate-600 text-center">
             © 2024 Zyra Billiard dan Kopi.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-6 md:p-8 flex flex-col bg-slate-900 w-full">
            <div className="md:hidden mb-6 flex justify-center">
                <img src={APP_LOGO_COLOR_BASE64} alt="Zyra Billiard & Coffee" className="h-24 w-auto object-contain" />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">Pilih Akun</h2>
              <p className="text-slate-500 text-sm mt-1">Siapa yang bertugas hari ini?</p>
            </div>

            <form onSubmit={handleLogin} className="flex-1 flex flex-col items-center w-full">
              {/* User Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3 mb-6 w-full max-w-xs md:max-w-none">
                {state.users.map((user) => (
                    <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 outline-none ${
                            selectedUser?.id === user.id
                            ? 'bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-500/50 shadow-lg'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-500'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                            selectedUser?.id === user.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-500'
                        }`}>
                            {user.role === Role.ADMIN ? <Shield size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div className="text-center w-full">
                            <div className="font-bold text-sm truncate w-full px-1">{user.name}</div>
                            <div className={`text-[10px] uppercase tracking-wider ${selectedUser?.id === user.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                                {user.role}
                            </div>
                        </div>
                    </button>
                ))}
              </div>

              <div className={`w-full max-w-[280px] transition-all duration-300 ${selectedUser ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
                <div className="flex justify-between items-center mb-4">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIN Akses</label>
                     {selectedUser && (
                         <span className="text-xs text-emerald-400 font-medium animate-pulse">
                            User: {selectedUser.username}
                         </span>
                     )}
                </div>
                
                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-6 h-4">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          i < pin.length 
                          ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                          : 'bg-slate-700'
                      }`} 
                    />
                  ))}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 w-full select-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumPad(num.toString())}
                      className="h-12 md:h-14 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold transition-all active:scale-95 border border-slate-700/50 shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex items-center justify-center opacity-50"></div>
                  <button
                    type="button"
                    onClick={() => handleNumPad('0')}
                    className="h-12 md:h-14 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold transition-all active:scale-95 border border-slate-700/50 shadow-sm"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-12 md:h-14 rounded-lg bg-slate-800/50 hover:bg-rose-900/20 text-rose-500 flex items-center justify-center transition-all active:scale-95 border border-slate-700/50"
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>
              
              <div className="mt-auto pt-4 h-6 text-center w-full">
                 {error && <p className="text-rose-400 text-sm animate-pulse font-medium">{error}</p>}
              </div>

              <button 
                type="submit" 
                disabled={!selectedUser || pin.length < 6}
                className="w-full max-w-[280px] mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-0 disabled:translate-y-4 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Masuk
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};
