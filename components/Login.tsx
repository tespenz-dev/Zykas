
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, User as UserIcon, Lock } from 'lucide-react';
import { APP_LOGO_COLOR_BASE64 } from '../constants';

export const Login: React.FC = () => {
  const { state, dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !pin) {
      setError('Username dan PIN wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate network delay for better UX
    setTimeout(() => {
        const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());

        if (user && user.pin === pin) {
          dispatch({ type: 'LOGIN', payload: user });
        } else {
          setError('Username atau PIN salah.');
          setPin(''); // Clear pin on failed attempt
          setIsLoading(false);
        }
    }, 500);
  };
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm md:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[90vh] md:min-h-[600px]">
        
        {/* Left Side: Branding */}
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
        <div className="p-6 md:p-8 flex flex-col justify-center bg-slate-900 w-full">
            <div className="md:hidden mb-6 flex justify-center">
                <img src={APP_LOGO_COLOR_BASE64} alt="Zyra Billiard & Coffee" className="h-24 w-auto object-contain" />
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Selamat Datang</h2>
              <p className="text-slate-500 text-sm mt-1">Silakan masuk untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        placeholder="Masukkan username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoFocus
                    />
                </div>
              </div>
              
              {/* PIN/Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">PIN</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        placeholder="Masukkan 6-digit PIN"
                        maxLength={6}
                        inputMode="numeric"
                    />
                </div>
              </div>
              
              {/* Error Message */}
              <div className="h-6 text-center">
                {error && <p className="text-rose-400 text-sm animate-pulse font-medium">{error}</p>}
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isLoading || !username || !pin}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-wait text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Memeriksa...</span>
                        </>
                    ) : (
                        <>
                            <LogIn size={20} />
                            <span>Masuk</span>
                        </>
                    )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};
