import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Upload from "./pages/Upload";
import "./assets/global.css";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":  return <Dashboard />;
      case "documents":  return <Documents />;
      case "upload":     return <Upload />;
      // TODO: thêm các trang sau
      // case "classification": return <Classification />;
      // case "routing":        return <Routing />;
      // case "pending":        return <Pending />;
      // case "reports":        return <Reports />;
      default:
        return (
          <div style={{ textAlign: "center", paddingTop: 80, color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text2)" }}>Trang đang xây dựng</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Sẽ sớm ra mắt</div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        <Topbar activePage={activePage} />
        <div className="content-area">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}


