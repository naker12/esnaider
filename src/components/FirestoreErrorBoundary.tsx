import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface FirestoreErrorBoundaryProps {
  children: React.ReactNode;
}

interface FirestoreErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class FirestoreErrorBoundary extends React.Component<
  FirestoreErrorBoundaryProps,
  FirestoreErrorBoundaryState
> {
  constructor(props: FirestoreErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): FirestoreErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocurrió un error inesperado al sincronizar los datos.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as { error?: string };
        if (parsed.error) {
          friendly = parsed.error;
        }
      } catch {
        // Not JSON wrapped
      }

      return (
        <div className="fixed inset-0 z-50 bg-[#0b0d12] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121621] border border-rose-500/50 rounded-xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl text-[#f3e6c8]">
              Error de Sincronización en Crónicas del Velo
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed break-words">
              {friendly}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-5 py-2.5 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] font-semibold text-sm inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar y volver al juego</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
