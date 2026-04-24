import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getAllDocuments } from "../services/api";
import styles from "./Dashboard.module.css";

/* Categories khớp với n8n workflow thật */
const CAT_COLOR = {
  "Hóa đơn":      { color:"var(--accent)",  cls:"invoice"  },
  "Hợp đồng":     { color:"var(--cyan)",    cls:"contract" },
  "CV / Resume":  { color:"var(--accent2)", cls:"hr"       },
  "Biên nhận":    { color:"var(--red)",     cls:"receipt"  },
  "Báo cáo":      { color:"var(--amber)",   cls:"report"   },
  "Khác":         { color:"var(--text3)",   cls:"other"    },
};

const STATUS_DOT   = { success:"dot-green", pending:"dot-amber", failed:"dot-red", uploaded:"dot-green" };
const STATUS_LABEL = { success:"Thành công", pending:"Chờ xử lý", failed:"Thất bại", uploaded:"Đã upload" };

function timeAgo(iso) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h/24)} ngày trước`;
}

function getCat(category) {
  return CAT_COLOR[category] || { color:"var(--text3)", cls:"other" };
}

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDocuments()
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total   = docs.length;
  const success = docs.filter(d => d.status === "success" || d.status === "uploaded").length;
  const pending = docs.filter(d => d.status === "pending").length;
  const review  = docs.filter(d => d.confidence && Number(d.confidence) < 0.70).length;

  const catCounts = docs.reduce((acc, d) => {
    const c = d.category || "Khác"; acc[c] = (acc[c]||0)+1; return acc;
  }, {});
  const catList = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCat  = catList[0]?.[1] || 1;

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll("[data-bar-pct]").forEach(el => {
        el.style.width = el.dataset.barPct + "%";
      });
    }, 400);
    return () => clearTimeout(t);
  }, [catList.length]);

  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <StatCard label="Tổng tài liệu"    value={total}   sub={loading?"Đang tải...":"trong hệ thống"}    icon="📄" color="blue"/>
        <StatCard label="Thành công"        value={success} sub={total?Math.round(success/total*100)+"%":"0%"} icon="✓"  color="green"/>
        <StatCard label="Chờ xử lý"        value={pending} sub="cần xử lý"                                  icon="⏳" color="amber"/>
        <StatCard label="Cần review"        value={review}  sub="confidence < 70%"                           icon="👁" color="red"/>
      </div>

      <div className={styles.contentGrid}>
        {/* Recent docs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tài liệu gần đây</span>
            {loading && <span style={{fontSize:12,color:"var(--text3)"}}>Đang tải...</span>}
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Tên file</th><th>Danh mục</th><th>Tin cậy</th><th>Thời gian</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {docs.length === 0 && !loading && (
                <tr><td colSpan={5} className={styles.empty}>Chưa có dữ liệu từ backend</td></tr>
              )}
              {docs.slice(0,8).map(doc => {
                const cat = getCat(doc.category);
                const conf = doc.confidence ? Math.round(Number(doc.confidence)*100) : null;
                const confColor = conf ? (conf>=80?"var(--green)":conf>=60?"var(--amber)":"var(--red)") : "var(--text3)";
                return (
                  <tr key={doc.id}>
                    <td className={styles.docName}>{doc.fileName}</td>
                    <td><span className={`badge badge-${cat.cls}`}>{doc.category||"Khác"}</span></td>
                    <td><span style={{fontSize:12,fontWeight:600,color:confColor,fontFamily:"'DM Mono',monospace"}}>{conf?conf+"%":"—"}</span></td>
                    <td className={styles.muted}>{timeAgo(doc.processedAt)}</td>
                    <td>
                      <span className="status-dot">
                        <span className={`dot ${STATUS_DOT[doc.status]||"dot-amber"}`}/>
                        {STATUS_LABEL[doc.status]||doc.status||"—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right */}
        <div className={styles.rightPanel}>
          <div className="card">
            <div className="card-header"><span className="card-title">Theo danh mục</span></div>
            <div className={styles.catList}>
              {catList.length === 0
                ? <div style={{padding:16,color:"var(--text3)",fontSize:13}}>{loading?"Đang tải...":"Chưa có dữ liệu"}</div>
                : catList.map(([cat,count]) => {
                  const { color } = getCat(cat);
                  return (
                    <div key={cat} className={styles.catItem}>
                      <div className={styles.catRow}>
                        <span className={styles.catName}>{cat}</span>
                        <span className={styles.catCount}>{count}</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill}
                          style={{background:color,width:0}}
                          data-bar-pct={Math.round(count/maxCat*100)}/>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Hoạt động</span></div>
            <div className={styles.actList}>
              {docs.slice(0,5).map(doc => {
                const ok = doc.status==="success"||doc.status==="uploaded";
                return (
                  <div key={doc.id} className={styles.actItem}>
                    <div className={styles.actDot} style={{background:ok?"var(--green)":doc.status==="pending"?"var(--amber)":"var(--red)"}}/>
                    <div>
                      <div className={styles.actText}><strong>{doc.category||"Khác"}</strong> — {doc.fileName}</div>
                      <div className={styles.actTime}>{timeAgo(doc.processedAt)}</div>
                    </div>
                  </div>
                );
              })}
              {docs.length===0&&!loading&&<div style={{padding:"12px 16px",color:"var(--text3)",fontSize:13}}>Chưa có hoạt động</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottomGrid}>
        <div className="card">
          <div className="card-header"><span className="card-title">Tóm tắt</span></div>
          <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:0}}>
            {[
              {label:"Tổng nhận",       val:total,                                            color:"var(--accent)"},
              {label:"Thành công",      val:success,                                          color:"var(--green)"},
              {label:"Đang chờ",        val:pending,                                          color:"var(--amber)"},
              {label:"Thất bại",        val:docs.filter(d=>d.status==="failed").length,       color:"var(--red)"},
              {label:"Nguồn n8n",       val:docs.filter(d=>d.source==="n8n_system").length,   color:"var(--cyan)"},
              {label:"Cần review (<70%)",val:review,                                          color:"var(--red)"},
            ].map(({label,val,color})=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:13,color:"var(--text2)"}}>{label}</span>
                <span style={{fontSize:15,fontWeight:600,color,fontFamily:"'DM Mono',monospace"}}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline n8n</span></div>
          <div className={styles.procList}>
            {[
              {icon:"📥", name:"Schedule Trigger", meta:"Quét Email INBOX",    color:"var(--accent)",  label:"Active",  dot:"dot-green"},
              {icon:"🔍", name:"OCR Engine",        meta:"Gemini Vision",       color:"var(--cyan)",    label:"Ready",   dot:"dot-green"},
              {icon:"🤖", name:"AI Classify",       meta:"Groq / Llama 3.3",   color:"var(--accent2)", label:"Running", dot:"dot-amber"},
              {icon:"📂", name:"Document Routing",  meta:"6 thư mục + Review", color:"var(--green)",   label:"Active",  dot:"dot-green"},
              {icon:"📊", name:"Log to Sheets",     meta:"Google Sheets",      color:"var(--amber)",   label:"Synced",  dot:"dot-green"},
              {icon:"🗄", name:"Insert Database",   meta:"PostgreSQL",         color:"var(--text3)",   label:"Online",  dot:"dot-green"},
            ].map(p=>(
              <div key={p.name} className={styles.procItem}>
                <div className={styles.procIcon} style={{background:p.color+"18"}}>{p.icon}</div>
                <div>
                  <div className={styles.procName}>{p.name}</div>
                  <div className={styles.procMeta}>{p.meta}</div>
                </div>
                <div className={styles.procStatus}>
                  <span className={`dot ${p.dot}`}/><span style={{color:p.dot==="dot-green"?"var(--green)":"var(--amber)"}}>{p.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}