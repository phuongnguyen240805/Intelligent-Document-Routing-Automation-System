import { useState, useEffect } from "react";
import { getAllDocuments } from "../services/api";
import styles from "./Pending.module.css";

/**
 * Pending.jsx
 * Gọi: GET /api/files → getAllDocuments() → Document[]
 * Lọc ra các doc có status === "pending" HOẶC confidence < 0.70
 * (khớp đúng với thư mục "Review" trong Google Drive của nhóm)
 *
 * LƯU Ý: Approve/Reject hiện chỉ update UI local.
 * Khi backend có endpoint PATCH /api/documents/:id thì thêm vào hàm approve/reject bên dưới.
 */

const ALL_CATEGORIES = [
  { value: "Hóa đơn",       label: "Hóa đơn",       bg: "#4f7bff18", text: "#7fa3ff" },
  { value: "Hợp đồng",      label: "Hợp đồng",       bg: "#22d4f018", text: "#22d4f0" },
  { value: "CV",             label: "CV",             bg: "#7c5fff18", text: "#a080ff" },
  { value: "HR",             label: "HR",             bg: "#7c5fff18", text: "#a080ff" },
  { value: "Purchase Order", label: "Purchase Order", bg: "#22c97b18", text: "#22c97b" },
  { value: "Báo cáo",        label: "Báo cáo",        bg: "#f5a62318", text: "#f5a623" },
  { value: "Biên nhận",      label: "Biên nhận",      bg: "#22d4f018", text: "#22d4f0" },
  { value: "Khác",           label: "Khác",           bg: "#ffffff10", text: "#8b90a8" },
];
const CAT_MAP = Object.fromEntries(ALL_CATEGORIES.map(c => [c.value, c]));
function getCatStyle(cat) {
  return CAT_MAP[cat] || { label: cat || "Khác", bg: "#ffffff10", text: "#8b90a8" };
}

function ConfBadge({ value }) {
  if (!value) return <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>;
  const pct   = Math.round(Number(value) * 100);
  const color = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--amber)" : "var(--red)";
  return <span style={{ color, fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{pct}%</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function Pending() {
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [items,     setItems]     = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [overrides, setOverrides] = useState({});  // { [id]: newCategory }
  const [resolved,  setResolved]  = useState([]);  // đã duyệt/từ chối trong session

  const fetchPending = () => {
    setLoading(true);
    setError(null);
    getAllDocuments()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        // Lấy doc pending hoặc confidence thấp (< 0.70) — đây là logic "Review"
        const pendingDocs = arr.filter(d =>
          d.status === "pending" || (d.confidence != null && Number(d.confidence) < 0.70)
        );
        setItems(pendingDocs);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchPending(); }, []);

  const selectedItem = items.find(i => i.id === selected);

  const approve = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    // TODO: khi backend có PATCH /api/documents/:id → gọi ở đây
    // await updateDocumentStatus(id, { status: "success", category: overrides[id] || item.category });
    setResolved(prev => [...prev, { ...item, action: "approved", finalCat: overrides[id] || item.category }]);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected === id) setSelected(null);
  };

  const reject = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    // TODO: khi backend có PATCH /api/documents/:id → gọi ở đây
    // await updateDocumentStatus(id, { status: "failed" });
    setResolved(prev => [...prev, { ...item, action: "rejected" }]);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected === id) setSelected(null);
  };

  const driveUrl = (id) => id ? `https://drive.google.com/file/d/${id}/view` : null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Pending Review</h2>
          <p className={styles.pageDesc}>
            {loading
              ? "Đang tải..."
              : `${items.length} cần xem lại${resolved.length > 0 ? ` · ${resolved.length} đã xử lý` : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={fetchPending}>⟳ Refresh</button>
          {!loading && items.length > 0 && (
            <>
              <button className="btn" onClick={() => items.forEach(i => reject(i.id))}>Từ chối tất cả</button>
              <button className="btn btn-primary" onClick={() => items.forEach(i => approve(i.id))}>Duyệt tất cả</button>
            </>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBox}>⚠ {error}</div>}

      {loading ? (
        <div className={styles.loadingBox}><div className={styles.spinner} /> Đang tải từ backend...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <div className={styles.emptyTitle}>Không có gì cần duyệt</div>
          <div className={styles.emptyDesc}>
            {resolved.length > 0 ? `${resolved.length} đã xử lý trong phiên này` : "Tất cả tài liệu đều ổn"}
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* List col */}
          <div className={styles.listCol}>
            {items.map((item) => {
              const cat        = getCatStyle(overrides[item.id] || item.category);
              const isSelected = selected === item.id;
              return (
                <div
                  key={item.id}
                  className={`${styles.itemCard} ${isSelected ? styles.itemCardActive : ""}`}
                  onClick={() => setSelected(isSelected ? null : item.id)}
                >
                  <div className={styles.itemTop}>
                    <div className={styles.itemName}>{item.fileName}</div>
                    <ConfBadge value={item.confidence} />
                  </div>
                  <div className={styles.itemMeta}>
                    <span className="badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                    {item.reason && (
                      <span className={styles.itemReason}>
                        {item.reason.slice(0, 70)}{item.reason.length > 70 ? "..." : ""}
                      </span>
                    )}
                    <span className={styles.itemDate}>{formatDate(item.processedAt)}</span>
                  </div>
                  <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
                    <select
                      className={styles.catSelect}
                      value={overrides[item.id] || item.category || "Khác"}
                      onChange={e => setOverrides(prev => ({ ...prev, [item.id]: e.target.value }))}
                    >
                      {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <button className={styles.rejectBtn}  onClick={() => reject(item.id)}>✕ Từ chối</button>
                    <button className={styles.approveBtn} onClick={() => approve(item.id)}>✓ Duyệt</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail col */}
          <div className={styles.detailCol}>
            {selectedItem ? (
              <div className="card">
                <div className="card-header"><span className="card-title">Chi tiết</span></div>
                <div className={styles.detail}>
                  <div className={styles.detailName}>{selectedItem.fileName}</div>
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>AI phân loại</div>
                    {[
                      ["Danh mục",   (() => { const c = getCatStyle(selectedItem.category); return <span className="badge" style={{ background: c.bg, color: c.text }}>{c.label}</span>; })()],
                      ["Độ tin cậy", <ConfBadge value={selectedItem.confidence} />],
                      ["File type",  selectedItem.fileType || "—"],
                      ["Nguồn",      selectedItem.source || "—"],
                      ["Thời gian",  formatDate(selectedItem.processedAt)],
                      ["Drive ID",   <code style={{ fontSize: 10, color: "var(--text3)", wordBreak: "break-all" }}>{selectedItem.googleDriveId || "—"}</code>],
                    ].map(([label, val]) => (
                      <div key={label} className={styles.detailRow}>
                        <span>{label}</span><span>{val}</span>
                      </div>
                    ))}
                  </div>

                  {selectedItem.reason && (
                    <div className={styles.previewBox}>
                      <div className={styles.previewLabel}>Lý do AI</div>
                      <div className={styles.previewText}>{selectedItem.reason}</div>
                    </div>
                  )}

                  <div className={styles.overrideSection}>
                    <div className={styles.detailSectionTitle}>Phân loại thủ công</div>
                    <select
                      className={styles.catSelectLarge}
                      value={overrides[selectedItem.id] || selectedItem.category || "Khác"}
                      onChange={e => setOverrides(prev => ({ ...prev, [selectedItem.id]: e.target.value }))}
                    >
                      {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {selectedItem.googleDriveId && (
                    <a
                      href={driveUrl(selectedItem.googleDriveId)}
                      target="_blank" rel="noreferrer"
                      className="btn"
                      style={{ textDecoration: "none", textAlign: "center" }}
                    >
                      🔗 Mở Google Drive
                    </a>
                  )}

                  <div className={styles.detailButtons}>
                    <button className={styles.rejectBtnLg}  onClick={() => reject(selectedItem.id)}>✕ Từ chối</button>
                    <button className={styles.approveBtnLg} onClick={() => approve(selectedItem.id)}>✓ Duyệt</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noSelect}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
                <div>Chọn tài liệu để xem chi tiết</div>
              </div>
            )}

            {resolved.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                  <span className="card-title">Đã xử lý ({resolved.length})</span>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {resolved.slice(-5).reverse().map((r, i) => (
                    <div key={i} className={styles.resolvedItem}>
                      <span className={`dot ${r.action === "approved" ? "dot-green" : "dot-red"}`} />
                      <span className={styles.resolvedName}>{r.fileName}</span>
                      <span style={{ fontSize: 11, color: r.action === "approved" ? "var(--green)" : "var(--red)", marginLeft: "auto" }}>
                        {r.action === "approved" ? "✓ Duyệt" : "✕ Từ chối"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}