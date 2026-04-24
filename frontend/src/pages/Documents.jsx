import { useState, useMemo, useEffect } from "react";
import { getAllDocuments } from "../services/api";
import styles from "./Documents.module.css";

/**
 * Documents.jsx
 * Hiển thị bảng `documents` (Document entity sau khi n8n OCR + phân loại).
 * Gọi: GET /api/files → getAllDocuments()
 * Fields dùng: fileName, fileType, category, confidence, source, processedAt, status, googleDriveId
 */

/* ── Map category string → badge style ── */
const CAT_STYLE = {
  "Hóa đơn":       { cls: "invoice",  label: "Hóa đơn" },
  "Hợp đồng":      { cls: "contract", label: "Hợp đồng" },
  "HR":             { cls: "hr",       label: "HR" },
  "CV":             { cls: "hr",       label: "CV" },
  "Purchase Order": { cls: "po",       label: "Purchase Order" },
  "Báo cáo":        { cls: "report",   label: "Báo cáo" },
  "Biên nhận":      { cls: "other",    label: "Biên nhận" },
};
function getCat(category) {
  return CAT_STYLE[category] || { cls: "other", label: category || "Khác" };
}

const STATUS_DOT   = { success: "dot-green", pending: "dot-amber", failed: "dot-red", uploaded: "dot-green" };
const STATUS_LABEL = { success: "Thành công", pending: "Chờ xử lý", failed: "Thất bại", uploaded: "Đã upload" };

const CATEGORIES = ["Tất cả", "Hóa đơn", "Hợp đồng", "CV", "HR", "Purchase Order", "Báo cáo", "Biên nhận", "Khác"];
const STATUSES   = ["Tất cả", "Thành công", "Chờ xử lý", "Thất bại"];
const STATUS_VAL = { "Thành công": "success", "Chờ xử lý": "pending", "Thất bại": "failed" };

function ConfidencePill({ value }) {
  const pct = value ? Math.round(Number(value) * 100) : null;
  if (!pct) return <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>;
  const color = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--amber)" : "var(--red)";
  return <span style={{ color, fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{pct}%</span>;
}

function FileIcon({ fileType }) {
  if (!fileType) return <span style={{ fontSize: 16 }}>📁</span>;
  if (fileType.includes("pdf"))   return <span style={{ fontSize: 16 }}>📄</span>;
  if (fileType.includes("word") || fileType.includes("docx")) return <span style={{ fontSize: 16 }}>📝</span>;
  if (fileType.includes("sheet") || fileType.includes("xlsx")) return <span style={{ fontSize: 16 }}>📊</span>;
  if (fileType.includes("image")) return <span style={{ fontSize: 16 }}>🖼</span>;
  return <span style={{ fontSize: 16 }}>📁</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function Documents() {
  const [docs,         setDocs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selected,     setSelected]     = useState(null);
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  const fetchDocs = () => {
    setLoading(true);
    setError(null);
    getAllDocuments()
      .then((data) => { setDocs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchDocs(); }, []);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const name = d.fileName || "";
      const matchSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "Tất cả" ||
        (catFilter === "Khác" ? !CAT_STYLE[d.category] : d.category === catFilter);
      const matchStatus = statusFilter === "Tất cả" || d.status === STATUS_VAL[statusFilter];
      return matchSearch && matchCat && matchStatus;
    });
  }, [docs, search, catFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const handleFilter = (setter, val) => { setter(val); setPage(1); };
  const selectedDoc = docs.find(d => d.id === selected);
  const driveViewUrl = (id) => id ? `https://drive.google.com/file/d/${id}/view` : null;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tài liệu</h2>
          <p className={styles.pageDesc}>
            {loading ? "Đang tải..." : `${filtered.length} / ${docs.length} tài liệu`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchDocs}>⟳ Refresh</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <span>⚠ Không thể kết nối backend:</span> {error}
          <button className={styles.retryBtn} onClick={fetchDocs}>Thử lại</button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className={styles.search}
            placeholder="Tìm tên file..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>}
        </div>

        <div className={styles.pills}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`${styles.pill} ${catFilter === c ? styles.pillActive : ""}`}
              onClick={() => handleFilter(setCatFilter, c)}
            >{c}</button>
          ))}
        </div>

        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => handleFilter(setStatusFilter, e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className={styles.loadingRow}>
            <div className={styles.spinner} /> Đang tải dữ liệu từ backend...
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Tên file</th>
                  <th>Danh mục</th>
                  <th>Độ tin cậy</th>
                  <th>Nguồn</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.empty}>
                      {docs.length === 0 ? "Chưa có tài liệu nào" : "Không tìm thấy kết quả"}
                    </td>
                  </tr>
                ) : paginated.map((doc) => {
                  const cat    = getCat(doc.category);
                  const dotCls = STATUS_DOT[doc.status] || "dot-amber";
                  const statusLabel = STATUS_LABEL[doc.status] || doc.status || "—";
                  return (
                    <tr
                      key={doc.id}
                      className={selected === doc.id ? styles.rowSelected : ""}
                      onClick={() => setSelected(selected === doc.id ? null : doc.id)}
                    >
                      <td><FileIcon fileType={doc.fileType} /></td>
                      <td>
                        <div className={styles.docName}>{doc.fileName}</div>
                        <div className={styles.docMeta}>{doc.fileType || "—"}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${cat.cls}`}>{cat.label}</span>
                      </td>
                      <td><ConfidencePill value={doc.confidence} /></td>
                      <td className={styles.muted}>{doc.source || "—"}</td>
                      <td className={styles.muted}>{formatDate(doc.processedAt)}</td>
                      <td>
                        <span className="status-dot">
                          <span className={`dot ${dotCls}`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        {doc.googleDriveId && (
                          <a
                            href={driveViewUrl(doc.googleDriveId)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.actionBtn}
                            title="Mở Google Drive"
                            onClick={(e) => e.stopPropagation()}
                          >
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
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}
                </span>
                <div className={styles.pageButtons}>
                  <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      {selectedDoc && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <FileIcon fileType={selectedDoc.fileType} />
            <div className={styles.drawerTitle}>{selectedDoc.fileName}</div>
            <button className={styles.drawerClose} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className={styles.drawerBody}>
            {[
              ["Danh mục",   <span className={`badge badge-${getCat(selectedDoc.category).cls}`}>{getCat(selectedDoc.category).label}</span>],
              ["Độ tin cậy", <ConfidencePill value={selectedDoc.confidence} />],
              ["File type",  selectedDoc.fileType || "—"],
              ["Nguồn",      selectedDoc.source || "—"],
              ["Trạng thái", <span className="status-dot"><span className={`dot ${STATUS_DOT[selectedDoc.status] || "dot-amber"}`} />{STATUS_LABEL[selectedDoc.status] || selectedDoc.status}</span>],
              ["Thời gian",  formatDate(selectedDoc.processedAt)],
              ["Drive ID",   <code style={{ fontSize: 10, color: "var(--text3)", wordBreak: "break-all" }}>{selectedDoc.googleDriveId || "—"}</code>],
            ].map(([label, val]) => (
              <div key={label} className={styles.drawerRow}>
                <span>{label}</span>
                <span>{val}</span>
              </div>
            ))}
            {selectedDoc.reason && (
              <div className={styles.reasonBox}>
                <div className={styles.reasonLabel}>Lý do AI</div>
                <div className={styles.reasonText}>{selectedDoc.reason}</div>
              </div>
            )}
          </div>
          <div className={styles.drawerActions}>
            {selectedDoc.googleDriveId ? (
              <a
                href={driveViewUrl(selectedDoc.googleDriveId)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
              >
                🔗 Mở Google Drive
              </a>
            ) : (
              <button className="btn" style={{ flex: 1 }} disabled>Không có Drive link</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}