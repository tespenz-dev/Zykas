import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-rose-500/10 p-6 rounded-full mb-6 border border-rose-500/20">
             <AlertTriangle size={64} className="text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Terjadi Kesalahan pada Aplikasi</h1>
          <p className="text-slate-400 max-w-md mb-6">
            Aplikasi mengalami crash. Ini mungkin karena masalah koneksi atau data yang korup.
          </p>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-lg overflow-auto mb-6 w-full text-left">
             <p className="text-xs font-mono text-rose-300 whitespace-pre-wrap">
               {this.state.error?.toString()}
             </p>
          </div>
          <button
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw size={20} />
            Reset Data & Reload
          </button>
          <p className="text-xs text-slate-500 mt-4">
            *Tombol di atas akan menghapus cache lokal dan me-refresh halaman.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}