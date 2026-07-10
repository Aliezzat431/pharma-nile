"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw, Terminal, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[GlobalErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  handleCopyReport = () => {
    if (!this.state.error) return;
    const reportText = `[PharmaNile System Crash Report]
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error.toString()}
Stack Trace:
${this.state.errorInfo?.componentStack || this.state.error.stack || "No trace available"}`;

    navigator.clipboard.writeText(reportText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#05050a] relative overflow-hidden font-cairo text-right" dir="rtl">
          {}
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

          {}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] bg-center pointer-events-none" />

          <div className="glass-panel w-full max-w-2xl p-8 border border-rose-500/20 shadow-[0_12px_50px_rgba(244,63,94,0.1)] flex flex-col items-center gap-6 relative z-10 animate-entrance">
            
            {}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse">
              <AlertTriangle className="w-8 h-8 text-rose-450" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-white">حدث خطأ غير متوقع في النظام</h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                نعتذر عن الإزعاج. واجه أحد المكونات البرمجية صعوبة في التحميل. يمكنك إعادة المحاولة أو إبلاغ المطور.
              </p>
            </div>

            {}
            {this.state.error && (
              <div className="w-full space-y-2 text-left" dir="ltr">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Stack Diagnostics Trace
                  </span>
                  
                  <button
                    onClick={this.handleCopyReport}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all font-sans cursor-pointer active:scale-95"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-450" />
                        <span>Copied Report!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-rose-400" />
                        <span>Copy Crash Log</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/70 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-rose-300/90 overflow-auto max-h-52 scrollbar-thin select-all leading-relaxed shadow-inner">
                  <span className="text-gray-550 block font-bold mb-1">[ERROR_REF: RUNTIME_EXCEPTION]</span>
                  {this.state.error.toString()}
                  {"\n"}
                  {this.state.errorInfo?.componentStack || this.state.error.stack || "No additional trace parsed."}
                </div>
              </div>
            )}

            {}
            <div className="flex flex-wrap items-center gap-3 justify-center w-full mt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-black text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:scale-102 active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>محاولة التعافي</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 hover:bg-slate-800 text-gray-300 font-bold text-sm rounded-xl transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-rose-400" />
                <span>إعادة تحميل الصفحة</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
