import { useState } from "react";
import styles from "./Classification.module.css";

const RULES = [
  { id: 1, name: "Hóa đơn VAT",      category: "invoice",  keywords: ["invoice", "VAT", "hóa đơn", "thuế"],  confidence: 94, docs: 42, active: true },
  { id: 2, name: "Hợp đồng pháp lý", category: "contract", keywords: ["contract", "hợp đồng", "NDA", "điều khoản"], confidence: 91, docs: 28, active: true },
  { id: 3, name: "Hồ sơ nhân sự",    category: "hr",       keywords: ["resume", "CV", "nhân sự", "tuyển dụng"],  confidence: 88, docs: 15, active: true },
  { id: 4, name: "Purchase Order",   category: "po",       keywords: ["PO", "purchase", "đặt hàng", "procurement"], confidence: 96, docs: 19, active: true },
  { id: 5, name: "Báo cáo định kỳ",  category: "report",   keywords: ["báo cáo", "report", "summary", "Q1","Q2","Q3","Q4"], confidence: 85, docs: 14, active: true },
  { id: 6, name: "Tài liệu khác",    category: "other",    keywords: ["misc", "khác"],                         confidence: 72, docs: 6,  active: false },
];

const RECENT_CLASSIFIED = [
  { name: "Invoice_2024_088.pdf",    category: "invoice",  confidence: 97, model: "Groq / Llama 3.3", time: "2 phút trước" },
  { name: "Contract_ABC_Corp.docx",  category: "contract", confidence: 93, model: "Groq / Llama 3.3", time: "5 phút trước" },
  { name: "BaoCao_Q4_Final.xlsx",    category: "report",   confidence: 89, model: "Groq / Llama 3.3", time: "11 phút trước" },
  { name: "Resume_NguyenThi.pdf",    category: "hr",       confidence: 84, model: "Groq / Llama 3.3", time: "18 phút trước" },
  { name: "PO_Dec_2024_0045.pdf",    category: "po",       confidence: 98, model: "Groq / Llama 3.3", time: "22 phút trước" },
];

const CAT_COLORS = {
  invoice:  { bg: "#4f7bff18", text: "#7fa3ff", label: "Hóa đơn" },
  contract: { bg: "#22d4f018", text: "#22d4f0", label: "Hợp đồng" },
  hr:       { bg: "#7c5fff18", text: "#a080ff", label: "HR" },
  po:       { bg: "#22c97b18", text: "#22c97b", label: "Purchase Order" },
  report:   { bg: "#f5a62318", text: "#f5a623", label: "Báo cáo" },
  other:    { bg: "#ffffff10", text: "#8b90a8", label: "Khác" },
};

function ConfidenceBar({ value }) {
  const color = value >= 90 ? "var(--green)" : value >= 75 ? "var(--amber)" : "var(--red)";
  return (
    <div className={styles.confBar}>
      <div className={styles.confFill} style={{ width: value + "%", background: color }} />
      <span className={styles.confLabel} style={{ color }}>{value}%</span>
    </div>
  );
}

export default function Classification() {
  const [rules, setRules] = useState(RULES);
  const [selected, setSelected] = useState(null);

  const toggleRule = (id) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const avgConf = Math.round(RULES.reduce((a, r) => a + r.confidence, 0) / RULES.length);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Classification</h2>
          <p className={styles.pageDesc}>Quản lý quy tắc và mô hình AI phân loại tài liệu</p>
        </div>
        <button className="btn btn-primary">+ Thêm quy tắc</button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {[
          { label: "Quy tắc active", value: rules.filter(r=>r.active).length, color: "var(--accent)" },
          { label: "Độ chính xác TB", value: avgConf + "%", color: "var(--green)" },
          { label: "Mô hình AI", value: "Llama 3.3", color: "var(--cyan)" },
          { label: "Đã phân loại hôm nay", value: "118", color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className={styles.statChip}>
            <div className={styles.statChipValue} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.statChipLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Rules */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quy tắc phân loại</span>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>{rules.filter(r=>r.active).length}/{rules.length} active</span>
          </div>
          <div className={styles.ruleList}>
            {rules.map((rule) => {
              const cat = CAT_COLORS[rule.category];
              return (
                <div
                  key={rule.id}
                  className={`${styles.ruleItem} ${selected === rule.id ? styles.ruleSelected : ""} ${!rule.active ? styles.ruleInactive : ""}`}
                  onClick={() => setSelected(selected === rule.id ? null : rule.id)}
                >
                  <div className={styles.ruleLeft}>
                    <span className="badge" style={{ background: cat.bg, color: cat.text }}>{cat.label}</span>
                    <div>
                      <div className={styles.ruleName}>{rule.name}</div>
                      <div className={styles.ruleKeywords}>
                        {rule.keywords.slice(0, 3).map(k => (
                          <span key={k} className={styles.keyword}>{k}</span>
                        ))}
                        {rule.keywords.length > 3 && <span className={styles.keyword}>+{rule.keywords.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                  <div className={styles.ruleRight}>
                    <ConfidenceBar value={rule.confidence} />
                    <div className={styles.ruleDocs}>{rule.docs} docs</div>
                    <button
                      className={`${styles.toggle} ${rule.active ? styles.toggleOn : styles.toggleOff}`}
                      onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}
                    >
                      <div className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col */}
        <div className={styles.rightCol}>
          {/* Recent classified */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Vừa phân loại</span>
            </div>
            <div className={styles.recentList}>
              {RECENT_CLASSIFIED.map((doc) => {
                const cat = CAT_COLORS[doc.category];
                return (
                  <div key={doc.name} className={styles.recentItem}>
                    <div className={styles.recentName}>{doc.name}</div>
                    <div className={styles.recentMeta}>
                      <span className="badge" style={{ background: cat.bg, color: cat.text, fontSize: 10 }}>{cat.label}</span>
                      <span className={styles.recentConf} style={{ color: doc.confidence >= 90 ? "var(--green)" : "var(--amber)" }}>
                        {doc.confidence}%
                      </span>
                      <span className={styles.recentTime}>{doc.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Mô hình AI</span></div>
            <div className={styles.modelBox}>
              <div className={styles.modelIcon}>🤖</div>
              <div className={styles.modelName}>Groq / Llama 3.3-70B</div>
              <div className={styles.modelMeta}>Fast inference · ~0.3s / doc</div>
              <div className={styles.modelStats}>
                <div className={styles.modelStat}><span style={{color:"var(--green)"}}>●</span> Online</div>
                <div className={styles.modelStat}>Avg. {avgConf}% conf.</div>
                <div className={styles.modelStat}>118 calls today</div>
              </div>
              <div className={styles.modelBar}>
                <div className={styles.modelBarLabel}>
                  <span>Tải hệ thống</span><span style={{color:"var(--green)"}}>32%</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: "32%", background: "var(--green)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
