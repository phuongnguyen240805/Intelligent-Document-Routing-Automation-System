import styles from "./Sidebar.module.css";

const NAV_MAIN = [
  { id: "landing",    label: "Landing",    icon: <GridIcon /> },
  { id: "dashboard",  label: "Dashboard",  icon: <ClockIcon /> },
  { id: "documents",  label: "Documents",  icon: <DocIcon /> },
  { id: "upload",     label: "Upload",     icon: <PlusIcon /> },
];

const NAV_PROCESSING = [
  { id: "classification", label: "Classification", icon: <ListIcon /> },
  { id: "routing",        label: "Routing",        icon: <ChartIcon /> },
  { id: "pending",        label: "Pending",        icon: <TimeIcon /> },
];

const NAV_REPORTS = [
  { id: "reports", label: "Reports", icon: <TrendIcon /> },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <div className={styles.logoIcon}>ID</div>
          <div>
            <div className={styles.logoText}>IDRAS</div>
            <div className={styles.logoSub}>Document System</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <NavSection label="Main" items={NAV_MAIN} activePage={activePage} onNavigate={onNavigate} />
      <NavSection label="Processing" items={NAV_PROCESSING} activePage={activePage} onNavigate={onNavigate} />
      <NavSection label="Reports" items={NAV_REPORTS} activePage={activePage} onNavigate={onNavigate} />

      {/* User footer */}
      <div className={styles.footer}>
        <div className={styles.avatar}>TH</div>
        <div>
          <div className={styles.userName}>Thu</div>
          <div className={styles.userRole}>Admin</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, items, activePage, onNavigate }) {
  return (
    <div className={styles.navSection}>
      <div className={styles.navLabel}>{label}</div>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navItem} ${activePage === item.id ? styles.active : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {item.label}
          {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Inline SVG icons ── */
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4v4l2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h4l2-5 3 9 2-4h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function TimeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l4-5 3 3 3-6 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
