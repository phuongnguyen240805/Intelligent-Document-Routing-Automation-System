import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import "./assets/global.css";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        <Topbar activePage={activePage} />
        <div className="content-area">
          {activePage === "dashboard" && <Dashboard />}
          {/* Thêm các trang khác ở đây sau */}
        </div>
      </div>
    </div>
  );
}

