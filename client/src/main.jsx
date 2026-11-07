import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Application render failed:", error, info.componentStack);
  }

  render() {
    if (this.state.error)
      return (
        <main className="fatal-error">
          <div>
            <div className="eyebrow">CASEFILE DISPLAY ERROR</div>
            <h1>This case could not be displayed.</h1>
            <p>
              {this.state.error.message ||
                "An unexpected error occurred while rendering this page."}
            </p>
            <button className="button" onClick={() => window.location.reload()}>
              Reload case
            </button>
          </div>
        </main>
      );
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
