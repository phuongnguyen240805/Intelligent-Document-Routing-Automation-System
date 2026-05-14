import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import { UPLOAD_URL, getAllDocuments } from "../services/api";
import styles from "./Upload.module.css";

const ACCEPT = [".pdf",".docx",".xlsx",".png",".jpg",".jpeg",".gif",".txt"];
const MAX_MB = 20;

const fmtSize = b => b<1024?b+" B":b<1024*1024?(b/1024).toFixed(1)+" KB":(b/(1024*1024)).toFixed(1)+" MB";
const fmtDate = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN")+" "+d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
};

const FILE_ICON = n => {
  const e = n.split(".").pop().toLowerCase();
  const m = {pdf:{i:"📄",c:"#ff5c5c"},docx:{i:"📝",c:"#4f7bff"},xlsx:{i:"📊",c:"#22c97b"},
    png:{i:"🖼",c:"#22d4f0"},jpg:{i:"🖼",c:"#22d4f0"},jpeg:{i:"🖼",c:"#22d4f0"},
    gif:{i:"🎞",c:"#f5a623"},txt:{i:"📃",c:"#8b90a8"}};
  return m[e]||{i:"📁",c:"#8b90a8"};
};

const CAT_STYLE = {
  "Hóa đơn":     {cls:"invoice",  label:"Hóa đơn"},
  "Hợp đồng":    {cls:"contract", label:"Hợp đồng"},
  "CV / Resume": {cls:"hr",       label:"CV / Resume"},
  "Biên nhận":   {cls:"receipt",  label:"Biên nhận"},
  "Báo cáo":     {cls:"report",   label:"Báo cáo"},
  "Khác":        {cls:"other",    label:"Khác"},
};
const getCat = c => CAT_STYLE[c] || {cls:"other", label:c||"Khác"};

const STATUS_DOT   = {success:"dot-green",pending:"dot-amber",failed:"dot-red",uploaded:"dot-green",approved:"dot-green",rejected:"dot-red"};
const STATUS_LABEL = {success:"Thành công",pending:"Chờ xử lý",failed:"Thất bại",uploaded:"Đã upload",approved:"Đã duyệt",rejected:"Từ chối"};

async function doUpload(file, onProgress) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await axios.post(UPLOAD_URL, fd, {
    timeout: 120_000,
    onUploadProgress: e => { if(e.total) onProgress(Math.round(e.loaded/e.total*100)); },
  });
  return data;
}

export default function Upload() {
  const [tab,      setTab]      = useState("upload");  // "upload" | "history"
  const [files,    setFiles]    = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  /* History state */
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [histError,    setHistError]    = useState(null);
  const [histSearch,   setHistSearch]   = useState("");
  const [histPage,     setHistPage]     = useState(1);
  const HIST_PER = 10;

  const loadHistory = useCallback(() => {
    setHistLoading(true); setHistError(null);
    getAllDocuments()
      .then(data => { setHistory(Array.isArray(data)?data:[]); setHistLoading(false); })
      .catch(e => { setHistError(e.message); setHistLoading(false); });
  }, []);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  /* Upload logic */
  const validate = f => {
    const ext = "."+f.name.split(".").pop().toLowerCase();
    if (!ACCEPT.includes(ext)) return `Loại file không hỗ trợ (${ext})`;
    if (f.size > MAX_MB*1024*1024) return `Quá ${MAX_MB}MB`;
    return null;
  };

  const startUpload = useCallback((entry) => {
    setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"uploading",progress:0}:f));
    doUpload(entry.file, prog=>setFiles(p=>p.map(f=>f.id===entry.id?{...f,progress:prog}:f)))
      .then(data=>setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"done",progress:100,result:data}:f)))
      .catch(err=>{
        const msg = err.response?.data?.error??err.message??"Upload thất bại";
        setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"error",error:typeof msg==="string"?msg:JSON.stringify(msg)}:f));
      });
  },[]);

  const addFiles = useCallback((raw)=>{
    const entries = Array.from(raw).map(file=>{
      const err=validate(file);
      return {id:crypto.randomUUID(),file,status:err?"error":"queued",progress:0,error:err||null,result:null};
    });
    setFiles(p=>[...p,...entries]);
    entries.forEach(e=>{ if(e.status==="queued") startUpload(e); });
  },[startUpload]);

  const retry  = id=>{ const e=files.find(f=>f.id===id); if(!e) return; const r={...e,status:"queued",progress:0,error:null,result:null}; setFiles(p=>p.map(f=>f.id===id?r:f)); startUpload(r); };
  const remove = id=>setFiles(p=>p.filter(f=>f.id!==id));

  const done=files.filter(f=>f.status==="done").length;
  const uploading=files.filter(f=>f.status==="uploading").length;
  const errors=files.filter(f=>f.status==="error").length;

  /* History filter */
  const filteredHist = history.filter(d=>
    (d.fileName||"").toLowerCase().includes(histSearch.toLowerCase())
  );
  const histPages   = Math.ceil(filteredHist.length/HIST_PER);
  const histPaged   = filteredHist.slice((histPage-1)*HIST_PER, histPage*HIST_PER);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Upload</h2>
          <p className={styles.pageDesc}>
            Upload lên Google Drive INBOX · n8n tự động xử lý · <code style={{fontSize:11,color:"var(--accent)"}}>{UPLOAD_URL}</code>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==="upload"?styles.tabActive:""}`} onClick={()=>setTab("upload")}>
          ⬆ Upload mới
        </button>
        <button className={`${styles.tab} ${tab==="history"?styles.tabActive:""}`} onClick={()=>setTab("history")}>
          🕓 Lịch sử
          {history.length>0&&<span className={styles.tabBadge}>{history.length}</span>}
        </button>
      </div>

      {/* ══════════ TAB: UPLOAD ══════════ */}
      {tab==="upload" && (
        <div className={styles.layout}>
          <div className={styles.leftCol}>
            {/* Drop zone */}
            <div
              className={`${styles.dropzone} ${dragging?styles.dropzoneActive:""}`}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false);}}
              onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
              onClick={()=>inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" multiple accept={ACCEPT.join(",")}
                style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
              <div className={styles.dropIcon}>{dragging?"📂":"📁"}</div>
              <div className={styles.dropTitle}>{dragging?"Thả file vào đây":"Kéo thả hoặc click để chọn"}</div>
              <div className={styles.dropSub}>{ACCEPT.join("  ·  ")}</div>
            </div>

            {/* Queue */}
            {files.length>0&&(
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Hàng đợi</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {uploading>0&&<span style={{fontSize:12,color:"var(--accent)"}}>⟳ {uploading} đang upload</span>}
                    {done>0&&<span style={{fontSize:12,color:"var(--green)"}}>✓ {done} xong</span>}
                    {errors>0&&<span style={{fontSize:12,color:"var(--red)"}}>✕ {errors} lỗi</span>}
                    <button className="card-action" onClick={()=>setFiles([])}>Xóa tất cả</button>
                  </div>
                </div>
                {files.map(entry=>{
                  const {i,c}=FILE_ICON(entry.file.name);
                  return (
                    <div key={entry.id} className={styles.fileItem}>
                      <div className={styles.fileIcon} style={{background:c+"18"}}>{i}</div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>{entry.file.name}</div>
                        <div className={styles.fileMeta}>
                          {fmtSize(entry.file.size)}
                          {entry.status==="uploading"&&` · ${entry.progress}%`}
                          {entry.status==="done"&&" · Hoàn tất ✓"}
                          {entry.status==="error"&&` · ${entry.error}`}
                          {entry.status==="queued"&&" · Chờ upload"}
                        </div>
                        {(entry.status==="uploading"||entry.status==="done")&&(
                          <div className={styles.progTrack}>
                            <div className={styles.progFill} style={{width:entry.progress+"%",background:entry.status==="done"?"var(--green)":"var(--accent)"}}/>
                          </div>
                        )}
                        {entry.status==="error"&&(
                          <div className={styles.progTrack}><div className={styles.progFill} style={{width:"100%",background:"var(--red)"}}/></div>
                        )}
                        {entry.status==="done"&&entry.result&&(
                          <div className={styles.resultBox}>
                            {entry.result.message&&<div className={styles.resultMsg}>{entry.result.message}</div>}
                            {entry.result.driveLink&&(
                              <a href={entry.result.driveLink} target="_blank" rel="noreferrer" className={styles.driveLink}>🔗 Mở Google Drive</a>
                            )}
                            {entry.result.fileId&&(
                              <div className={styles.fileIdRow}>
                                <span className={styles.fileIdLabel}>File ID:</span>
                                <code className={styles.fileIdVal}>{entry.result.fileId}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{flexShrink:0}}>
                        {entry.status==="uploading"&&<div className={styles.spinner}/>}
                        {entry.status==="done"&&<span style={{color:"var(--green)",fontSize:16}}>✓</span>}
                        {entry.status==="error"&&<button className={styles.retryBtn} onClick={()=>retry(entry.id)}>Thử lại</button>}
                      </div>
                      <button className={styles.removeBtn} onClick={()=>remove(entry.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className={styles.rightCol}>
            <div className="card">
              <div className="card-header"><span className="card-title">Sau khi upload</span></div>
              <div className={styles.pipeline}>
                {[
                  {label:"Upload vào INBOX",   icon:"📥",color:"var(--accent)"},
                  {label:"n8n phát hiện file", icon:"⚡",color:"var(--cyan)"},
                  {label:"OCR & Trích xuất",   icon:"🔍",color:"var(--cyan)"},
                  {label:"AI phân loại",       icon:"🤖",color:"var(--accent2)"},
                  {label:"Route vào thư mục",  icon:"📂",color:"var(--green)"},
                  {label:"Lưu vào database",   icon:"🗄",color:"var(--text3)"},
                ].map((s,i,arr)=>(
                  <div key={s.label} className={styles.pipeItem}>
                    <div className={styles.pipeIcon} style={{background:s.color+"18",borderColor:s.color+"33"}}>{s.icon}</div>
                    <div className={styles.pipeLabel}>{s.label}</div>
                    {i<arr.length-1&&<div className={styles.pipeArrow}>↓</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.miniStats}>
              {[{v:done,l:"Đã xong"},{v:uploading,l:"Uploading"},{v:errors,l:"Lỗi",c:errors>0?"var(--red)":undefined}].map(s=>(
                <div key={s.l} className={styles.miniStat}>
                  <div className={styles.miniVal} style={{color:s.c}}>{s.v}</div>
                  <div className={styles.miniLabel}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TAB: HISTORY ══════════ */}
      {tab==="history" && (
        <div className={styles.historyWrap}>
          {/* Toolbar */}
          <div className={styles.histToolbar}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input className={styles.search} placeholder="Tìm tên file..."
                value={histSearch} onChange={e=>{setHistSearch(e.target.value);setHistPage(1);}}/>
              {histSearch&&<button className={styles.searchClear} onClick={()=>setHistSearch("")}>✕</button>}
            </div>
            <button className="btn" onClick={loadHistory}>⟳ Refresh</button>
            <span style={{fontSize:13,color:"var(--text3)",marginLeft:"auto"}}>
              {histLoading?"Đang tải...":`${filteredHist.length} tài liệu`}
            </span>
          </div>

          {histError&&(
            <div className={styles.errorBox}>⚠ {histError}
              <button className={styles.retryBtn} onClick={loadHistory}>Thử lại</button>
            </div>
          )}

          <div className="card">
            {histLoading ? (
              <div className={styles.loadingRow}><div className={styles.spinner}/> Đang tải lịch sử...</div>
            ) : (
              <>
                <table className={styles.histTable}>
                  <thead>
                    <tr>
                      <th style={{width:28}}></th>
                      <th>Tên file</th>
                      <th>Danh mục</th>
                      <th>Độ tin cậy</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th style={{width:36}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {histPaged.length===0 ? (
                      <tr><td colSpan={7} className={styles.empty}>Không tìm thấy tài liệu nào</td></tr>
                    ) : histPaged.map(doc=>{
                      const cat  = getCat(doc.category);
                      const conf = doc.confidence?Math.round(Number(doc.confidence)*100):null;
                      const confColor = conf?(conf>=80?"var(--green)":conf>=60?"var(--amber)":"var(--red)"):"var(--text3)";
                      const {i,c} = FILE_ICON(doc.fileName||"");
                      return (
                        <tr key={doc.id}>
                          <td><span style={{fontSize:16}}>{i}</span></td>
                          <td>
                            <div className={styles.docName}>{doc.fileName}</div>
                            <div className={styles.docMeta}>{doc.fileType||"—"} · {doc.source||"—"}</div>
                          </td>
                          <td><span className={`badge badge-${cat.cls}`}>{cat.label}</span></td>
                          <td>
                            <span style={{fontSize:12,fontWeight:600,color:confColor,fontFamily:"'DM Mono',monospace"}}>
                              {conf?conf+"%":"—"}
                            </span>
                          </td>
                          <td className={styles.muted}>{fmtDate(doc.processedAt)}</td>
                          <td>
                            <span className="status-dot">
                              <span className={`dot ${STATUS_DOT[doc.status]||"dot-amber"}`}/>
                              {STATUS_LABEL[doc.status]||doc.status||"—"}
                            </span>
                          </td>
                          <td>
                            {doc.googleDriveId&&(
                              <a href={`https://drive.google.com/file/d/${doc.googleDriveId}/view`}
                                target="_blank" rel="noreferrer" className={styles.actionBtn} title="Mở Drive">
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                  <path d="M10 2h4v4M14 2L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {histPages>1&&(
                  <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                      {(histPage-1)*HIST_PER+1}–{Math.min(histPage*HIST_PER,filteredHist.length)} / {filteredHist.length}
                    </span>
                    <div className={styles.pageButtons}>
                      <button className={styles.pageBtn} disabled={histPage===1} onClick={()=>setHistPage(p=>p-1)}>← Trước</button>
                      {Array.from({length:histPages},(_,i)=>i+1).map(p=>(
                        <button key={p} className={`${styles.pageBtn} ${p===histPage?styles.pageBtnActive:""}`}
                          onClick={()=>setHistPage(p)}>{p}</button>
                      ))}
                      <button className={styles.pageBtn} disabled={histPage===histPages} onClick={()=>setHistPage(p=>p+1)}>Sau →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}