import { useEffect, useRef, useState } from "react";
import { getAllDocuments } from "../services/api";
import styles from "./Reports.module.css";

const CAT_COLOR = {
  "Hóa đơn":     "var(--accent)",
  "Hợp đồng":    "var(--cyan)",
  "CV / Resume": "var(--accent2)",
  "Biên nhận":   "var(--red)",
  "Báo cáo":     "var(--amber)",
  "Khác":        "var(--text3)",
};

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("vi-VN") : "—";

const MAX_H = 100; // chiều cao tối đa bar tính bằng px

/* Bộ lọc thời gian */
const PERIODS = [
  { label: "7 ngày", value: 7  },
  { label: "1 tháng", value: 30 },
];

function buildDayData(docs, days) {
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("vi-VN");
    const dow = d.getDay(); // 0=CN,1=T2,...
    const short = days <= 7
      ? ["CN","T2","T3","T4","T5","T6","T7"][dow]
      : `${d.getDate()}/${d.getMonth()+1}`;
    map[key] = { total: 0, success: 0, label: short };
  }
  docs.forEach(d => {
    const key = new Date(d.processedAt).toLocaleDateString("vi-VN");
    if (map[key]) {
      map[key].total++;
      if (d.status === "success" || d.status === "uploaded") map[key].success++;
    }
  });
  return Object.values(map);
}

/* Component bar chart dùng px — fix lỗi height % không hiển thị */
function BarChart({ data }) {
  const ref = useRef(null);
  const maxVal = Math.max(...data.map(d => d.total), 1);

  useEffect(() => {
    if (!ref.current) return;
    // reset về 0
    ref.current.querySelectorAll("[data-bg],[data-fg]").forEach(el => {
      el.style.height = "0px";
    });
    const t = setTimeout(() => {
      ref.current.querySelectorAll("[data-bg]").forEach(el => {
        const v = Number(el.dataset.bg);
        el.style.height = Math.round(v / maxVal * MAX_H) + "px";
      });
      ref.current.querySelectorAll("[data-fg]").forEach(el => {
        const v = Number(el.dataset.fg);
        el.style.height = Math.round(v / maxVal * MAX_H) + "px";
      });
    }, 100);
    return () => clearTimeout(t);
  }, [data, maxVal]);

  return (
    <div ref={ref} style={{ display:"flex", alignItems:"flex-end", gap:6, height: MAX_H + 20, padding:"0 20px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ position:"relative", width:"100%", height: MAX_H, display:"flex", alignItems:"flex-end" }}>
            {/* tổng (bg) */}
            <div
              data-bg={d.total}
              style={{
                position:"absolute", bottom:0, width:"100%",
                background:"var(--surface3)", borderRadius:"3px 3px 0 0",
                height:0, transition:"height 0.7s cubic-bezier(.22,.68,0,1.2)",
              }}
            />
            {/* thành công (fg) */}
            <div
              data-fg={d.success}
              style={{
                position:"absolute", bottom:0, width:"100%",
                background:"var(--accent)", opacity:0.9, borderRadius:"3px 3px 0 0",
                height:0, transition:"height 0.7s cubic-bezier(.22,.68,0,1.2)",
              }}
            />
          </div>
          <div style={{ fontSize: data.length > 15 ? 9 : 10, color:"var(--text3)", whiteSpace:"nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState(7); // 7 hoặc 30

  const load = () => {
    setLoading(true);
    getAllDocuments()
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  /* Animate horizontal bars (category + status) */
  const hBarsRef = useRef(null);
  useEffect(() => {
    if (!hBarsRef.current) return;
    const bars = hBarsRef.current.querySelectorAll("[data-bar-pct]");
    bars.forEach(b => { b.style.width = "0%"; });
    const t = setTimeout(() => {
      bars.forEach(b => { b.style.width = b.dataset.barPct + "%"; });
    }, 100);
    return () => clearTimeout(t);
  }, [docs]);

  /* Stats */
  const total   = docs.length;
  const success = docs.filter(d => d.status === "success" || d.status === "uploaded").length;
  const failed  = docs.filter(d => d.status === "failed").length;
  const DONE    = ["approved","rejected","success","uploaded","failed"];
  const review  = docs.filter(d => !DONE.includes(d.status) && d.confidence && Number(d.confidence) < 0.70).length;
  const pending = docs.filter(d => d.status === "pending").length;
  const avgConf = (() => {
    const w = docs.filter(d => d.confidence);
    if (!w.length) return 0;
    return Math.round(w.reduce((a, d) => a + Number(d.confidence), 0) / w.length * 100);
  })();

  /* Lọc docs theo period để tính dayData */
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  const periodDocs = docs.filter(d => new Date(d.processedAt) >= cutoff);

  const dayData = buildDayData(periodDocs, period);

  /* Categories */
  const catCounts = docs.reduce((acc, d) => {
    const c = d.category || "Khác"; acc[c] = (acc[c]||0)+1; return acc;
  }, {});
  const catList = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
  const maxCat  = catList[0]?.[1] || 1;

  const SUMMARY = [
    { label:"Tổng tài liệu",   value: total,      color:"var(--accent)",  sub:"trong database" },
    { label:"Thành công",       value: success,    color:"var(--green)",   sub: total ? Math.round(success/total*100)+"%" : "0%" },
    { label:"Độ chính xác TB",  value: avgConf+"%",color:"var(--cyan)",    sub:"confidence AI" },
    { label:"Cần review",       value: review,     color:"var(--red)",     sub:"confidence < 70%" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Reports</h2>
          <p className={styles.pageDesc}>Dữ liệu thật từ PostgreSQL · {total} tài liệu</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="btn" onClick={load}>⟳ Refresh</button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        {SUMMARY.map(s => (
          <div key={s.label} className={styles.summaryCard}>
            <div className={styles.summaryLabel}>{s.label}</div>
            <div className={styles.summaryValue} style={{ color:s.color }}>
              {loading ? "..." : s.value}
            </div>
            <div className={styles.summarySub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", padding:48, color:"var(--text3)" }}>
          <div className={styles.spinner} /> Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className={styles.chartsRow}>

            {/* Biểu đồ khối lượng — có bộ lọc 7 ngày / 1 tháng */}
            <div className="card" style={{ flex:1 }}>
              <div className="card-header">
                <span className="card-title">Khối lượng theo ngày</span>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {/* Toggle period */}
                  <div className={styles.periodToggle}>
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        className={`${styles.periodBtn} ${period === p.value ? styles.periodBtnActive : ""}`}
                        onClick={() => setPeriod(p.value)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:12, color:"var(--text3)" }}>
                    <span><span style={{ display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--accent)",marginRight:4 }}/>Thành công</span>
                    <span><span style={{ display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--surface3)",marginRight:4 }}/>Tổng</span>
                  </div>
                </div>
              </div>
              {/* Số liệu mini */}
              <div style={{ display:"flex", gap:16, padding:"10px 20px 0", borderBottom:"1px solid var(--border)" }}>
                {[
                  { label:"Tổng kỳ", val: periodDocs.length, color:"var(--text)" },
                  { label:"Thành công", val: periodDocs.filter(d=>d.status==="success"||d.status==="uploaded").length, color:"var(--green)" },
                  { label:"Ngày cao nhất", val: Math.max(...dayData.map(d=>d.total), 0), color:"var(--accent)" },
                ].map(s => (
                  <div key={s.label} style={{ paddingBottom:10 }}>
                    <div style={{ fontSize:18, fontWeight:600, color:s.color, fontFamily:"'DM Mono',monospace", letterSpacing:-0.5 }}>{s.val}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <BarChart data={dayData} />
            </div>

            {/* Confidence distribution */}
            <div className="card" style={{ flex:1 }}>
              <div className="card-header"><span className="card-title">Phân bổ độ tin cậy</span></div>
              <div style={{ padding:"20px 20px 16px" }}>
                {[
                  { label:"≥ 90%",    count: docs.filter(d=>d.confidence&&Number(d.confidence)>=0.9).length,                                                    color:"var(--green)"  },
                  { label:"70–90%",   count: docs.filter(d=>d.confidence&&Number(d.confidence)>=0.7&&Number(d.confidence)<0.9).length,                          color:"var(--amber)"  },
                  { label:"< 70%",    count: docs.filter(d=>d.confidence&&Number(d.confidence)<0.7).length,                                                      color:"var(--red)"    },
                  { label:"Không rõ", count: docs.filter(d=>!d.confidence).length,                                                                               color:"var(--text3)"  },
                ].map(row => (
                  <div key={row.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <div style={{ fontSize:12, color:"var(--text2)", width:64, flexShrink:0 }}>{row.label}</div>
                    <div style={{ flex:1, height:6, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
                      <div data-bar-pct={total ? Math.round(row.count/total*100) : 0}
                        style={{ height:"100%", borderRadius:3, background:row.color, width:0, transition:"width 1s cubic-bezier(.22,.68,0,1.2)" }}
                      />
                    </div>
                    <div style={{ fontSize:12, color:row.color, fontFamily:"'DM Mono',monospace", width:28, textAlign:"right" }}>{row.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className={styles.bottomRow} ref={hBarsRef}>

            {/* Categories */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Phân bổ danh mục</span>
                <span style={{ fontSize:12, color:"var(--text3)" }}>Tổng {total}</span>
              </div>
              <div className={styles.catBreakdown}>
                <div className={styles.donut}>
                  <div className={styles.donutInner}>
                    <div className={styles.donutValue}>{total}</div>
                    <div className={styles.donutLabel}>docs</div>
                  </div>
                </div>
                <div className={styles.catLegend}>
                  {catList.slice(0,6).map(([cat,count]) => (
                    <div key={cat} className={styles.catLegendItem}>
                      <div className={styles.catLegendBar}>
                        <div className={styles.catLegendLeft}>
                          <span className={styles.catLegendDot} style={{ background:CAT_COLOR[cat]||"var(--text3)" }}/>
                          <span className={styles.catLegendLabel}>{cat}</span>
                        </div>
                        <div className={styles.catLegendRight}>
                          <span className={styles.catLegendCount}>{count}</span>
                          <span className={styles.catLegendPct}>{Math.round(count/total*100)}%</span>
                        </div>
                      </div>
                      <div className={styles.catTrack}>
                        <div className={styles.catFill}
                          data-bar-pct={Math.round(count/maxCat*100)}
                          style={{ background:CAT_COLOR[cat]||"var(--text3)", width:0 }}
                        />
                      </div>
                    </div>
                  ))}
                  {catList.length === 0 && <div style={{ color:"var(--text3)", fontSize:13 }}>Chưa có dữ liệu</div>}
                </div>
              </div>
            </div>

            {/* Tài liệu mới nhất */}
            <div className="card">
              <div className="card-header"><span className="card-title">Mới nhất</span></div>
              {docs.length === 0
                ? <div style={{ padding:"16px 20px", color:"var(--text3)", fontSize:13 }}>Chưa có dữ liệu</div>
                : docs.slice(0,8).map(doc => {
                  const conf  = doc.confidence ? Math.round(Number(doc.confidence)*100) : null;
                  const color = conf ? (conf>=80?"var(--green)":conf>=60?"var(--amber)":"var(--red)") : "var(--text3)";
                  return (
                    <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:"var(--text)", fontFamily:"'DM Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.fileName}</div>
                        <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{doc.category||"Khác"} · {fmtDate(doc.processedAt)}</div>
                      </div>
                      {doc.googleDriveId && (
                        <a href={`https://drive.google.com/file/d/${doc.googleDriveId}/view`} target="_blank" rel="noreferrer"
                          style={{ color:"var(--accent)", fontSize:12, flexShrink:0 }}>🔗</a>
                      )}
                      <div style={{ fontSize:12, fontWeight:600, color, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{conf?conf+"%":"—"}</div>
                    </div>
                  );
                })
              }
            </div>

            {/* Status breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Trạng thái</span></div>
              <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { label:"Thành công",   count:success,                                                        color:"var(--green)"  },
                  { label:"Chờ xử lý",    count:pending,                                                        color:"var(--amber)"  },
                  { label:"Cần review",   count:review,                                                         color:"var(--red)"    },
                  { label:"Thất bại",     count:failed,                                                         color:"var(--red)"    },
                  { label:"n8n_system",   count:docs.filter(d=>d.source==="n8n_system").length,                  color:"var(--cyan)"   },
                ].map(({ label,count,color }) => (
                  <div key={label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                      <span style={{ color:"var(--text2)" }}>{label}</span>
                      <span style={{ color, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{count}</span>
                    </div>
                    <div style={{ height:4, background:"var(--surface3)", borderRadius:2, overflow:"hidden" }}>
                      <div data-bar-pct={total ? Math.round(count/total*100) : 0}
                        style={{ height:"100%", borderRadius:2, background:color, width:0, transition:"width 1s cubic-bezier(.22,.68,0,1.2)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}