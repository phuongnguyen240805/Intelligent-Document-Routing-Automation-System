import { useEffect, useState } from "react";
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

export default function Reports() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAllDocuments()
      .then(d => { setDocs(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll("[data-bar-pct]").forEach(el => {
        el.style.width = el.dataset.barPct + "%";
      });
    }, 300);
    return () => clearTimeout(t);
  }, [docs]);

  const total   = docs.length;
  const success = docs.filter(d=>d.status==="success"||d.status==="uploaded").length;
  const failed  = docs.filter(d=>d.status==="failed").length;
  const review  = docs.filter(d=>d.confidence&&Number(d.confidence)<0.70).length;
  const avgConf = docs.filter(d=>d.confidence).length > 0
    ? Math.round(docs.filter(d=>d.confidence).reduce((a,d)=>a+Number(d.confidence),0)/docs.filter(d=>d.confidence).length*100)
    : 0;

  const catCounts = docs.reduce((acc,d)=>{ const c=d.category||"Khác"; acc[c]=(acc[c]||0)+1; return acc; },{});
  const catList   = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]);
  const maxCat    = catList[0]?.[1]||1;

  /* 7 ngày */
  const byDay = {};
  for (let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const key=d.toLocaleDateString("vi-VN");
    byDay[key]={total:0,success:0,label:["CN","T2","T3","T4","T5","T6","T7"][d.getDay()]};
  }
  docs.forEach(d=>{
    const key=new Date(d.processedAt).toLocaleDateString("vi-VN");
    if(byDay[key]){byDay[key].total++;if(d.status==="success"||d.status==="uploaded")byDay[key].success++;}
  });
  const dayData = Object.values(byDay);
  const maxDay  = Math.max(...dayData.map(d=>d.total),1);

  const SUMMARY = [
    {label:"Tổng tài liệu",   value:loading?"...":String(total),   color:"var(--accent)",  sub:"trong database"},
    {label:"Thành công",       value:loading?"...":String(success), color:"var(--green)",   sub:total?Math.round(success/total*100)+"%":"0%"},
    {label:"Độ chính xác TB",  value:loading?"...":avgConf+"%",     color:"var(--cyan)",    sub:"confidence AI"},
    {label:"Cần review",       value:loading?"...":String(review),  color:"var(--red)",     sub:"confidence < 70%"},
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Reports</h2>
          <p className={styles.pageDesc}>Phân tích dữ liệu thật từ PostgreSQL · {total} tài liệu</p>
        </div>
        <button className="btn" onClick={load}>⟳ Refresh</button>
      </div>

      <div className={styles.summaryGrid}>
        {SUMMARY.map(s=>(
          <div key={s.label} className={styles.summaryCard}>
            <div className={styles.summaryLabel}>{s.label}</div>
            <div className={styles.summaryValue} style={{color:s.color}}>{s.value}</div>
            <div className={styles.summarySub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",padding:40,color:"var(--text3)"}}>
          <div className={styles.spinner}/> Đang tải dữ liệu...
        </div>
      ) : (
        <>
          <div className={styles.chartsRow}>
            {/* 7 ngày */}
            <div className="card" style={{flex:1}}>
              <div className="card-header">
                <span className="card-title">Khối lượng 7 ngày qua</span>
                <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
                  <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--accent)",marginRight:4}}/>Thành công</span>
                  <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--surface3)",marginRight:4}}/>Tổng</span>
                </div>
              </div>
              <div className={styles.chartWrap}>
                <div className={styles.barChart}>
                  {dayData.map((d,i)=>(
                    <div key={i} className={styles.barGroup}>
                      <div className={styles.barStack}>
                        <div className={styles.barBg} style={{height:Math.round(d.total/maxDay*100)+"%"}}/>
                        <div className={styles.barFg} style={{height:Math.round(d.success/maxDay*100)+"%",background:"var(--accent)"}}/>
                      </div>
                      <div className={styles.barLabel}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="card" style={{flex:1}}>
              <div className="card-header"><span className="card-title">Phân bổ độ tin cậy</span></div>
              <div className={styles.chartWrap} style={{paddingTop:20}}>
                {[
                  {label:"≥ 90%",   count:docs.filter(d=>d.confidence&&Number(d.confidence)>=0.9).length,  color:"var(--green)"},
                  {label:"70–90%",  count:docs.filter(d=>d.confidence&&Number(d.confidence)>=0.7&&Number(d.confidence)<0.9).length, color:"var(--amber)"},
                  {label:"< 70%",   count:docs.filter(d=>d.confidence&&Number(d.confidence)<0.7).length,   color:"var(--red)"},
                  {label:"Không rõ",count:docs.filter(d=>!d.confidence).length,                            color:"var(--text3)"},
                ].map(row=>(
                  <div key={row.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{fontSize:12,color:"var(--text2)",width:64,flexShrink:0}}>{row.label}</div>
                    <div style={{flex:1,height:6,background:"var(--surface3)",borderRadius:3,overflow:"hidden"}}>
                      <div data-bar-pct={total?Math.round(row.count/total*100):0}
                        style={{height:"100%",borderRadius:3,background:row.color,width:0,transition:"width 1s cubic-bezier(.22,.68,0,1.2)"}}/>
                    </div>
                    <div style={{fontSize:12,color:row.color,fontFamily:"'DM Mono',monospace",width:36,textAlign:"right"}}>{row.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.bottomRow}>
            {/* Categories */}
            <div className="card">
              <div className="card-header"><span className="card-title">Phân bổ danh mục</span><span style={{fontSize:12,color:"var(--text3)"}}>Tổng {total}</span></div>
              <div className={styles.catBreakdown}>
                <div className={styles.donut}>
                  <div className={styles.donutInner}>
                    <div className={styles.donutValue}>{total}</div>
                    <div className={styles.donutLabel}>docs</div>
                  </div>
                </div>
                <div className={styles.catLegend}>
                  {catList.slice(0,6).map(([cat,count])=>(
                    <div key={cat} className={styles.catLegendItem}>
                      <div className={styles.catLegendBar}>
                        <div className={styles.catLegendLeft}>
                          <span className={styles.catLegendDot} style={{background:CAT_COLOR[cat]||"var(--text3)"}}/>
                          <span className={styles.catLegendLabel}>{cat}</span>
                        </div>
                        <div className={styles.catLegendRight}>
                          <span className={styles.catLegendCount}>{count}</span>
                          <span className={styles.catLegendPct}>{Math.round(count/total*100)}%</span>
                        </div>
                      </div>
                      <div className={styles.catTrack}>
                        <div className={styles.catFill} data-bar-pct={Math.round(count/maxCat*100)}
                          style={{background:CAT_COLOR[cat]||"var(--text3)",width:0}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tài liệu gần nhất */}
            <div className="card">
              <div className="card-header"><span className="card-title">Mới nhất</span></div>
              {docs.slice(0,8).map(doc=>{
                const conf = doc.confidence?Math.round(Number(doc.confidence)*100):null;
                const color = conf?(conf>=80?"var(--green)":conf>=60?"var(--amber)":"var(--red)"):"var(--text3)";
                return (
                  <div key={doc.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderBottom:"1px solid var(--border)"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:"var(--text)",fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.fileName}</div>
                      <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{doc.category||"Khác"} · {fmtDate(doc.processedAt)}</div>
                    </div>
                    {doc.googleDriveId&&(
                      <a href={`https://drive.google.com/file/d/${doc.googleDriveId}/view`} target="_blank" rel="noreferrer"
                        style={{color:"var(--accent)",fontSize:12,flexShrink:0}}>🔗</a>
                    )}
                    <div style={{fontSize:12,fontWeight:600,color,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{conf?conf+"%":"—"}</div>
                  </div>
                );
              })}
              {docs.length===0&&<div style={{padding:"16px 20px",color:"var(--text3)",fontSize:13}}>Chưa có dữ liệu</div>}
            </div>

            {/* Status breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Trạng thái</span></div>
              <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {label:"Thành công",   count:success, color:"var(--green)"},
                  {label:"Chờ xử lý",    count:docs.filter(d=>d.status==="pending").length,   color:"var(--amber)"},
                  {label:"Thất bại",     count:failed,  color:"var(--red)"},
                  {label:"Review (<70%)",count:review,  color:"var(--red)"},
                  {label:"n8n_system",   count:docs.filter(d=>d.source==="n8n_system").length, color:"var(--cyan)"},
                ].map(({label,count,color})=>(
                  <div key={label}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                      <span style={{color:"var(--text2)"}}>{label}</span>
                      <span style={{color,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{count}</span>
                    </div>
                    <div style={{height:4,background:"var(--surface3)",borderRadius:2,overflow:"hidden"}}>
                      <div data-bar-pct={total?Math.round(count/total*100):0}
                        style={{height:"100%",borderRadius:2,background:color,width:0,transition:"width 1s cubic-bezier(.22,.68,0,1.2)"}}/>
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