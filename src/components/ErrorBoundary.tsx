import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#eef2f9] flex items-center justify-center p-4 text-[#0c1a33]">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              Terjadi Kendala Teknis
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Aplikasi mendeteksi kendala pada sistem atau ekstensi browser. Klik tombol di bawah untuk memuat ulang aplikasi.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-5 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
