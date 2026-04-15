import styles from "./Topbar.module.css";

const PAGE_TITLES = {
  dashboard:      "Dashboard",
  documents:      "Documents",
  upload:         "Upload",
  classification: "Classification",
  routing:        "Routing",
  pending:        "Pending",
  reports:        "Reports",
  landing:        "Landing",
};

export default function Topbar({ activePage }) {
  const title = PAGE_TITLES[activePage] || "Dashboard";

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div>
          <div className={styles.breadcrumb}>
            Landing / <span>{title}</span>
          </div>
          <div className={styles.title}>{title}</div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Live
        </div>
        <button className="btn">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Upload
        </button>
        <button className="btn btn-primary">Export báo cáo</button>
      </div>
    </header>
  );
}
