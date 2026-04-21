import { useEffect, useRef, useState } from "react";
import StatCard from "../components/StatCard";
import { getAllDocuments } from "../services/api";
import styles from "./Dashboard.module.css";

const CAT_COLORS = {
  "Hóa đơn":       { color: "var(--accent)",  cls: "invoice" },
  "Hợp đồng":      { color: "var(--cyan)",     cls: "contract" },
  "Purchase Order": { color: "var(--green)",   cls: "po" },
  "HR":             { color: "var(--accent2)", cls: "hr" },
  "Báo cáo":        { color: "var(--amber)",   cls: "report" },
};

const STATUS_DOT   = { success: "dot-green", pending: "dot-amber", failed: "dot-red", uploaded: "dot-green" };
const STATUS_LABEL = { success: "Thành công", pending: "Chờ xử lý", failed: "Thất bại", uploaded: "Đã upload" };

const PIPELINE = [
  { icon: "📥", name: "Schedule Trigger", meta: "Chạy mỗi 15 phút",    statusKey: "routed",  label: "Active",  labelColor: "var(--green)" },
  { icon: "🔍", name: "OCR Engine",       meta: "Gemini Vision",        statusKey: "routed",  label: "Ready",   labelColor: "var(--green)" },
  { icon: "🤖", name: "AI Classify",      meta: "Groq / Llama 3.3",    statusKey: "pending", label: "Running", labelColor: "var(--amber)" },
  { icon: "📤", name: "Google Drive",     meta: "Auto-route folders",   statusKey: "routed",  label: "Synced",  labelColor: "var(--green)" },
];

function formatTimeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default function Dashboard() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDocuments()
      .then((data) => { setDocs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* Derived stats từ data thật */
  const total    = docs.length;
  const success  = docs.filter(d => d.status === "success" || d.status === "uploaded").length;
  const pending  = docs.filter(d => d.status === "pending").length;

  /* Categories count */
  const catCounts = docs.reduce((acc, d) => {
    const cat = d.category || "Khác";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const catList = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = catList[0]?.[1] || 1;

  /* Recent 6 */
  const recent = docs.slice(0, 6);

  /* Animate bars */
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll("[data-bar-pct]").forEach(el => {
        el.style.width = el.dataset.barPct + "%";
      });
    }, 400);
    return () => clearTimeout(t);
  }, [catList]);

  return (
    <div className={styles.page}>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Tổng tài liệu"   value={total}   sub={loading ? "Đang tải..." : "trong hệ thống"}          icon="📄" color="blue" />
        <StatCard label="Đã xử lý thành công" value={success} sub={total ? Math.round(success/total*100)+"% tỉ lệ" : "—"} icon="✓" color="green" />
        <StatCard label="Chờ xử lý"       value={pending} sub="cần xem lại"                                          icon="⏳" color="amber" />
        <StatCard label="Danh mục"        value={catList.length} sub="loại tài liệu"                                 icon="🗂" color="cyan" />
      </div>

      {/* Content grid */}
      <div className={styles.contentGrid}>

        {/* Recent docs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tài liệu gần đây</span>
            {loading && <span style={{ fontSize: 12, color: "var(--text3)" }}>Đang tải...</span>}
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Tên file</th><th>Danh mục</th><th>Tin cậy</th><th>Thời gian</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 && !loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>
                  {loading ? "Đang tải..." : "Chưa có dữ liệu"}
                </td></tr>
              ) : recent.map((doc) => {
                const cat = CAT_COLORS[doc.category];
                const cls = cat ? cat.cls : "other";
                const label = doc.category || "Khác";
                const conf = doc.confidence ? Math.round(Number(doc.confidence) * 100) + "%" : "—";
                const confColor = doc.confidence
                  ? (Number(doc.confidence) >= 0.8 ? "var(--green)" : Number(doc.confidence) >= 0.6 ? "var(--amber)" : "var(--red)")
                  : "var(--text3)";
                return (
                  <tr key={doc.id}>
                    <td className={styles.docName}>{doc.fileName}</td>
                    <td><span className={`badge badge-${cls}`}>{label}</span></td>
                    <td><span style={{ fontSize: 12, fontWeight: 600, color: confColor, fontFamily: "'DM Mono',monospace" }}>{conf}</span></td>
                    <td className={styles.muted}>{formatTimeAgo(doc.processedAt)}</td>
                    <td>
                      <span className="status-dot">
                        <span className={`dot ${STATUS_DOT[doc.status] || "dot-amber"}`} />
                        {STATUS_LABEL[doc.status] || doc.status || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>

          {/* Categories từ data thật */}
          <div className="card">
            <div className="card-header"><span className="card-title">Theo danh mục</span></div>
            <div className={styles.catList}>
              {catList.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text3)", fontSize: 13 }}>
                  {loading ? "Đang tải..." : "Chưa có dữ liệu"}
                </div>
              ) : catList.map(([cat, count]) => {
                const style = CAT_COLORS[cat];
                const color = style ? style.color : "var(--text3)";
                const pct   = Math.round((count / maxCat) * 100);
                return (
                  <div key={cat} className={styles.catItem}>
                    <div className={styles.catRow}>
                      <span className={styles.catName}>{cat}</span>
                      <span className={styles.catCount}>{count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ background: color, width: 0 }} data-bar-pct={pct} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card">
            <div className="card-header"><span className="card-title">Hoạt động</span></div>
            <div className={styles.actList}>
              {docs.slice(0, 5).map((doc) => {
                const isOk = doc.status === "success" || doc.status === "uploaded";
                return (
                  <div key={doc.id} className={styles.actItem}>
                    <div className={styles.actDot} style={{ background: isOk ? "var(--green)" : doc.status === "pending" ? "var(--amber)" : "var(--red)" }} />
                    <div>
                      <div className={styles.actText}>
                        <strong>{doc.category || "Khác"}</strong> — {doc.fileName}
                      </div>
                      <div className={styles.actTime}>{formatTimeAgo(doc.processedAt)}</div>
                    </div>
                  </div>
                );
              })}
              {docs.length === 0 && !loading && (
                <div style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 13 }}>Chưa có hoạt động</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottomGrid}>

        {/* Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Tóm tắt hệ thống</span></div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Tổng đã nhận",      val: total,                                      color: "var(--accent)" },
              { label: "Xử lý thành công",   val: success,                                    color: "var(--green)" },
              { label: "Đang chờ",           val: pending,                                    color: "var(--amber)" },
              { label: "Thất bại",           val: docs.filter(d => d.status === "failed").length, color: "var(--red)" },
              { label: "Nguồn n8n_system",   val: docs.filter(d => d.source === "n8n_system").length, color: "var(--cyan)" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color, fontFamily: "'DM Mono',monospace" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline status */}
        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline</span></div>
          <div className={styles.procList}>
            {PIPELINE.map((p) => (
              <div key={p.name} className={styles.procItem}>
                <div className={styles.procIcon}>{p.icon}</div>
                <div>
                  <div className={styles.procName}>{p.name}</div>
                  <div className={styles.procMeta}>{p.meta}</div>
                </div>
                <div className={styles.procStatus}>
                  <span className={`dot ${p.statusKey === "routed" ? "dot-green" : "dot-amber"}`} />
                  <span style={{ color: p.labelColor }}>{p.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}