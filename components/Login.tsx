
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Delete, User as UserIcon, LogIn, Shield, X } from 'lucide-react';
import { User, Role } from '../types';
import { APP_LOGO_COLOR_BASE64 } from '../constants';

// --- KOMPONEN MODAL UNTUK INPUT PIN ---
const PinModal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const { dispatch } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.pin === pin) {
      dispatch({ type: 'LOGIN', payload: user });
      // Tidak perlu onClose, karena komponen induk akan hilang saat login berhasil
    } else {
      setError('PIN salah.');
      setPin('');
      setTimeout(() => setError(''), 2000); // Hapus error setelah 2 detik
    }
  };

  const handleNumPad = (num: string) => {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg bg-slate-700 text-slate-300`}>
              {user.role === Role.ADMIN ? <Shield size={16} /> : <UserIcon size={16} />}
            </div>
            <div>
              <div className="font-bold text-white">{user.name}</div>
              <div className="text-xs text-slate-400">Masukkan PIN 6-digit</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        {/* Body Modal */}
        <form onSubmit={handleLogin} className="p-6">
          <div className="flex justify-center gap-4 mb-6 h-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < pin.length
                  ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-slate-700'
                } ${error ? '!bg-rose-500' : ''}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full select-none mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumPad(num.toString())}
                className="h-14 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold transition-all active:scale-95 border border-slate-700/50 shadow-sm"
              >
                {num}
              </button>
            ))}
            <div className="flex items-center justify-center opacity-50"></div>
            <button
              type="button"
              onClick={() => handleNumPad('0')}
              className="h-14 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold transition-all active:scale-95 border border-slate-700/50 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-lg bg-slate-800/50 hover:bg-rose-900/20 text-rose-500 flex items-center justify-center transition-all active:scale-95 border border-slate-700/50"
            >
              <Delete size={20} />
            </button>
          </div>
          
          <div className="h-6 text-center w-full">
            {error && <p className="text-rose-400 text-sm animate-pulse font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={pin.length < 6}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};


// --- KOMPONEN UTAMA LOGIN YANG TELAH DIMODIFIKASI ---
export const Login: React.FC = () => {
  const { state } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm md:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[90vh] md:min-h-[600px]">

          {/* Sisi Kiri: Branding */}
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

          {/* Sisi Kanan: Pilihan Pengguna */}
          <div className="p-6 md:p-8 flex flex-col bg-slate-900 w-full">
            <div className="md:hidden mb-6 flex justify-center">
              <img src={APP_LOGO_COLOR_BASE64} alt="Zyra Billiard & Coffee" className="h-24 w-auto object-contain" />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white">Selamat Datang</h2>
              <p className="text-slate-500 text-sm mt-1">Pilih akun untuk memulai sesi kasir.</p>
            </div>

            {/* Grid Pilihan Pengguna */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-4 w-full flex-1 content-center">
              {state.users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-200 outline-none aspect-square bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-emerald-500 hover:text-white active:scale-95 focus:ring-2 focus:ring-emerald-500`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg transition-colors bg-slate-700 text-slate-400`}>
                    {user.role === Role.ADMIN ? <Shield size={24} /> : <UserIcon size={24} />}
                  </div>
                  <div className="text-center w-full">
                    <div className="font-bold text-base truncate w-full px-1">{user.name}</div>
                    <div className={`text-xs uppercase tracking-wider text-slate-500`}>
                      {user.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
      
      {/* Render Modal PIN secara kondisional */}
      {selectedUser && (
        <PinModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </>
  );
};
