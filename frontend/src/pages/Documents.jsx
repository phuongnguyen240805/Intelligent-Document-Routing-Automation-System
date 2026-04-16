import { useState, useMemo } from "react";
import styles from "./Documents.module.css";

/* ── Mock data ── */
const ALL_DOCS = [
  { id: 1,  name: "Invoice_2024_001.pdf",       category: "invoice",  catLabel: "Hóa đơn",       route: "Kế toán",    size: "284 KB",  pages: 2,  date: "2024-12-20", status: "routed" },
  { id: 2,  name: "Contract_NDA_Acme.docx",     category: "contract", catLabel: "Hợp đồng",       route: "Pháp lý",    size: "512 KB",  pages: 8,  date: "2024-12-20", status: "routed" },
  { id: 3,  name: "Resume_JohnDoe.pdf",         category: "hr",       catLabel: "HR",             route: "Nhân sự",    size: "198 KB",  pages: 3,  date: "2024-12-19", status: "pending" },
  { id: 4,  name: "PO_2024_0891.pdf",           category: "po",       catLabel: "Purchase Order", route: "Mua hàng",   size: "145 KB",  pages: 1,  date: "2024-12-19", status: "routed" },
  { id: 5,  name: "Report_Q4_Summary.xlsx",     category: "report",   catLabel: "Báo cáo",        route: "Vận hành",   size: "1.2 MB",  pages: 24, date: "2024-12-18", status: "routed" },
  { id: 6,  name: "HopDong_ThangLong.pdf",      category: "contract", catLabel: "Hợp đồng",       route: "Pháp lý",    size: "890 KB",  pages: 12, date: "2024-12-18", status: "review" },
  { id: 7,  name: "Invoice_2024_002.pdf",       category: "invoice",  catLabel: "Hóa đơn",       route: "Kế toán",    size: "312 KB",  pages: 2,  date: "2024-12-17", status: "routed" },
  { id: 8,  name: "BaoCao_Q3_2024.pdf",         category: "report",   catLabel: "Báo cáo",        route: "Vận hành",   size: "2.1 MB",  pages: 36, date: "2024-12-17", status: "routed" },
  { id: 9,  name: "NhanVien_NguyenVanA.pdf",    category: "hr",       catLabel: "HR",             route: "Nhân sự",    size: "234 KB",  pages: 4,  date: "2024-12-16", status: "routed" },
  { id: 10, name: "PO_2024_0892.pdf",           category: "po",       catLabel: "Purchase Order", route: "Mua hàng",   size: "167 KB",  pages: 1,  date: "2024-12-16", status: "routed" },
  { id: 11, name: "Invoice_2024_003.pdf",       category: "invoice",  catLabel: "Hóa đơn",       route: "Kế toán",    size: "298 KB",  pages: 2,  date: "2024-12-15", status: "routed" },
  { id: 12, name: "Contract_Supplier_B.pdf",    category: "contract", catLabel: "Hợp đồng",       route: "Pháp lý",    size: "445 KB",  pages: 6,  date: "2024-12-15", status: "review" },
];

const CATEGORIES = ["Tất cả", "Hóa đơn", "Hợp đồng", "HR", "Purchase Order", "Báo cáo"];
const STATUSES   = ["Tất cả", "Đã xử lý", "Chờ duyệt", "Cần xem lại"];

const CAT_MAP    = { "Hóa đơn": "invoice", "Hợp đồng": "contract", "HR": "hr", "Purchase Order": "po", "Báo cáo": "report" };
const STATUS_MAP = { "Đã xử lý": "routed", "Chờ duyệt": "pending", "Cần xem lại": "review" };

const STATUS_DOT   = { routed: "dot-green", pending: "dot-amber", review: "dot-red" };
const STATUS_LABEL = { routed: "Đã xử lý",  pending: "Chờ duyệt",  review: "Cần xem lại" };

function FileIcon({ category }) {
  const colors = { invoice: "#4f7bff", contract: "#22d4f0", hr: "#7c5fff", po: "#22c97b", report: "#f5a623" };
  const color  = colors[category] || "#8b90a8";
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <path d="M2 2h10l4 4v14a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" fill={color + "22"} stroke={color} strokeWidth="1.2"/>
      <path d="M12 2v5h5" stroke={color} strokeWidth="1.2"/>
      <path d="M4 10h9M4 13h7M4 16h5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

export default function Documents() {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selected,  setSelected]  = useState(null);
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    return ALL_DOCS.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchCat    = catFilter === "Tất cả" || d.category === CAT_MAP[catFilter];
      const matchStatus = statusFilter === "Tất cả" || d.status === STATUS_MAP[statusFilter];
      return matchSearch && matchCat && matchStatus;
    });
  }, [search, catFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleFilter = (setter, val) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tài liệu</h2>
          <p className={styles.pageDesc}>{filtered.length} tài liệu được tìm thấy</p>
        </div>
        <button className="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Upload mới
        </button>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            className={styles.search}
            placeholder="Tìm kiếm tên file..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Category pills */}
        <div className={styles.pills}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`${styles.pill} ${catFilter === c ? styles.pillActive : ""}`}
              onClick={() => handleFilter(setCatFilter, c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Status select */}
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => handleFilter(setStatusFilter, e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Tên file</th>
              <th>Danh mục</th>
              <th>Định tuyến</th>
              <th>Kích thước</th>
              <th>Ngày</th>
              <th>Trạng thái</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>Không tìm thấy tài liệu nào</td>
              </tr>
            ) : paginated.map((doc) => (
              <tr
                key={doc.id}
                className={selected === doc.id ? styles.rowSelected : ""}
                onClick={() => setSelected(selected === doc.id ? null : doc.id)}
              >
                <td className={styles.iconCell}><FileIcon category={doc.category} /></td>
                <td>
                  <div className={styles.docName}>{doc.name}</div>
                  <div className={styles.docMeta}>{doc.pages} trang</div>
                </td>
                <td><span className={`badge badge-${doc.category}`}>{doc.catLabel}</span></td>
                <td className={styles.muted}>{doc.route}</td>
                <td className={styles.muted}>{doc.size}</td>
                <td className={styles.muted}>{doc.date}</td>
                <td>
                  <span className="status-dot">
                    <span className={`dot ${STATUS_DOT[doc.status]}`} />
                    {STATUS_LABEL[doc.status]}
                  </span>
                </td>
                <td>
                  <button className={styles.actionBtn} title="Tải xuống">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1v9M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}
            </span>
            <div className={styles.pageButtons}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >Sau →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selected && (() => {
        const doc = ALL_DOCS.find(d => d.id === selected);
        if (!doc) return null;
        return (
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <FileIcon category={doc.category} />
              <div className={styles.drawerTitle}>{doc.name}</div>
              <button className={styles.drawerClose} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.drawerRow}><span>Danh mục</span><span className={`badge badge-${doc.category}`}>{doc.catLabel}</span></div>
              <div className={styles.drawerRow}><span>Định tuyến</span><span>{doc.route}</span></div>
              <div className={styles.drawerRow}><span>Kích thước</span><span>{doc.size}</span></div>
              <div className={styles.drawerRow}><span>Số trang</span><span>{doc.pages}</span></div>
              <div className={styles.drawerRow}><span>Ngày xử lý</span><span>{doc.date}</span></div>
              <div className={styles.drawerRow}>
                <span>Trạng thái</span>
                <span className="status-dot">
                  <span className={`dot ${STATUS_DOT[doc.status]}`} />
                  {STATUS_LABEL[doc.status]}
                </span>
              </div>
            </div>
            <div className={styles.drawerActions}>
              <button className="btn" style={{ flex: 1 }}>Xem file</button>
              <button className="btn btn-primary" style={{ flex: 1 }}>Tải xuống</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
