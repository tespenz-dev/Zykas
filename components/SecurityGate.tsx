
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ChevronRight, QrCode, Smartphone } from 'lucide-react';
import { GOOGLE_AUTH_SECRET } from '../constants';
import * as OTPAuth from 'otpauth';

interface SecurityGateProps {
  onUnlock: () => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Setup TOTP Generator
  const totp = new OTPAuth.TOTP({
    issuer: "CueBrewPOS",
    label: "AdminAccess",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(GOOGLE_AUTH_SECRET)
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate token (window: 1 means allow code from +/- 30 seconds to account for slight time drift)
    const delta = totp.validate({ token: code, window: 1 });

    if (delta !== null) {
      sessionStorage.setItem('STORE_UNLOCKED', 'true');
      onUnlock();
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${error ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]'}`}>
            {error ? <Lock size={40} /> : <ShieldCheck size={40} />}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Keamanan Toko</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Masukkan kode 6-digit dari aplikasi Google Authenticator Anda.
        </p>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="relative">
            <input
              type="text" // 'tel' sometimes triggers numpad better on mobile
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              className={`w-full bg-slate-950 text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border-2 outline-none transition-all ${
                error 
                ? 'border-rose-500 text-rose-500 focus:ring-rose-500/50' 
                : 'border-slate-700 text-white focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              }`}
              placeholder="000000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={code.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            Buka Toko <ChevronRight size={20} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            {/* TOMBOL SETUP YANG LEBIH MENCUAL DAN BESAR */}
            <button 
                onClick={() => setShowSetup(!showSetup)}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    showSetup 
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
                    : 'bg-slate-800 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                }`}
            >
                <QrCode size={18} /> 
                {showSetup ? 'Sembunyikan' : 'Setup Authenticator Baru'}
            </button>

            {showSetup && (
                <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-left animate-fade-in ring-2 ring-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                        <Smartphone size={16} /> Panduan Aktivasi
                    </div>
                    <ol className="text-xs text-slate-400 space-y-3 list-decimal pl-4">
                        <li>Install <strong>Google Authenticator</strong> di HP Anda.</li>
                        <li>Buka App -> Tekan <strong>(+)</strong> -> <strong>Enter a setup key</strong>.</li>
                        <li>Account name: <span className="text-white font-bold">Zykas POS</span></li>
                        <li>Your key: 
                            <div className="mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-center select-all tracking-widest break-all">
                                {GOOGLE_AUTH_SECRET}
                            </div>
                        </li>
                        <li>Pilih <strong>Add</strong>. Masukkan kode yang muncul di HP ke kolom di atas.</li>
                    </ol>
                </div>
            )}
        </div>
      </div>
      
      <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
         Protected by 2FA Time-Based Token
      </div>
    </div>
  );
};
