import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "page" | "inline";
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { variant = "inline", fallbackMessage } = this.props;
    const message =
      fallbackMessage ??
      (variant === "page"
        ? "Something went wrong. Please refresh the page."
        : "This section failed to load. You can try again or refresh the page.");

    if (variant === "page") {
      return (
        <div style={styles.pageWrap}>
          <div style={styles.card}>
            <span style={styles.icon} aria-hidden="true">⚠</span>
            <h1 style={styles.heading}>Unexpected Error</h1>
            <p style={styles.message}>{message}</p>
            <div style={styles.actions}>
              <button style={styles.btnPrimary} onClick={this.handleRetry}>
                Try again
              </button>
              <button style={styles.btnSecondary} onClick={() => window.location.reload()}>
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.inlineWrap} role="alert">
        <p style={styles.inlineMessage}>
          <span style={styles.inlineIcon} aria-hidden="true">⚠</span>
          {message}
        </p>
        <button style={styles.inlineBtn} onClick={this.handleRetry}>
          Try again
        </button>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  pageWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "1.5rem",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "2rem 2.5rem",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  icon: {
    fontSize: "2.5rem",
    color: "var(--error)",
  },
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "var(--text)",
  },
  message: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  btnPrimary: {
    padding: "0.5rem 1.25rem",
    borderRadius: "var(--radius)",
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "0.5rem 1.25rem",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text)",
    fontWeight: 500,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  inlineWrap: {
    background: "var(--error-bg)",
    border: "1px solid var(--error)",
    borderRadius: "var(--radius)",
    padding: "1rem 1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    margin: "1rem 0",
  },
  inlineMessage: {
    color: "var(--error)",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  inlineIcon: {
    flexShrink: 0,
    marginTop: "1px",
  },
  inlineBtn: {
    alignSelf: "flex-start",
    padding: "0.375rem 0.875rem",
    borderRadius: "var(--radius)",
    border: "1px solid var(--error)",
    background: "transparent",
    color: "var(--error)",
    fontWeight: 500,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};

export default ErrorBoundary;
