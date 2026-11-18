import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class LauncherErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false, message: ''};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, message: error?.message || 'Unexpected launcher error'};
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-xs tracking-[0.2em] text-zinc-400 uppercase">SKY LAUNCHER</p>
          <p className="text-sm text-zinc-300 max-w-sm">{this.state.message}</p>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.clear();
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            className="min-h-[42px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            Reset &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <LauncherErrorBoundary>
    <App />
  </LauncherErrorBoundary>
);
