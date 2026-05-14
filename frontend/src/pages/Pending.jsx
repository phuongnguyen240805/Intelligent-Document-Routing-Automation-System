import { useState, useEffect, useCallback } from "react";
import { getAllDocuments, BASE_URL } from "../services/api";
import styles from "./Pending.module.css";

const ALL_CATS = [
  { value:"Hóa đơn",     label:"Hóa đơn",     bg:"#4f7bff18", text:"#7fa3ff" },
  { value:"Hợp đồng",    label:"Hợp đồng",     bg:"#22d4f018", text:"#22d4f0" },
  { value:"CV / Resume", label:"CV / Resume",  bg:"#7c5fff18", text:"#a080ff" },
  { value:"Biên nhận",   label:"Biên nhận",    bg:"#ff5c5c18", text:"#ff8080" },
  { value:"Báo cáo",     label:"Báo cáo",      bg:"#f5a62318", text:"#f5a623" },
  { value:"Khác",        label:"Khác",         bg:"#ffffff10", text:"#8b90a8" },
];
const CAT_MAP = Object.fromEntries(ALL_CATS.map(c => [c.value, c]));
const getCat  = c => CAT_MAP[c] || { label:c||"Khác", bg:"#ffffff10", text:"#8b90a8" };

const DONE_STATUSES = ["approved","rejected","success","uploaded","failed"];

const fmtDate = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN")+" "+d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
};

function ConfBadge({ value }) {
  if (!value) return <span style={{color:"var(--text3)",fontSize:12}}>—</span>;
  const p = Math.round(Number(value)*100);
  const c = p>=80?"var(--green)":p>=60?"var(--amber)":"var(--red)";
  return <span style={{color:c,fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{p}%</span>;
}

async function patchDocument(id, status, category) {
  const res = await fetch(`${BASE_URL}/files/${id}`, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status, category}),
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error||`HTTP ${res.status}`);
  }
  return res.json();
}

export default function Pending({ onResolved }) {
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [items,      setItems]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [overrides,  setOverrides]  = useState({});
  const [processing, setProcessing] = useState({});
  const [resolved,   setResolved]   = useState([]);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    getAllDocuments()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const pending = arr.filter(d => {
          /* Bỏ qua nếu đã xử lý xong */
          if (DONE_STATUSES.includes(d.status)) return false;
          if (d.status === "pending") return true;
          if (d.confidence !== null && d.confidence !== undefined && Number(d.confidence) < 0.70) return true;
          return false;
        });
        setItems(pending);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedItem = items.find(i => i.id === selected);

  const approve = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item || processing[id]) return;
    const finalCat = overrides[id] || item.category;
    setProcessing(p => ({...p,[id]:true}));
    try {
      await patchDocument(id, "approved", finalCat);
      setResolved(p => [...p, {...item, action:"approved", finalCat}]);
      setItems(p => p.filter(i => i.id !== id));
      if (selected === id) setSelected(null);
      onResolved?.(); /* Cập nhật badge count ở Sidebar */
    } catch(e) {
      setError(`Duyệt thất bại: ${e.message}`);
    } finally {
      setProcessing(p => { const n={...p}; delete n[id]; return n; });
    }
  };

  const reject = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item || processing[id]) return;
    setProcessing(p => ({...p,[id]:true}));
    try {
      await patchDocument(id, "rejected", item.category);
      setResolved(p => [...p, {...item, action:"rejected"}]);
      setItems(p => p.filter(i => i.id !== id));
      if (selected === id) setSelected(null);
      onResolved?.();
    } catch(e) {
      setError(`Từ chối thất bại: ${e.message}`);
    } finally {
      setProcessing(p => { const n={...p}; delete n[id]; return n; });
    }
  };

  const driveUrl = id => id ? `https://drive.google.com/file/d/${id}/view` : null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Pending Review</h2>
          <p className={styles.pageDesc}>
            {loading
              ? "Đang tải..."
              : `${items.length} tài liệu cần xem lại${resolved.length>0?` · ${resolved.length} đã xử lý`:""}`
            }
          </p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn" onClick={load}>⟳ Refresh</button>
          {!loading && items.length > 0 && (
            <>
              <button className="btn" onClick={()=>items.forEach(i=>reject(i.id))}>✕ Từ chối tất cả</button>
              <button className="btn btn-primary" onClick={()=>items.forEach(i=>approve(i.id))}>✓ Duyệt tất cả</button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          ⚠ {error}
          <button className={styles.retryBtn} onClick={()=>{setError(null);load();}}>Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingBox}><div className={styles.spinner}/> Đang tải từ backend...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <div className={styles.emptyTitle}>Không có gì cần duyệt</div>
          <div className={styles.emptyDesc}>{resolved.length>0?`${resolved.length} tài liệu đã xử lý`:"Tất cả tài liệu đều ổn"}</div>
          <button className="btn" style={{marginTop:16}} onClick={load}>⟳ Tải lại</button>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.listCol}>
            {items.map(item => {
              const cat    = getCat(overrides[item.id]||item.category);
              const isProc = !!processing[item.id];
              return (
                <div key={item.id}
                  className={`${styles.itemCard} ${selected===item.id?styles.itemCardActive:""} ${isProc?styles.itemCardProcessing:""}`}
                  onClick={()=>!isProc&&setSelected(selected===item.id?null:item.id)}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemName}>{item.fileName}</div>
                    {isProc?<div className={styles.spinner}/>:<ConfBadge value={item.confidence}/>}
                  </div>
                  <div className={styles.itemMeta}>
                    <span className="badge" style={{background:cat.bg,color:cat.text}}>{cat.label}</span>
                    {item.reason&&<span className={styles.itemReason}>{item.reason.slice(0,70)}{item.reason.length>70?"...":""}</span>}
                    <span className={styles.itemDate}>{fmtDate(item.processedAt)}</span>
                  </div>
                  <div className={styles.itemActions} onClick={e=>e.stopPropagation()}>
                    <select className={styles.catSelect} disabled={isProc}
                      value={overrides[item.id]||item.category||"Khác"}
                      onChange={e=>setOverrides(p=>({...p,[item.id]:e.target.value}))}>
                      {ALL_CATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <button className={styles.rejectBtn}  disabled={isProc} onClick={()=>reject(item.id)}>{isProc?"...":"✕ Từ chối"}</button>
                    <button className={styles.approveBtn} disabled={isProc} onClick={()=>approve(item.id)}>{isProc?"...":"✓ Duyệt"}</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.detailCol}>
            {selectedItem ? (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Chi tiết</span>
                  {processing[selectedItem.id]&&<div className={styles.spinner}/>}
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailName}>{selectedItem.fileName}</div>
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>AI phân loại</div>
                    {[
                      ["Danh mục",  (()=>{const c=getCat(selectedItem.category);return <span className="badge" style={{background:c.bg,color:c.text}}>{c.label}</span>;})()],
                      ["Độ tin cậy",<ConfBadge value={selectedItem.confidence}/>],
                      ["File type", selectedItem.fileType||"—"],
                      ["Nguồn",     selectedItem.source||"—"],
                      ["Thời gian", fmtDate(selectedItem.processedAt)],
                      ["Status",    selectedItem.status||"—"],
                      ["Drive ID",  <code style={{fontSize:10,color:"var(--text3)",wordBreak:"break-all"}}>{selectedItem.googleDriveId||"—"}</code>],
                    ].map(([label,val])=>(
                      <div key={label} className={styles.detailRow}><span>{label}</span><span>{val}</span></div>
                    ))}
                  </div>
                  {selectedItem.reason&&(
                    <div className={styles.previewBox}>
                      <div className={styles.previewLabel}>Lý do AI</div>
                      <div className={styles.previewText}>{selectedItem.reason}</div>
                    </div>
                  )}
                  <div className={styles.overrideSection}>
                    <div className={styles.detailSectionTitle}>Phân loại thủ công</div>
                    <select className={styles.catSelectLarge}
                      disabled={!!processing[selectedItem.id]}
                      value={overrides[selectedItem.id]||selectedItem.category||"Khác"}
                      onChange={e=>setOverrides(p=>({...p,[selectedItem.id]:e.target.value}))}>
                      {ALL_CATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {selectedItem.googleDriveId&&(
                    <a href={driveUrl(selectedItem.googleDriveId)} target="_blank" rel="noreferrer"
                      className="btn" style={{textDecoration:"none",textAlign:"center"}}>🔗 Mở Google Drive</a>
                  )}
                  <div className={styles.detailButtons}>
                    <button className={styles.rejectBtnLg} disabled={!!processing[selectedItem.id]} onClick={()=>reject(selectedItem.id)}>
                      {processing[selectedItem.id]?"Đang xử lý...":"✕ Từ chối"}
                    </button>
                    <button className={styles.approveBtnLg} disabled={!!processing[selectedItem.id]} onClick={()=>approve(selectedItem.id)}>
                      {processing[selectedItem.id]?"Đang xử lý...":"✓ Duyệt"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noSelect}><div style={{fontSize:32,marginBottom:8}}>👆</div><div>Chọn tài liệu để xem chi tiết</div></div>
            )}

            {resolved.length>0&&(
              <div className="card" style={{marginTop:16}}>
                <div className="card-header"><span className="card-title">Đã xử lý ({resolved.length})</span></div>
                {resolved.slice(-6).reverse().map((r,i)=>(
                  <div key={i} className={styles.resolvedItem}>
                    <span className={`dot ${r.action==="approved"?"dot-green":"dot-red"}`}/>
                    <span className={styles.resolvedName}>{r.fileName}</span>
                    <span style={{fontSize:11,color:r.action==="approved"?"var(--green)":"var(--red)",marginLeft:"auto",flexShrink:0}}>
                      {r.action==="approved"?"✓ Duyệt":"✕ Từ chối"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}