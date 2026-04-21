import { useEffect, useRef } from "react";
import styles from "./Reports.module.css";

const WEEKLY = [
  { day:"T2", total:80,  done:70  },
  { day:"T3", total:110, done:98  },
  { day:"T4", total:95,  done:90  },
  { day:"T5", total:140, done:132 },
  { day:"T6", total:125, done:118 },
  { day:"T7", total:160, done:152 },
  { day:"CN", total:124, done:118 },
];

const MONTHLY = [
  { month:"Th7",  docs:1820, acc:91 },
  { month:"Th8",  docs:2100, acc:92 },
  { month:"Th9",  docs:1950, acc:90 },
  { month:"Th10", docs:2380, acc:93 },
  { month:"Th11", docs:2650, acc:94 },
  { month:"Th12", docs:2840, acc:95 },
];

const CATEGORIES = [
  { label:"Hóa đơn",       value:42, pct:34, color:"var(--accent)" },
  { label:"Hợp đồng",      value:28, pct:23, color:"var(--cyan)" },
  { label:"Purchase Order", value:19, pct:15, color:"var(--green)" },
  { label:"HR",             value:15, pct:12, color:"var(--accent2)" },
  { label:"Báo cáo",        value:14, pct:11, color:"var(--amber)" },
  { label:"Khác",           value:6,  pct:5,  color:"var(--text3)" },
];

const TOP_ROUTES = [
  { route:"Kế toán",    count:284, pct:92, trend:"+8%" },
  { route:"Pháp lý",    count:196, pct:78, trend:"+3%" },
  { route:"Mua hàng",   count:142, pct:96, trend:"+12%" },
  { route:"Nhân sự",    count:98,  pct:85, trend:"+1%" },
  { route:"Vận hành",   count:86,  pct:88, trend:"+5%" },
];

const SUMMARY = [
  { label:"Tổng tháng này",  value:"2,840",  sub:"↑ 7.2% vs tháng trước", color:"var(--accent)" },
  { label:"Độ chính xác",    value:"95.2%",  sub:"↑ 1.1pp vs tháng trước", color:"var(--green)" },
  { label:"Thời gian xử lý", value:"1.4s",   sub:"↓ 0.2s cải thiện",       color:"var(--cyan)" },
  { label:"Cần review",      value:"2.8%",   sub:"↓ 0.5pp vs tháng trước", color:"var(--amber)" },
];

function BarChart({ data, maxKey, valueKey, labelKey, color1, color2 }) {
  const max = Math.max(...data.map(d => d[maxKey]));
  return (
    <div className={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.barGroup}>
          <div className={styles.barStack}>
            <div
              className={styles.barBg}
              style={{ height: Math.round((d[maxKey] / max) * 100) + "%" }}
            />
            <div
              className={styles.barFg}
              style={{
                height: Math.round((d[valueKey] / max) * 100) + "%",
                background: color1,
              }}
            />
          </div>
          <div className={styles.barLabel}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll("[data-bar-pct]").forEach(el => {
        el.style.width = el.dataset.barPct + "%";
      });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Reports</h2>
          <p className={styles.pageDesc}>Phân tích hiệu suất hệ thống · Tháng 12/2024</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <select className={styles.periodSelect}>
            <option>Tháng này</option>
            <option>7 ngày</option>
            <option>Quý này</option>
            <option>Năm nay</option>
          </select>
          <button className="btn btn-primary">Xuất báo cáo</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        {SUMMARY.map((s) => (
          <div key={s.label} className={styles.summaryCard}>
            <div className={styles.summaryLabel}>{s.label}</div>
            <div className={styles.summaryValue} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.summarySub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Weekly volume */}
        <div className="card" style={{flex:1}}>
          <div className="card-header">
            <span className="card-title">Khối lượng tuần này</span>
            <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text3)"}}>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--accent)",marginRight:4}}/>Xử lý</span>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"var(--surface3)",marginRight:4}}/>Tổng</span>
            </div>
          </div>
          <div className={styles.chartWrap}>
            <BarChart
              data={WEEKLY}
              maxKey="total"
              valueKey="done"
              labelKey="day"
              color1="var(--accent)"
            />
          </div>
        </div>

        {/* Monthly trend */}
        <div className="card" style={{flex:1}}>
          <div className="card-header">
            <span className="card-title">Xu hướng 6 tháng</span>
          </div>
          <div className={styles.chartWrap}>
            <BarChart
              data={MONTHLY}
              maxKey="docs"
              valueKey="docs"
              labelKey="month"
              color1="var(--cyan)"
            />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow}>
        {/* Categories breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Phân bổ danh mục</span>
            <span style={{fontSize:12,color:"var(--text3)"}}>Tổng 124 hôm nay</span>
          </div>
          <div className={styles.catBreakdown}>
            {/* Donut chart (CSS) */}
            <div className={styles.donut}>
              <div className={styles.donutInner}>
                <div className={styles.donutValue}>124</div>
                <div className={styles.donutLabel}>docs</div>
              </div>
            </div>
            {/* Legend */}
            <div className={styles.catLegend}>
              {CATEGORIES.map((c) => (
                <div key={c.label} className={styles.catLegendItem}>
                  <div className={styles.catLegendBar}>
                    <div className={styles.catLegendLeft}>
                      <span className={styles.catLegendDot} style={{background:c.color}} />
                      <span className={styles.catLegendLabel}>{c.label}</span>
                    </div>
                    <div className={styles.catLegendRight}>
                      <span className={styles.catLegendCount}>{c.value}</span>
                      <span className={styles.catLegendPct}>{c.pct}%</span>
                    </div>
                  </div>
                  <div className={styles.catTrack}>
                    <div
                      className={styles.catFill}
                      data-bar-pct={c.pct}
                      style={{ background: c.color, width: 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top routes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top routes</span>
            <span style={{fontSize:12,color:"var(--text3)"}}>Tháng này</span>
          </div>
          <div className={styles.routeList}>
            {TOP_ROUTES.map((r, i) => (
              <div key={r.route} className={styles.routeItem}>
                <div className={styles.routeRank}>#{i+1}</div>
                <div className={styles.routeInfo}>
                  <div className={styles.routeRow}>
                    <span className={styles.routeName}>{r.route}</span>
                    <span className={styles.routeTrend} style={{color:"var(--green)"}}>{r.trend}</span>
                  </div>
                  <div className={styles.routeMeta}>
                    <span>{r.count} files</span>
                    <span>· {r.pct}% thành công</span>
                  </div>
                  <div className={styles.routeTrack}>
                    <div
                      className={styles.routeFill}
                      data-bar-pct={r.pct}
                      style={{ background: "var(--accent)", width: 0 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Độ chính xác AI</span>
          </div>
          <div className={styles.accList}>
            {MONTHLY.map((m) => (
              <div key={m.month} className={styles.accItem}>
                <div className={styles.accMonth}>{m.month}</div>
                <div className={styles.accTrack}>
                  <div
                    className={styles.accFill}
                    data-bar-pct={m.acc}
                    style={{ background: "var(--green)", width: 0 }}
                  />
                </div>
                <div className={styles.accVal} style={{color:"var(--green)"}}>{m.acc}%</div>
              </div>
            ))}
            <div className={styles.accNote}>
              Mô hình: Groq / Llama 3.3-70B · Ngưỡng duyệt: 70%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
