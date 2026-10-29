import React, { useState, useCallback } from "react";
import LandingPage from "./components/LandingPage";
import OwnerDashboard from "./components/OwnerDashboard";
import ViewerPage from "./components/ViewerPage";
import VerifierPage from "./components/VerifierPage";
import "./App.css";

function App() {
  // Simple state-based routing: "landing" | "creator" | "viewer" | "verifier"
  const [page, setPage] = useState("landing");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const goToLanding = () => setPage("landing");

  return (
    <div className="app">
      {/* Page Rendering */}
      {page === "landing" && (
        <LandingPage
          onSelectCreator={() => setPage("creator")}
          onSelectViewer={() => setPage("viewer")}
          onSelectVerifier={() => setPage("verifier")}
        />
      )}

      {page === "creator" && (
        <OwnerDashboard
          onBack={goToLanding}
          onToast={showToast}
          onSelectVerifier={() => setPage("verifier")}
        />
      )}

      {page === "viewer" && (
        <ViewerPage
          onBack={goToLanding}
          onToast={showToast}
          onSelectVerifier={() => setPage("verifier")}
        />
      )}

      {page === "verifier" && (
        <VerifierPage
          onBack={goToLanding}
          onToast={showToast}
          onSelectCreator={() => setPage("creator")}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast--${toast.type}`} key={Date.now()}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
