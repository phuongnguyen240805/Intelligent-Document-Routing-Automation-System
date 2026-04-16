import { useEffect, useRef } from "react";
import StatCard from "../components/StatCard";
import styles from "./Dashboard.module.css";

/* ── Static data ── */
const RECENT_DOCS = [
  { name: "Invoice_2024_001.pdf",    category: "invoice",   catLabel: "Hóa đơn",       route: "Kế toán",    time: "2 phút trước",  status: "routed" },
  { name: "Contract_NDA_Acme.docx",  category: "contract",  catLabel: "Hợp đồng",       route: "Pháp lý",    time: "5 phút trước",  status: "routed" },
  { name: "Resume_JohnDoe.pdf",      category: "hr",        catLabel: "HR",             route: "Nhân sự",    time: "8 phút trước",  status: "pending" },
  { name: "PO_2024_0891.pdf",        category: "po",        catLabel: "Purchase Order", route: "Mua hàng",   time: "12 phút trước", status: "routed" },
  { name: "Report_Q4_Summary.xlsx",  category: "report",    catLabel: "Báo cáo",        route: "Vận hành",   time: "18 phút trước", status: "routed" },
  { name: "HopDong_ThangLong.pdf",   category: "contract",  catLabel: "Hợp đồng",       route: "Pháp lý",    time: "25 phút trước", status: "review" },
];

const CATEGORIES = [
  { name: "Hóa đơn",       count: 42, pct: 85, color: "var(--accent)" },
  { name: "Hợp đồng",      count: 28, pct: 57, color: "var(--cyan)" },
  { name: "Purchase Order", count: 19, pct: 38, color: "var(--green)" },
  { name: "HR",            count: 15, pct: 30, color: "var(--accent2)" },
  { name: "Báo cáo",       count: 14, pct: 28, color: "var(--amber)" },
  { name: "Khác",          count:  6, pct: 12, color: "var(--text3)" },
];

const ACTIVITIES = [
  { color: "var(--green)", text: <><strong>OCR hoàn tất</strong> — Invoice_001.pdf</>,        time: "vừa xong" },
  { color: "var(--accent)", text: <>AI phân loại <strong>12 tài liệu</strong></>,             time: "3 phút trước" },
  { color: "var(--amber)", text: <><strong>Resume_JohnDoe</strong> cần duyệt thủ công</>,    time: "8 phút trước" },
  { color: "var(--cyan)",  text: <>Batch <strong>PO tháng 12</strong> đã route</>,           time: "14 phút trước" },
];

const WEEK_DAYS    = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEK_TOTALS  = [80, 110, 95, 140, 125, 160, 124];
const WEEK_DONE    = [70,  98, 90, 132, 118, 152, 118];

const PIPELINE = [
  { icon: "📥", name: "Schedule Trigger", meta: "Chạy mỗi 15 phút",    status: "routed",  label: "Active",  labelColor: "var(--green)" },
  { icon: "🔍", name: "OCR Engine",       meta: "Gemini Vision",        status: "routed",  label: "Ready",   labelColor: "var(--green)" },
  { icon: "🤖", name: "AI Classify",      meta: "Groq / Llama 3.3",    status: "pending", label: "Running", labelColor: "var(--amber)" },
  { icon: "📤", name: "Google Drive",     meta: "Auto-route folders",   status: "routed",  label: "Synced",  labelColor: "var(--green)" },
];

/* ── Status helpers ── */
const STATUS_DOT   = { routed: "dot-green", pending: "dot-amber", review: "dot-red" };
const STATUS_LABEL = { routed: "Đã xử lý", pending: "Chờ duyệt", review: "Cần xem lại" };

export default function Dashboard() {
  const barsRef = useRef(null);

  /* Animate bars & category fills after mount */
  useEffect(() => {
    const t = setTimeout(() => {
      /* category bars */
      document.querySelectorAll("[data-bar-pct]").forEach((el) => {
        el.style.width = el.dataset.barPct + "%";
      });
      /* volume chart */
      document.querySelectorAll("[data-bar-h]").forEach((el) => {
        el.style.height = el.dataset.barH + "px";
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const maxV = Math.max(...WEEK_TOTALS);

  return (
    <div className={styles.page}>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard label="Hôm nay"      value={124} sub="↑ 12% so với hôm qua"  subType="up"   icon="📄" color="blue" />
        <StatCard label="Đã phân loại" value={118} sub="95.2% độ chính xác"    subType="up"   icon="✓"  color="green" />
        <StatCard label="Chờ duyệt"    value={6}   sub="↑ 2 cần xem lại"       subType="down" icon="⏳" color="amber" />
        <StatCard label="Danh mục"     value={12}  sub="loại tài liệu"                         icon="🗂" color="cyan" />
      </div>

      {/* ── Content grid ── */}
      <div className={styles.contentGrid}>

        {/* Recent docs table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tài liệu gần đây</span>
            <button className="card-action">Xem tất cả →</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tài liệu</th><th>Danh mục</th><th>Định tuyến</th><th>Thời gian</th><th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_DOCS.map((doc) => (
                <tr key={doc.name}>
                  <td className={styles.docName}>{doc.name}</td>
                  <td><span className={`badge badge-${doc.category}`}>{doc.catLabel}</span></td>
                  <td className={styles.muted}>{doc.route}</td>
                  <td className={styles.muted}>{doc.time}</td>
                  <td>
                    <span className="status-dot">
                      <span className={`dot ${STATUS_DOT[doc.status]}`} />
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>

          {/* Categories */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Theo danh mục</span>
            </div>
            <div className={styles.catList}>
              {CATEGORIES.map((c) => (
                <div key={c.name} className={styles.catItem}>
                  <div className={styles.catRow}>
                    <span className={styles.catName}>{c.name}</span>
                    <span className={styles.catCount}>{c.count}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ background: c.color, width: 0 }}
                      data-bar-pct={c.pct}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Hoạt động</span>
            </div>
            <div className={styles.actList}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} className={styles.actItem}>
                  <div className={styles.actDot} style={{ background: a.color }} />
                  <div>
                    <div className={styles.actText}>{a.text}</div>
                    <div className={styles.actTime}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className={styles.bottomGrid}>

        {/* Volume chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Khối lượng 7 ngày qua</span>
            <div className={styles.legend}>
              <span><span className={styles.legendDot} style={{ background: "var(--accent)" }} />Đã xử lý</span>
              <span><span className={styles.legendDot} style={{ background: "var(--surface3)" }} />Tổng</span>
            </div>
          </div>
          <div className={styles.chartWrap} ref={barsRef}>
            {WEEK_DAYS.map((d, i) => {
              const hTotal = Math.round((WEEK_TOTALS[i] / maxV) * 80);
              const hDone  = Math.round((WEEK_DONE[i]   / maxV) * 80);
              return (
                <div key={d} className={styles.barCol}>
                  <div className={styles.barStack}>
                    <div
                      className={styles.barSeg}
                      style={{ background: "var(--surface3)", height: 0 }}
                      data-bar-h={hTotal}
                    />
                    <div
                      className={styles.barSeg}
                      style={{ background: "var(--accent)", opacity: 0.85, height: 0 }}
                      data-bar-h={hDone}
                    />
                  </div>
                  <div className={styles.barDay}>{d}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Đang xử lý</span>
            <button className="card-action">Xem log</button>
          </div>
          <div className={styles.procList}>
            {PIPELINE.map((p) => (
              <div key={p.name} className={styles.procItem}>
                <div className={styles.procIcon}>{p.icon}</div>
                <div>
                  <div className={styles.procName}>{p.name}</div>
                  <div className={styles.procMeta}>{p.meta}</div>
                </div>
                <div className={styles.procStatus}>
                  <span className={`dot ${STATUS_DOT[p.status]}`} />
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
