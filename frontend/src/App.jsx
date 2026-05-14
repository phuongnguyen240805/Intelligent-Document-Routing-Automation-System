import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar  from "./components/Topbar";
import Dashboard      from "./pages/Dashboard";
import Documents      from "./pages/Documents";
import Upload         from "./pages/Upload";
import Classification from "./pages/Classification";
import Routing        from "./pages/Routing";
import Pending        from "./pages/Pending";
import Reports        from "./pages/Reports";
import { getAllDocuments } from "./services/api";
import "./assets/global.css";

const DONE_STATUSES = ["approved", "rejected", "success", "uploaded", "failed"];

export default function App() {
  const [activePage,    setActivePage]    = useState("dashboard");
  const [pendingCount,  setPendingCount]  = useState(0);

  /* Đếm pending thật từ backend — cập nhật mỗi 30 giây */
  const refreshPendingCount = () => {
    getAllDocuments()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const count = arr.filter(d =>
          !DONE_STATUSES.includes(d.status) && (
            d.status === "pending" ||
            (d.confidence !== null && d.confidence !== undefined && Number(d.confidence) < 0.70)
          )
        ).length;
        setPendingCount(count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  /* Khi rời khỏi trang Pending thì refresh lại count */
  const handleNavigate = (page) => {
    if (activePage === "pending" && page !== "pending") {
      refreshPendingCount();
    }
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":      return <Dashboard />;
      case "documents":      return <Documents />;
      case "upload":         return <Upload />;
      case "classification": return <Classification />;
      case "routing":        return <Routing />;
      case "pending":        return <Pending onResolved={refreshPendingCount} />;
      case "reports":        return <Reports />;
      default:               return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} pendingCount={pendingCount} />
      <div className="main-area">
        <Topbar activePage={activePage} />
        <div className="content-area">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}