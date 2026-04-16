import { useState, useRef, useCallback } from "react";
import styles from "./Upload.module.css";

const ACCEPT_TYPES = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".gif", ".txt"];
const MAX_SIZE_MB  = 20;

function formatSize(bytes) {
  if (bytes < 1024)         return bytes + " B";
  if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    pdf:  { icon: "📄", color: "#ff5c5c" },
    docx: { icon: "📝", color: "#4f7bff" },
    xlsx: { icon: "📊", color: "#22c97b" },
    png:  { icon: "🖼",  color: "#22d4f0" },
    jpg:  { icon: "🖼",  color: "#22d4f0" },
    jpeg: { icon: "🖼",  color: "#22d4f0" },
    gif:  { icon: "🎞",  color: "#f5a623" },
    txt:  { icon: "📃", color: "#8b90a8" },
  };
  return map[ext] || { icon: "📁", color: "#8b90a8" };
}

/* Simulated upload — replace with real API call from services/api.js */
function simulateUpload(file, onProgress) {
  return new Promise((resolve) => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => resolve({ success: true, id: Date.now() }), 300);
      }
      onProgress(Math.min(Math.round(p), 100));
    }, 120);
  });
}

export default function Upload() {
  const [files,    setFiles]    = useState([]);   // { file, id, status, progress, error }
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  /* ── Validation ── */
  const validate = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPT_TYPES.includes(ext)) return `Loại file không được hỗ trợ (${ext})`;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File quá lớn (tối đa ${MAX_SIZE_MB} MB)`;
    return null;
  };

  /* ── Add files ── */
  const addFiles = useCallback((rawFiles) => {
    const newEntries = Array.from(rawFiles).map((file) => {
      const err = validate(file);
      return {
        id:       crypto.randomUUID(),
        file,
        status:   err ? "error" : "queued",   // queued | uploading | done | error
        progress: 0,
        error:    err || null,
      };
    });
    setFiles((prev) => [...prev, ...newEntries]);

    /* Auto-start upload for valid files */
    newEntries.forEach((entry) => {
      if (entry.status === "queued") startUpload(entry);
    });
  }, []);

  /* ── Upload one file ── */
  const startUpload = (entry) => {
    setFiles((prev) =>
      prev.map((f) => f.id === entry.id ? { ...f, status: "uploading" } : f)
    );

    simulateUpload(entry.file, (progress) => {
      setFiles((prev) =>
        prev.map((f) => f.id === entry.id ? { ...f, progress } : f)
      );
    }).then(() => {
      setFiles((prev) =>
        prev.map((f) => f.id === entry.id ? { ...f, status: "done", progress: 100 } : f)
      );
    }).catch(() => {
      setFiles((prev) =>
        prev.map((f) => f.id === entry.id ? { ...f, status: "error", error: "Upload thất bại" } : f)
      );
    });
  };

  /* ── Retry ── */
  const retry = (id) => {
    const entry = files.find((f) => f.id === id);
    if (!entry) return;
    setFiles((prev) =>
      prev.map((f) => f.id === id ? { ...f, status: "queued", progress: 0, error: null } : f)
    );
    startUpload({ ...entry, status: "queued" });
  };

  /* ── Remove ── */
  const remove = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  /* ── Drag events ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); };
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const done      = files.filter((f) => f.status === "done").length;
  const uploading = files.filter((f) => f.status === "uploading").length;
  const errors    = files.filter((f) => f.status === "error").length;

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Upload tài liệu</h2>
          <p className={styles.pageDesc}>Hỗ trợ PDF, DOCX, XLSX, ảnh và TXT — tối đa {MAX_SIZE_MB} MB mỗi file</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: drop zone + queue ── */}
        <div className={styles.leftCol}>

          {/* Drop zone */}
          <div
            className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_TYPES.join(",")}
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className={styles.dropIcon}>
              {dragging ? "📂" : "📁"}
            </div>
            <div className={styles.dropTitle}>
              {dragging ? "Thả file vào đây" : "Kéo thả file hoặc click để chọn"}
            </div>
            <div className={styles.dropSub}>
              {ACCEPT_TYPES.join("  ·  ")}
            </div>
          </div>

          {/* File queue */}
          {files.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Hàng đợi upload</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {uploading > 0 && <span className={styles.badge} style={{ color: "var(--accent)" }}>⟳ {uploading} đang upload</span>}
                  {done > 0      && <span className={styles.badge} style={{ color: "var(--green)" }}>✓ {done} xong</span>}
                  {errors > 0    && <span className={styles.badge} style={{ color: "var(--red)" }}>✕ {errors} lỗi</span>}
                  <button
                    className="card-action"
                    onClick={() => setFiles([])}
                  >Xóa tất cả</button>
                </div>
              </div>

              <div className={styles.fileList}>
                {files.map((entry) => {
                  const { icon, color } = getFileIcon(entry.file.name);
                  return (
                    <div key={entry.id} className={styles.fileItem}>
                      <div className={styles.fileIcon} style={{ background: color + "18" }}>
                        <span>{icon}</span>
                      </div>

                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>{entry.file.name}</div>
                        <div className={styles.fileMeta}>
                          {formatSize(entry.file.size)}
                          {entry.status === "uploading" && ` · ${entry.progress}%`}
                          {entry.status === "done"      && " · Hoàn tất"}
                          {entry.status === "error"     && ` · ${entry.error}`}
                          {entry.status === "queued"    && " · Chờ upload"}
                        </div>

                        {/* Progress bar */}
                        {(entry.status === "uploading" || entry.status === "done") && (
                          <div className={styles.progressTrack}>
                            <div
                              className={styles.progressFill}
                              style={{
                                width: entry.progress + "%",
                                background: entry.status === "done" ? "var(--green)" : "var(--accent)",
                              }}
                            />
                          </div>
                        )}
                        {entry.status === "error" && (
                          <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: "100%", background: "var(--red)" }} />
                          </div>
                        )}
                      </div>

                      {/* Status icon */}
                      <div className={styles.fileStatus}>
                        {entry.status === "uploading" && (
                          <div className={styles.spinner} />
                        )}
                        {entry.status === "done" && (
                          <span style={{ color: "var(--green)", fontSize: 16 }}>✓</span>
                        )}
                        {entry.status === "error" && (
                          <button className={styles.retryBtn} onClick={() => retry(entry.id)}>Thử lại</button>
                        )}
                      </div>

                      <button className={styles.removeBtn} onClick={() => remove(entry.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: info panel ── */}
        <div className={styles.rightCol}>

          {/* Accepted types */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Định dạng hỗ trợ</span>
            </div>
            <div className={styles.typeList}>
              {[
                { ext: "PDF",  icon: "📄", color: "#ff5c5c", note: "OCR tự động" },
                { ext: "DOCX", icon: "📝", color: "#4f7bff", note: "Đọc text trực tiếp" },
                { ext: "XLSX", icon: "📊", color: "#22c97b", note: "Trích xuất bảng" },
                { ext: "JPG / PNG", icon: "🖼", color: "#22d4f0", note: "Gemini Vision OCR" },
                { ext: "GIF",  icon: "🎞", color: "#f5a623", note: "Nhận diện, không OCR" },
                { ext: "TXT",  icon: "📃", color: "#8b90a8", note: "Đọc thẳng" },
              ].map((t) => (
                <div key={t.ext} className={styles.typeItem}>
                  <div className={styles.typeIcon} style={{ background: t.color + "18" }}>{t.icon}</div>
                  <div>
                    <div className={styles.typeExt}>{t.ext}</div>
                    <div className={styles.typeNote}>{t.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline preview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Sau khi upload</span>
            </div>
            <div className={styles.pipeline}>
              {[
                { step: "1", label: "Nhận file",       icon: "📥", color: "var(--accent)" },
                { step: "2", label: "OCR / Trích xuất",icon: "🔍", color: "var(--cyan)" },
                { step: "3", label: "AI phân loại",    icon: "🤖", color: "var(--accent2)" },
                { step: "4", label: "Định tuyến",      icon: "📤", color: "var(--green)" },
              ].map((s, i, arr) => (
                <div key={s.step} className={styles.pipeItem}>
                  <div className={styles.pipeIcon} style={{ background: s.color + "18", borderColor: s.color + "33" }}>
                    {s.icon}
                  </div>
                  <div className={styles.pipeLabel}>{s.label}</div>
                  {i < arr.length - 1 && <div className={styles.pipeArrow}>↓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className={styles.miniStats}>
            <div className={styles.miniStat}>
              <div className={styles.miniValue}>{done}</div>
              <div className={styles.miniLabel}>Đã xong</div>
            </div>
            <div className={styles.miniStat}>
              <div className={styles.miniValue}>{uploading}</div>
              <div className={styles.miniLabel}>Đang upload</div>
            </div>
            <div className={styles.miniStat}>
              <div className={styles.miniValue} style={{ color: errors > 0 ? "var(--red)" : undefined }}>{errors}</div>
              <div className={styles.miniLabel}>Lỗi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
