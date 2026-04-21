import { useState } from "react";
import styles from "./Pending.module.css";

const INIT_PENDING = [
  { id: 1, name: "Resume_JohnDoe.pdf",      size:"198 KB", pages:3, suggested:"hr",      confidence:58, reason:"Thiếu từ khóa rõ ràng",  date:"2024-12-20 09:14", preview:"Tài liệu có vẻ là hồ sơ cá nhân, nhưng không chắc chắn về loại." },
  { id: 2, name: "HopDong_ThangLong.pdf",   size:"890 KB", pages:12,suggested:"contract", confidence:61, reason:"Độ tin cậy dưới ngưỡng",  date:"2024-12-20 08:55", preview:"Phát hiện nội dung hợp đồng, tuy nhiên format không chuẩn." },
  { id: 3, name: "TaiLieu_Misc_001.pdf",    size:"340 KB", pages:5, suggested:"other",    confidence:42, reason:"Không xác định được loại", date:"2024-12-19 17:30", preview:"AI không thể xác định rõ loại tài liệu này." },
  { id: 4, name: "BaoCao_Draft_v2.docx",    size:"512 KB", pages:8, suggested:"report",   confidence:64, reason:"Độ tin cậy dưới ngưỡng",  date:"2024-12-19 15:10", preview:"Có vẻ là báo cáo, nhưng cần xác nhận." },
  { id: 5, name: "NhanVien_HoSo_NEW.pdf",   size:"220 KB", pages:4, suggested:"hr",       confidence:55, reason:"Thiếu từ khóa rõ ràng",  date:"2024-12-19 11:45", preview:"Hồ sơ cá nhân mới, format khác thường." },
  { id: 6, name: "Invoice_Unclear_009.pdf", size:"145 KB", pages:2, suggested:"invoice",  confidence:60, reason:"Số liệu không rõ ràng",   date:"2024-12-18 16:22", preview:"Phát hiện số tiền và ngày tháng nhưng thiếu thông tin VAT." },
];

const ALL_CATEGORIES = [
  { value:"invoice",  label:"Hóa đơn",       bg:"#4f7bff18", text:"#7fa3ff" },
  { value:"contract", label:"Hợp đồng",       bg:"#22d4f018", text:"#22d4f0" },
  { value:"hr",       label:"HR",             bg:"#7c5fff18", text:"#a080ff" },
  { value:"po",       label:"Purchase Order", bg:"#22c97b18", text:"#22c97b" },
  { value:"report",   label:"Báo cáo",        bg:"#f5a62318", text:"#f5a623" },
  { value:"other",    label:"Khác",           bg:"#ffffff10", text:"#8b90a8" },
];

const CAT_MAP = Object.fromEntries(ALL_CATEGORIES.map(c => [c.value, c]));

function ConfBadge({ value }) {
  const color = value >= 70 ? "var(--green)" : value >= 50 ? "var(--amber)" : "var(--red)";
  return <span style={{ color, fontSize:12, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>{value}%</span>;
}

export default function Pending() {
  const [items,    setItems]    = useState(INIT_PENDING);
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({}); // id -> category override
  const [resolved, setResolved] = useState([]);   // resolved items for history

  const selectedItem = items.find(i => i.id === selected);

  const approve = (id) => {
    const item = items.find(i => i.id === id);
    const finalCat = overrides[id] || item.suggested;
    setResolved(prev => [...prev, { ...item, action:"approved", finalCat }]);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected === id) setSelected(null);
  };

  const reject = (id) => {
    const item = items.find(i => i.id === id);
    setResolved(prev => [...prev, { ...item, action:"rejected" }]);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected === id) setSelected(null);
  };

  const setOverride = (id, cat) => {
    setOverrides(prev => ({ ...prev, [id]: cat }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Pending Review</h2>
          <p className={styles.pageDesc}>
            {items.length} tài liệu cần duyệt thủ công
            {resolved.length > 0 && ` · ${resolved.length} đã xử lý`}
          </p>
        </div>
        {items.length > 0 && (
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={() => items.forEach(i => reject(i.id))}>Từ chối tất cả</button>
            <button className="btn btn-primary" onClick={() => items.forEach(i => approve(i.id))}>Duyệt tất cả</button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <div className={styles.emptyTitle}>Không có gì cần duyệt</div>
          <div className={styles.emptyDesc}>Tất cả tài liệu đã được xử lý · {resolved.length} đã xử lý trong phiên này</div>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* List */}
          <div className={styles.listCol}>
            {items.map((item) => {
              const cat = CAT_MAP[overrides[item.id] || item.suggested];
              const isSelected = selected === item.id;
              return (
                <div
                  key={item.id}
                  className={`${styles.itemCard} ${isSelected ? styles.itemCardActive : ""}`}
                  onClick={() => setSelected(isSelected ? null : item.id)}
                >
                  <div className={styles.itemTop}>
                    <div className={styles.itemName}>{item.name}</div>
                    <ConfBadge value={item.confidence} />
                  </div>
                  <div className={styles.itemMeta}>
                    <span className="badge" style={{background:cat.bg,color:cat.text}}>{cat.label}</span>
                    <span className={styles.itemReason}>{item.reason}</span>
                    <span className={styles.itemDate}>{item.date}</span>
                  </div>
                  <div className={styles.itemActions} onClick={e=>e.stopPropagation()}>
                    {/* Category override */}
                    <select
                      className={styles.catSelect}
                      value={overrides[item.id] || item.suggested}
                      onChange={e => setOverride(item.id, e.target.value)}
                    >
                      {ALL_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <button className={styles.rejectBtn} onClick={() => reject(item.id)}>✕ Từ chối</button>
                    <button className={styles.approveBtn} onClick={() => approve(item.id)}>✓ Duyệt</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className={styles.detailCol}>
            {selectedItem ? (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Chi tiết</span>
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailName}>{selectedItem.name}</div>

                  {/* AI suggestion */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>AI đề xuất</div>
                    <div className={styles.detailRow}>
                      <span>Danh mục</span>
                      {(() => { const c = CAT_MAP[selectedItem.suggested]; return <span className="badge" style={{background:c.bg,color:c.text}}>{c.label}</span>; })()}
                    </div>
                    <div className={styles.detailRow}>
                      <span>Độ tin cậy</span>
                      <ConfBadge value={selectedItem.confidence} />
                    </div>
                    <div className={styles.detailRow}>
                      <span>Lý do chờ</span>
                      <span className={styles.detailVal}>{selectedItem.reason}</span>
                    </div>
                  </div>

                  {/* File info */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>Thông tin file</div>
                    <div className={styles.detailRow}><span>Kích thước</span><span className={styles.detailVal}>{selectedItem.size}</span></div>
                    <div className={styles.detailRow}><span>Số trang</span><span className={styles.detailVal}>{selectedItem.pages}</span></div>
                    <div className={styles.detailRow}><span>Nhận lúc</span><span className={styles.detailVal}>{selectedItem.date}</span></div>
                  </div>

                  {/* AI preview */}
                  <div className={styles.previewBox}>
                    <div className={styles.previewLabel}>Nhận xét AI</div>
                    <div className={styles.previewText}>{selectedItem.preview}</div>
                  </div>

                  {/* Override */}
                  <div className={styles.overrideSection}>
                    <div className={styles.detailSectionTitle}>Phân loại thủ công</div>
                    <select
                      className={styles.catSelectLarge}
                      value={overrides[selectedItem.id] || selectedItem.suggested}
                      onChange={e => setOverride(selectedItem.id, e.target.value)}
                    >
                      {ALL_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.detailButtons}>
                    <button className={styles.rejectBtnLg} onClick={() => reject(selectedItem.id)}>✕ Từ chối</button>
                    <button className={styles.approveBtnLg} onClick={() => approve(selectedItem.id)}>✓ Duyệt</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noSelect}>
                <div style={{fontSize:32,marginBottom:8}}>👆</div>
                <div>Chọn tài liệu để xem chi tiết</div>
              </div>
            )}

            {/* Resolved history */}
            {resolved.length > 0 && (
              <div className="card" style={{marginTop:16}}>
                <div className="card-header"><span className="card-title">Đã xử lý ({resolved.length})</span></div>
                <div style={{padding:"8px 0"}}>
                  {resolved.slice(-5).reverse().map((r, i) => (
                    <div key={i} className={styles.resolvedItem}>
                      <span className={`dot ${r.action === "approved" ? "dot-green" : "dot-red"}`} />
                      <span className={styles.resolvedName}>{r.name}</span>
                      <span style={{fontSize:11,color:r.action==="approved"?"var(--green)":"var(--red)",marginLeft:"auto"}}>
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
