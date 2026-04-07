import React, { useState, useCallback } from "react";
import LandingPage from "./components/LandingPage";
import OwnerDashboard from "./components/OwnerDashboard";
import ViewerPage from "./components/ViewerPage";
import "./App.css";

function App() {
  // Simple state-based routing: "landing" | "creator" | "viewer"
  const [page, setPage] = useState("landing");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const goToLanding = () => setPage("landing");

  return (
    <div className="app">
      {/* Page Rendering */}
      {page === "landing" && (
        <LandingPage
          onSelectCreator={() => setPage("creator")}
          onSelectViewer={() => setPage("viewer")}
        />
      )}

      {page === "creator" && (
        <OwnerDashboard onBack={goToLanding} onToast={showToast} />
      )}

      {page === "viewer" && (
        <ViewerPage onBack={goToLanding} onToast={showToast} />
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