"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * GlobalErrorBoundary — catches React render-time errors anywhere in the
 * component tree and shows a friendly recovery screen instead of a blank page.
 *
 * Usage: wrap your page / layout root with <GlobalErrorBoundary>.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production you'd send this to Sentry / LogRocket etc.
    console.error("[GlobalErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            background: "#0f172a",
            color: "#e2e8f0",
            fontFamily: "Inter, sans-serif",
            padding: "2rem",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "3rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.5rem", color: "#f87171", margin: 0 }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: "#94a3b8", maxWidth: 480, margin: 0 }}>
            نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو إعادة تحميل
            الصفحة.
          </p>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre
              style={{
                background: "#1e293b",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                color: "#f87171",
                maxWidth: 600,
                overflowX: "auto",
                textAlign: "left",
              }}
            >
              {this.state.error.toString()}
              {"\n"}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={this.handleReset}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.4rem",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              حاول مرة أخرى
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#334155",
                color: "#e2e8f0",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.4rem",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
