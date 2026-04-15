import { useEffect, useRef } from "react";
import styles from "./StatCard.module.css";

export default function StatCard({ label, value, sub, subType, icon, color }) {
  const ref = useRef(null);

  /* Count-up animation */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = value;
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current);
      if (current >= target) clearInterval(timer);
    }, 800 / 60);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div>
        <div className={styles.label}>{label}</div>
        <div className={styles.value} ref={ref}>0</div>
        <div className={styles.sub}>
          <span className={styles[subType]}>{sub}</span>
        </div>
      </div>
      <div className={`${styles.icon} ${styles[`icon-${color}`]}`}>
        {icon}
      </div>
    </div>
  );
}
