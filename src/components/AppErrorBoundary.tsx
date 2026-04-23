import React from "react";

type State = {
  hasError: boolean;
  errorMessage: string;
};

export default class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected application error",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("AppErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,#fff 0%,#f8fafc 100%)",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              border: "1px solid #dbe4ee",
              borderRadius: 24,
              background: "#fff",
              padding: 28,
              boxShadow: "0 16px 40px rgba(15,23,42,.08)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: 999,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".12em",
              }}
            >
              Application Error
            </div>

            <h1 style={{ margin: "16px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
              Something went wrong
            </h1>

            <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
              The page hit an unexpected error. Reload the workspace to continue.
            </p>

            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 16,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 13,
                wordBreak: "break-word",
              }}
            >
              {this.state.errorMessage || "Unexpected application error"}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button
                onClick={this.reset}
                style={{
                  border: "none",
                  borderRadius: 12,
                  background: "#0f766e",
                  color: "#fff",
                  padding: "12px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Reload App
              </button>

              <button
                onClick={() => window.location.assign("/dashboard")}
                style={{
                  border: "none",
                  borderRadius: 12,
                  background: "#0f2f5c",
                  color: "#fff",
                  padding: "12px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
