import { useState } from "react";
import styles from "./Routing.module.css";

const ROUTES = [
  { id: 1, category: "invoice",  catLabel: "Hóa đơn",       dest: "Kế toán / Finance",    folder: "/Drive/Finance/Invoices",    count: 42, active: true,  icon: "💰" },
  { id: 2, category: "contract", catLabel: "Hợp đồng",       dest: "Pháp lý / Legal",      folder: "/Drive/Legal/Contracts",     count: 28, active: true,  icon: "📜" },
  { id: 3, category: "hr",       catLabel: "HR",             dest: "Nhân sự / HR",         folder: "/Drive/HR/Documents",        count: 15, active: true,  icon: "👥" },
  { id: 4, category: "po",       catLabel: "Purchase Order", dest: "Mua hàng / Procurement",folder: "/Drive/Procurement/PO",     count: 19, active: true,  icon: "🛒" },
  { id: 5, category: "report",   catLabel: "Báo cáo",        dest: "Vận hành / Operations", folder: "/Drive/Operations/Reports", count: 14, active: true,  icon: "📊" },
  { id: 6, category: "other",    catLabel: "Khác",           dest: "Review thủ công",      folder: "/Drive/Pending/Review",      count: 6,  active: false, icon: "📁" },
];

const RECENT_ROUTED = [
  { name: "Invoice_2024_001.pdf",   from: "Hóa đơn",   to: "Kế toán",   time: "2m",  status: "ok" },
  { name: "Contract_NDA.docx",      from: "Hợp đồng",  to: "Pháp lý",   time: "5m",  status: "ok" },
  { name: "Resume_JohnDoe.pdf",     from: "HR",        to: "Nhân sự",   time: "8m",  status: "pending" },
  { name: "PO_0891.pdf",            from: "PO",        to: "Mua hàng",  time: "12m", status: "ok" },
  { name: "Report_Q4.xlsx",         from: "Báo cáo",   to: "Vận hành",  time: "18m", status: "ok" },
  { name: "Unknown_file.pdf",       from: "Khác",      to: "Review",    time: "25m", status: "review" },
];

const CAT_COLORS = {
  invoice:  { bg:"#4f7bff18", text:"#7fa3ff" },
  contract: { bg:"#22d4f018", text:"#22d4f0" },
  hr:       { bg:"#7c5fff18", text:"#a080ff" },
  po:       { bg:"#22c97b18", text:"#22c97b" },
  report:   { bg:"#f5a62318", text:"#f5a623" },
  other:    { bg:"#ffffff10", text:"#8b90a8" },
};

export default function Routing() {
  const [routes, setRoutes] = useState(ROUTES);

  const toggleRoute = (id) =>
    setRoutes((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));

  const totalRouted = ROUTES.reduce((a, r) => a + r.count, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Routing</h2>
          <p className={styles.pageDesc}>Cấu hình luồng định tuyến tài liệu vào Google Drive</p>
        </div>
        <button className="btn btn-primary">+ Thêm route</button>
      </div>

      {/* Flow diagram */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Pipeline định tuyến</span>
          <span style={{fontSize:12,color:"var(--text3)"}}>Tự động · {routes.filter(r=>r.active).length} route active</span>
        </div>
        <div className={styles.flowDiagram}>
          {/* Input */}
          <div className={styles.flowNode} style={{borderColor:"var(--accent)33",background:"#4f7bff0a"}}>
            <div className={styles.flowNodeIcon}>📥</div>
            <div className={styles.flowNodeLabel}>Email Inbox</div>
            <div className={styles.flowNodeSub}>Nhận file</div>
          </div>

          <div className={styles.flowArrow}>→</div>

          <div className={styles.flowNode} style={{borderColor:"var(--cyan)33",background:"#22d4f00a"}}>
            <div className={styles.flowNodeIcon}>🔍</div>
            <div className={styles.flowNodeLabel}>OCR Engine</div>
            <div className={styles.flowNodeSub}>Gemini Vision</div>
          </div>

          <div className={styles.flowArrow}>→</div>

          <div className={styles.flowNode} style={{borderColor:"var(--accent2)33",background:"#7c5fff0a"}}>
            <div className={styles.flowNodeIcon}>🤖</div>
            <div className={styles.flowNodeLabel}>AI Classify</div>
            <div className={styles.flowNodeSub}>Groq / Llama</div>
          </div>

          <div className={styles.flowArrow}>→</div>

          <div className={styles.flowNode} style={{borderColor:"var(--green)33",background:"#22c97b0a"}}>
            <div className={styles.flowNodeIcon}>📤</div>
            <div className={styles.flowNodeLabel}>Google Drive</div>
            <div className={styles.flowNodeSub}>{totalRouted} files</div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Route table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cấu hình routes</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Đích đến</th>
                <th>Thư mục Drive</th>
                <th>Files</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => {
                const cat = CAT_COLORS[r.category];
                return (
                  <tr key={r.id} className={!r.active ? styles.rowInactive : ""}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span>{r.icon}</span>
                        <span className="badge" style={{background:cat.bg,color:cat.text}}>{r.catLabel}</span>
                      </div>
                    </td>
                    <td className={styles.dest}>{r.dest}</td>
                    <td>
                      <code className={styles.folder}>{r.folder}</code>
                    </td>
                    <td className={styles.count}>{r.count}</td>
                    <td>
                      <button
                        className={`${styles.toggle} ${r.active ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => toggleRoute(r.id)}
                      >
                        <div className={styles.toggleThumb} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recent log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Log gần đây</span>
          </div>
          <div className={styles.logList}>
            {RECENT_ROUTED.map((item, i) => (
              <div key={i} className={styles.logItem}>
                <div className={`${styles.logDot} ${item.status === "ok" ? styles.dotOk : item.status === "pending" ? styles.dotPending : styles.dotReview}`} />
                <div className={styles.logInfo}>
                  <div className={styles.logName}>{item.name}</div>
                  <div className={styles.logRoute}>
                    <span>{item.from}</span>
                    <span className={styles.logArrow}>→</span>
                    <span style={{color:"var(--text)"}}>{item.to}</span>
                  </div>
                </div>
                <div className={styles.logTime}>{item.time} trước</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}