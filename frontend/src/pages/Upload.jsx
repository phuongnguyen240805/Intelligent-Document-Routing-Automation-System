import { useState, useRef, useCallback } from "react";
import axios from "axios";
import { UPLOAD_URL } from "../services/api";
import styles from "./Upload.module.css";

const ACCEPT = [".pdf",".docx",".xlsx",".png",".jpg",".jpeg",".gif",".txt"];
const MAX_MB = 20;

const fmtSize = b => b<1024?b+" B":b<1024*1024?(b/1024).toFixed(1)+" KB":(b/(1024*1024)).toFixed(1)+" MB";

const FILE_ICON = n => {
  const e = n.split(".").pop().toLowerCase();
  const m = {pdf:{i:"📄",c:"#ff5c5c"},docx:{i:"📝",c:"#4f7bff"},xlsx:{i:"📊",c:"#22c97b"},
    png:{i:"🖼",c:"#22d4f0"},jpg:{i:"🖼",c:"#22d4f0"},jpeg:{i:"🖼",c:"#22d4f0"},
    gif:{i:"🎞",c:"#f5a623"},txt:{i:"📃",c:"#8b90a8"}};
  return m[e]||{i:"📁",c:"#8b90a8"};
};

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
  const [files,    setFiles]    = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const validate = f => {
    const ext = "."+f.name.split(".").pop().toLowerCase();
    if (!ACCEPT.includes(ext)) return `Loại file không hỗ trợ (${ext})`;
    if (f.size > MAX_MB*1024*1024) return `Quá ${MAX_MB}MB`;
    return null;
  };

  const startUpload = useCallback((entry) => {
    setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"uploading",progress:0}:f));
    doUpload(entry.file, prog => setFiles(p=>p.map(f=>f.id===entry.id?{...f,progress:prog}:f)))
      .then(data => setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"done",progress:100,result:data}:f)))
      .catch(err => {
        const msg = err.response?.data?.error ?? err.message ?? "Upload thất bại";
        setFiles(p=>p.map(f=>f.id===entry.id?{...f,status:"error",error:typeof msg==="string"?msg:JSON.stringify(msg)}:f));
      });
  },[]);

  const addFiles = useCallback((raw) => {
    const entries = Array.from(raw).map(file => {
      const err = validate(file);
      return {id:crypto.randomUUID(),file,status:err?"error":"queued",progress:0,error:err||null,result:null};
    });
    setFiles(p=>[...p,...entries]);
    entries.forEach(e=>{ if(e.status==="queued") startUpload(e); });
  },[startUpload]);

  const retry  = id => { const e=files.find(f=>f.id===id); if(!e) return; const r={...e,status:"queued",progress:0,error:null,result:null}; setFiles(p=>p.map(f=>f.id===id?r:f)); startUpload(r); };
  const remove = id => setFiles(p=>p.filter(f=>f.id!==id));

  const done=files.filter(f=>f.status==="done").length;
  const uploading=files.filter(f=>f.status==="uploading").length;
  const errors=files.filter(f=>f.status==="error").length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Upload tài liệu</h2>
          <p className={styles.pageDesc}>
            File được upload lên Google Drive INBOX, n8n sẽ tự động xử lý · <code style={{fontSize:11,color:"var(--accent)"}}>{UPLOAD_URL}</code>
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={`${styles.dropzone} ${dragging?styles.dropzoneActive:""}`}
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false);}}
            onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
            onClick={()=>inputRef.current?.click()}>
            <input ref={inputRef} type="file" multiple accept={ACCEPT.join(",")}
              style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
            <div className={styles.dropIcon}>{dragging?"📂":"📁"}</div>
            <div className={styles.dropTitle}>{dragging?"Thả file vào đây":"Kéo thả hoặc click để chọn"}</div>
            <div className={styles.dropSub}>{ACCEPT.join("  ·  ")}</div>
          </div>

          {files.length>0&&(
            <div className="card">
              <div className="card-header">
                <span className="card-title">Hàng đợi</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {uploading>0&&<span style={{fontSize:12,color:"var(--accent)"}}>⟳ {uploading}</span>}
                  {done>0&&<span style={{fontSize:12,color:"var(--green)"}}>✓ {done}</span>}
                  {errors>0&&<span style={{fontSize:12,color:"var(--red)"}}>✕ {errors}</span>}
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
                        <div className={styles.progTrack}><div className={styles.progFill} style={{width:entry.progress+"%",background:entry.status==="done"?"var(--green)":"var(--accent)"}}/></div>
                      )}
                      {entry.status==="error"&&(
                        <div className={styles.progTrack}><div className={styles.progFill} style={{width:"100%",background:"var(--red)"}}/></div>
                      )}
                      {entry.status==="done"&&entry.result&&(
                        <div className={styles.resultBox}>
                          {entry.result.message&&<div className={styles.resultMsg}>{entry.result.message}</div>}
                          {entry.result.driveLink&&<a href={entry.result.driveLink} target="_blank" rel="noreferrer" className={styles.driveLink}>🔗 Mở Google Drive</a>}
                          {entry.result.fileId&&<div className={styles.fileIdRow}><span className={styles.fileIdLabel}>File ID:</span><code className={styles.fileIdVal}>{entry.result.fileId}</code></div>}
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
    </div>
  );
}