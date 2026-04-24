import { useState, useMemo, useEffect } from "react";
import { getAllDocuments } from "../services/api";
import styles from "./Documents.module.css";

/* Categories thật từ n8n workflow */
const CAT_STYLE = {
  "Hóa đơn":     { cls:"invoice",  label:"Hóa đơn"     },
  "Hợp đồng":    { cls:"contract", label:"Hợp đồng"     },
  "CV / Resume": { cls:"hr",       label:"CV / Resume"  },
  "Biên nhận":   { cls:"receipt",  label:"Biên nhận"    },
  "Báo cáo":     { cls:"report",   label:"Báo cáo"      },
  "Khác":        { cls:"other",    label:"Khác"         },
};
const getCat = (c) => CAT_STYLE[c] || { cls:"other", label:c||"Khác" };

const CATEGORIES = ["Tất cả","Hóa đơn","Hợp đồng","CV / Resume","Biên nhận","Báo cáo","Khác"];
const STATUSES   = ["Tất cả","Thành công","Chờ xử lý","Thất bại"];
const STATUS_MAP = {"Thành công":"success","Chờ xử lý":"pending","Thất bại":"failed"};
const STATUS_DOT   = {success:"dot-green",pending:"dot-amber",failed:"dot-red",uploaded:"dot-green"};
const STATUS_LABEL = {success:"Thành công",pending:"Chờ xử lý",failed:"Thất bại",uploaded:"Đã upload"};

function FileIcon({fileType}) {
  if (!fileType) return <span>📁</span>;
  if (fileType.includes("pdf"))   return <span>📄</span>;
  if (fileType.includes("word")||fileType.includes("docx")) return <span>📝</span>;
  if (fileType.includes("sheet")||fileType.includes("xlsx")) return <span>📊</span>;
  if (fileType.includes("image")) return <span>🖼</span>;
  return <span>📁</span>;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN")+" "+d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
}

export default function Documents() {
  const [docs,   setDocs]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [error,  setError]  = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter,setCatFilter]=useState("Tất cả");
  const [statusFilter,setStatusFilter]=useState("Tất cả");
  const [selected, setSelected]=useState(null);
  const [page,setPage]=useState(1);
  const PER=10;

  const load = () => {
    setLoading(true); setError(null);
    getAllDocuments()
      .then(d=>{setDocs(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(e=>{setError(e.message);setLoading(false);});
  };
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>docs.filter(d=>{
    const matchS = (d.fileName||"").toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter==="Tất cả"
      ? true
      : catFilter==="Khác"
        ? !CAT_STYLE[d.category]
        : d.category===catFilter;
    const matchSt = statusFilter==="Tất cả" || d.status===STATUS_MAP[statusFilter];
    return matchS&&matchC&&matchSt;
  }),[docs,search,catFilter,statusFilter]);

  const pages    = Math.ceil(filtered.length/PER);
  const paginated= filtered.slice((page-1)*PER, page*PER);
  const setF=(setter,v)=>{setter(v);setPage(1);};
  const selectedDoc = docs.find(d=>d.id===selected);
  const driveUrl = (id) => id?`https://drive.google.com/file/d/${id}/view`:null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tài liệu</h2>
          <p className={styles.pageDesc}>{loading?"Đang tải...":`${filtered.length} / ${docs.length} tài liệu`}</p>
        </div>
        <button className="btn" onClick={load}>⟳ Refresh</button>
      </div>

      {error&&<div className={styles.errorBox}>⚠ {error} <button className={styles.retryBtn} onClick={load}>Thử lại</button></div>}

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <input className={styles.search} placeholder="Tìm tên file..." value={search}
            onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          {search&&<button className={styles.searchClear} onClick={()=>setSearch("")}>✕</button>}
        </div>
        <div className={styles.pills}>
          {CATEGORIES.map(c=>(
            <button key={c} className={`${styles.pill} ${catFilter===c?styles.pillActive:""}`}
              onClick={()=>setF(setCatFilter,c)}>{c}</button>
          ))}
        </div>
        <select className={styles.select} value={statusFilter}
          onChange={e=>setF(setStatusFilter,e.target.value)}>
          {STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className={styles.loadingRow}><div className={styles.spinner}/> Đang tải dữ liệu từ backend...</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead><tr><th style={{width:28}}></th><th>Tên file</th><th>Danh mục</th><th>Tin cậy</th><th>Nguồn</th><th>Thời gian</th><th>Trạng thái</th><th style={{width:36}}></th></tr></thead>
              <tbody>
                {paginated.length===0
                  ? <tr><td colSpan={8} className={styles.empty}>Không tìm thấy tài liệu nào</td></tr>
                  : paginated.map(doc=>{
                    const cat=getCat(doc.category);
                    const conf=doc.confidence?Math.round(Number(doc.confidence)*100):null;
                    const confColor=conf?(conf>=80?"var(--green)":conf>=60?"var(--amber)":"var(--red)"):"var(--text3)";
                    return (
                      <tr key={doc.id} className={selected===doc.id?styles.rowSelected:""}
                        onClick={()=>setSelected(selected===doc.id?null:doc.id)}>
                        <td><FileIcon fileType={doc.fileType}/></td>
                        <td><div className={styles.docName}>{doc.fileName}</div><div className={styles.docMeta}>{doc.fileType||"—"}</div></td>
                        <td><span className={`badge badge-${cat.cls}`}>{cat.label}</span></td>
                        <td><span style={{fontSize:12,fontWeight:600,color:confColor,fontFamily:"'DM Mono',monospace"}}>{conf?conf+"%":"—"}</span></td>
                        <td className={styles.muted}>{doc.source||"—"}</td>
                        <td className={styles.muted}>{fmtDate(doc.processedAt)}</td>
                        <td><span className="status-dot"><span className={`dot ${STATUS_DOT[doc.status]||"dot-amber"}`}/>{STATUS_LABEL[doc.status]||doc.status||"—"}</span></td>
                        <td>{doc.googleDriveId&&(
                          <a href={driveUrl(doc.googleDriveId)} target="_blank" rel="noreferrer"
                            className={styles.actionBtn} title="Mở Google Drive" onClick={e=>e.stopPropagation()}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 2h4v4M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </a>
                        )}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
            {pages>1&&(
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>{(page-1)*PER+1}–{Math.min(page*PER,filtered.length)} / {filtered.length}</span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Trước</button>
                  {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                    <button key={p} className={`${styles.pageBtn} ${p===page?styles.pageBtnActive:""}`} onClick={()=>setPage(p)}>{p}</button>
                  ))}
                  <button className={styles.pageBtn} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Sau →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedDoc&&(
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <FileIcon fileType={selectedDoc.fileType}/>
            <div className={styles.drawerTitle}>{selectedDoc.fileName}</div>
            <button className={styles.drawerClose} onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className={styles.drawerBody}>
            {[
              ["Danh mục",  (()=>{const c=getCat(selectedDoc.category);return <span className={`badge badge-${c.cls}`}>{c.label}</span>;})()],
              ["Độ tin cậy", selectedDoc.confidence?<span style={{color:Number(selectedDoc.confidence)>=0.8?"var(--green)":Number(selectedDoc.confidence)>=0.6?"var(--amber)":"var(--red)",fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{Math.round(Number(selectedDoc.confidence)*100)}%</span>:"—"],
              ["File type", selectedDoc.fileType||"—"],
              ["Nguồn",     selectedDoc.source||"—"],
              ["Trạng thái",<span className="status-dot"><span className={`dot ${STATUS_DOT[selectedDoc.status]||"dot-amber"}`}/>{STATUS_LABEL[selectedDoc.status]||selectedDoc.status}</span>],
              ["Thời gian", fmtDate(selectedDoc.processedAt)],
              ["Drive ID",  <code style={{fontSize:10,color:"var(--text3)",wordBreak:"break-all"}}>{selectedDoc.googleDriveId||"—"}</code>],
            ].map(([label,val])=>(
              <div key={label} className={styles.drawerRow}><span>{label}</span><span>{val}</span></div>
            ))}
            {selectedDoc.reason&&(
              <div className={styles.reasonBox}>
                <div className={styles.reasonLabel}>Lý do AI</div>
                <div className={styles.reasonText}>{selectedDoc.reason}</div>
              </div>
            )}
          </div>
          <div className={styles.drawerActions}>
            {selectedDoc.googleDriveId
              ? <a href={driveUrl(selectedDoc.googleDriveId)} target="_blank" rel="noreferrer"
                  className="btn btn-primary" style={{flex:1,textAlign:"center",textDecoration:"none"}}>🔗 Mở Google Drive</a>
              : <button className="btn" style={{flex:1}} disabled>Không có Drive link</button>
            }
          </div>
        </div>
      )}
    </div>
  );
}