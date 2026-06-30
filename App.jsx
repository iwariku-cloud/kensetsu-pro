import { useState } from "react";

const EXPENSE_CATEGORIES = ["駐車場代", "高速代", "ガソリン代", "材料費", "外注費", "宿泊費", "その他経費"];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n) => "¥" + Math.round(n).toLocaleString();
const pct = (a, b) => (b === 0 ? 0 : ((a / b) * 100).toFixed(1));

function calcLaborCost(siteId, attendance, employees) {
  const records = attendance.filter((a) => a.siteId === siteId && a.status === "出勤");
  let total = 0;
  for (const r of records) {
    const emp = employees.find((e) => e.id === r.employeeId);
    if (!emp) continue;
    const overtimePay = (emp.dailyRate / 8) * 1.25 * r.overtime;
    total += emp.dailyRate + overtimePay;
  }
  return total;
}

function calcExpenses(siteId, expenses) {
  return expenses.filter((e) => e.siteId === siteId).reduce((s, e) => s + e.amount, 0);
}

// ─── COLOURS / TOKENS ───────────────────────────────────────────────────────
// Palette: construction steel (#1C2B3A), safety orange (#E8600A), cement (#8C9BAB), profit green (#1A8C5B)
const C = {
  bg: "#F0F2F5",
  panel: "#FFFFFF",
  steel: "#1C2B3A",
  orange: "#E8600A",
  cement: "#8C9BAB",
  green: "#1A8C5B",
  red: "#C0392B",
  border: "#D9DEE6",
  text: "#1C2B3A",
  muted: "#6B7A8D",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans JP', sans-serif; background: ${C.bg}; color: ${C.text}; }
  button { cursor: pointer; font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; } 
  ::-webkit-scrollbar-thumb { background: ${C.cement}; border-radius: 3px; }
`;

// ─── SMALL COMPONENTS ───────────────────────────────────────────────────────
function Badge({ status }) {
  const colors = {
    "施工中": { bg: "#FFF3E0", color: C.orange, border: "#FFB74D" },
    "完工": { bg: "#E8F5E9", color: C.green, border: "#66BB6A" },
    "完工（日程未定）": { bg: "#EDE7F6", color: "#6A3CA5", border: "#B39DDB" },
  };
  const s = colors[status] || { bg: "#F3F4F6", color: C.muted, border: C.border };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700, border: `1px solid ${s.border}`, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.panel, borderRadius: 8, padding: "18px 20px", borderLeft: `4px solid ${accent}`, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.steel }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProfitBar({ revenue, labor, expense }) {
  const total = revenue || 1;
  const lPct = Math.min((labor / total) * 100, 100);
  const ePct = Math.min((expense / total) * 100, 100 - lPct);
  const profit = revenue - labor - expense;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#E8F5E9" }}>
        <div style={{ width: `${lPct}%`, background: C.orange }} />
        <div style={{ width: `${ePct}%`, background: C.cement }} />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.muted }}>
        <span><span style={{ color: C.orange }}>■</span> 人件費 {pct(labor, revenue)}%</span>
        <span><span style={{ color: C.cement }}>■</span> 経費 {pct(expense, revenue)}%</span>
        <span style={{ marginLeft: "auto", fontWeight: 700, color: profit >= 0 ? C.green : C.red }}>利益 {pct(profit, revenue)}%</span>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.panel, borderRadius: 10, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, background: "#FAFBFC" };
const btnStyle = (primary) => ({
  padding: "9px 18px", borderRadius: 6, fontSize: 13, fontWeight: 700,
  border: primary ? "none" : `1px solid ${C.border}`,
  background: primary ? C.orange : C.panel,
  color: primary ? "#fff" : C.text,
});

// ─── VIEWS ──────────────────────────────────────────────────────────────────

// Dashboard
function Dashboard({ sites, attendance, employees, expenses }) {
  const thisMonth = "2026-06";
  const profits = sites.map((s) => {
    const labor = calcLaborCost(s.id, attendance, employees);
    const exp = calcExpenses(s.id, expenses);
    return { ...s, labor, exp, profit: s.contractAmount - labor - exp };
  });

  const totalRevenue = profits.reduce((s, p) => s + p.contractAmount, 0);
  const totalProfit = profits.reduce((s, p) => s + p.profit, 0);
  const activeSites = profits.filter((p) => p.status === "施工中").length;
  const doneSites = profits.filter((p) => p.status === "完工").length;
  const ranked = [...profits].sort((a, b) => b.profit - a.profit);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>2026年6月 — 現況サマリー</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.steel }}>ダッシュボード</div>
      </div>

      {sites.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: C.steel }}>まだデータがありません</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            まず「現場管理」タブから現場を登録してください。<br />
            次に「従業員」を登録し、「出勤管理」で日々の出勤を記録すると<br />
            ここに利益が自動で表示されます。
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
            <KpiCard label="売上合計" value={fmt(totalRevenue)} accent={C.orange} />
            <KpiCard label="利益合計" value={fmt(totalProfit)} sub={`利益率 ${pct(totalProfit, totalRevenue)}%`} accent={C.green} />
            <KpiCard label="施工中" value={`${activeSites} 件`} accent={C.orange} />
            <KpiCard label="完工" value={`${doneSites} 件`} accent={C.cement} />
          </div>
          <div style={{ background: C.panel, borderRadius: 8, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>現場別 利益ランキング</div>
            {ranked.map((p, i) => (
              <div key={p.id} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? C.orange : C.border, color: i === 0 ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{p.client}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: p.profit >= 0 ? C.green : C.red }}>{fmt(p.profit)}</div>
                    <Badge status={p.status} />
                  </div>
                </div>
                <ProfitBar revenue={p.contractAmount} labor={p.labor} expense={p.exp} />
                {i < ranked.length - 1 && <div style={{ borderBottom: `1px solid ${C.border}`, marginTop: 16 }} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FLOOR DETAIL MODAL ──────────────────────────────────────────────────────
function FloorDetail({ site, floors, expenses, setExpenses, onClose }) {
  const [showExpForm, setShowExpForm] = useState(false);
  const [activeFloor, setActiveFloor] = useState(null);
  const [expForm, setExpForm] = useState({ category: "材料費", amount: "", date: "", memo: "" });
  const perFloor = site.totalFloors > 0 ? site.contractAmount / site.totalFloors : 0;

  const saveExp = () => {
    if (!expForm.amount || !activeFloor) return;
    setExpenses((prev) => [...prev, { ...expForm, id: Date.now(), siteId: site.id, floorId: activeFloor.id, amount: Number(expForm.amount) }]);
    setExpForm({ category: "材料費", amount: "", date: "", memo: "" });
    setShowExpForm(false);
  };

  const siteFloors = floors.filter((f) => f.siteId === site.id);

  return (
    <Modal title={`🏢 フロア別利益 — ${site.name}`} onClose={onClose}>
      <div style={{ marginBottom: 16, padding: "10px 14px", background: "#F7F8FA", borderRadius: 8, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>総請負金額</span><span style={{ fontWeight: 700 }}>{fmt(site.contractAmount)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span style={{ color: C.muted }}>総フロア数</span><span style={{ fontWeight: 700 }}>{site.totalFloors}F</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span style={{ color: C.muted }}>1Fあたり按分単価</span><span style={{ fontWeight: 700, color: C.orange }}>{fmt(perFloor)}</span></div>
      </div>

      {siteFloors.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: C.muted, fontSize: 13 }}>フロアが未登録です。現場追加時に「総フロア数」を入力してください。</div>
      ) : siteFloors.map((fl) => {
        const flExp = expenses.filter((e) => e.siteId === site.id && e.floorId === fl.id).reduce((s, e) => s + e.amount, 0);
        const flProfit = perFloor - flExp;
        return (
          <div key={fl.id} style={{ marginBottom: 12, padding: 14, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{fl.name}</span>
              <button style={{ ...btnStyle(false), padding: "4px 10px", fontSize: 12 }} onClick={() => { setActiveFloor(fl); setShowExpForm(true); }}>＋ 経費</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
              {[["按分売上", fmt(perFloor), C.steel], ["経費", fmt(flExp), C.cement], ["利益", fmt(flProfit), flProfit >= 0 ? C.green : C.red]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center", background: "#F7F8FA", borderRadius: 6, padding: "8px 4px" }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{l}</div>
                  <div style={{ fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            {expenses.filter((e) => e.siteId === site.id && e.floorId === fl.id).map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, padding: "4px 0", borderTop: `1px solid ${C.border}`, marginTop: 6 }}>
                <span><span style={{ background: "#EEE", borderRadius: 3, padding: "1px 6px", marginRight: 6 }}>{e.category}</span>{e.memo}</span>
                <span>{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
        );
      })}

      {showExpForm && activeFloor && (
        <Modal title={`経費追加 — ${activeFloor.name}`} onClose={() => setShowExpForm(false)}>
          <Field label="カテゴリ"><select style={inputStyle} value={expForm.category} onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="日付"><input style={inputStyle} type="date" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="金額（円）"><input style={inputStyle} type="number" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} /></Field>
          <Field label="メモ"><input style={inputStyle} value={expForm.memo} onChange={(e) => setExpForm((p) => ({ ...p, memo: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={btnStyle(false)} onClick={() => setShowExpForm(false)}>キャンセル</button>
            <button style={btnStyle(true)} onClick={saveExp}>保存</button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

// Sites list + detail
function Sites({ sites, setSites, floors, setFloors, attendance, employees, expenses, setExpenses }) {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showFloorDetail, setShowFloorDetail] = useState(null);
  const [endDateUnknown, setEndDateUnknown] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", address: "", startDate: "", endDate: "", contractAmount: "", status: "施工中", totalFloors: "" });
  const [expForm, setExpForm] = useState({ category: "材料費", amount: "", date: "", memo: "" });

  const resetForm = () => { setForm({ name: "", client: "", address: "", startDate: "", endDate: "", contractAmount: "", status: "施工中", totalFloors: "" }); setEndDateUnknown(false); };

  const save = () => {
    if (!form.name || !form.contractAmount) return;
    const newSite = { ...form, id: Date.now(), contractAmount: Number(form.contractAmount), totalFloors: Number(form.totalFloors) || 0, endDate: endDateUnknown ? "未定" : form.endDate };
    setSites((prev) => [...prev, newSite]);
    if (newSite.totalFloors > 0) {
      setFloors((prev) => [...prev, ...Array.from({ length: newSite.totalFloors }, (_, i) => ({ id: Date.now() + i + 1, siteId: newSite.id, name: `${i + 1}F` }))]);
    }
    resetForm(); setShowForm(false);
  };

  const saveExp = () => {
    if (!expForm.amount || !selected) return;
    setExpenses((prev) => [...prev, { ...expForm, id: Date.now(), siteId: selected.id, amount: Number(expForm.amount) }]);
    setExpForm({ category: "材料費", amount: "", date: "", memo: "" });
    setShowExpForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>現場管理</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>全 {sites.length} 件</div>
        </div>
        <button style={btnStyle(true)} onClick={() => setShowForm(true)}>＋ 現場追加</button>
      </div>

      {sites.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏗</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.steel }}>現場がまだありません</div>
          <div style={{ fontSize: 13 }}>右上のボタンから最初の現場を登録しましょう</div>
        </div>
      )}

      {sites.map((s) => {
        const labor = calcLaborCost(s.id, attendance, employees);
        const exp = expenses.filter((e) => e.siteId === s.id).reduce((t, e) => t + e.amount, 0);
        const profit = s.contractAmount - labor - exp;
        const siteFloors = floors.filter((f) => f.siteId === s.id);
        return (
          <div key={s.id} style={{ background: C.panel, borderRadius: 8, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.07)", cursor: "pointer", border: selected?.id === s.id ? `2px solid ${C.orange}` : `2px solid transparent` }}
            onClick={() => setSelected(selected?.id === s.id ? null : s)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.client}{s.address ? ` ／ ${s.address}` : ""}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  工期：{s.startDate || "—"} 〜 {s.endDate || "—"}
                  {s.totalFloors > 0 && <span style={{ marginLeft: 8, background: "#EEE", borderRadius: 4, padding: "1px 6px" }}>{s.totalFloors}F建て</span>}
                </div>
              </div>
              <Badge status={s.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
              {[["請負金額", fmt(s.contractAmount), C.steel], ["人件費", fmt(labor), C.orange], ["経費合計", fmt(exp), C.cement], ["粗利益", fmt(profit), profit >= 0 ? C.green : C.red]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <ProfitBar revenue={s.contractAmount} labor={labor} expense={exp} />

            {selected?.id === s.id && (
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <button style={btnStyle(true)} onClick={() => setShowExpForm(true)}>＋ 経費追加</button>
                  {siteFloors.length > 0 && (
                    <button style={btnStyle(false)} onClick={() => setShowFloorDetail(s)}>🏢 フロア別利益</button>
                  )}
                  {s.status === "施工中" && (
                    <>
                      <button style={btnStyle(false)} onClick={() => setSites((prev) => prev.map((x) => x.id === s.id ? { ...x, status: "完工" } : x))}>✅ 完工にする</button>
                      <button style={{ ...btnStyle(false), borderColor: "#B39DDB", color: "#6A3CA5", background: "#EDE7F6" }} onClick={() => setSites((prev) => prev.map((x) => x.id === s.id ? { ...x, status: "完工（日程未定）" } : x))}>📅 完工（日程未定）</button>
                    </>
                  )}
                  {s.status !== "施工中" && (
                    <button style={btnStyle(false)} onClick={() => setSites((prev) => prev.map((x) => x.id === s.id ? { ...x, status: "施工中" } : x))}>↩ 施工中に戻す</button>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>経費明細</div>
                {expenses.filter((e) => e.siteId === s.id).length === 0
                  ? <div style={{ fontSize: 13, color: C.muted, padding: "8px 0" }}>経費データなし</div>
                  : expenses.filter((e) => e.siteId === s.id).map((e) => {
                    const flName = e.floorId ? floors.find((f) => f.id === e.floorId)?.name : null;
                    return (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                        <span>
                          <span style={{ background: "#F0F2F5", borderRadius: 4, padding: "1px 7px", marginRight: 8 }}>{e.category}</span>
                          {flName && <span style={{ background: "#EDE7F6", color: "#6A3CA5", borderRadius: 4, padding: "1px 6px", marginRight: 8, fontSize: 11 }}>{flName}</span>}
                          {e.memo}
                        </span>
                        <span style={{ fontWeight: 700 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}

      {showForm && (
        <Modal title="現場を追加" onClose={() => { resetForm(); setShowForm(false); }}>
          <Field label="現場名 *"><input style={inputStyle} value={form.name} placeholder="例：○○マンション新築工事" onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="元請会社名"><input style={inputStyle} value={form.client} onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))} /></Field>
          <Field label="現場住所"><input style={inputStyle} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></Field>
          <Field label="開始日"><input style={inputStyle} type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></Field>
          <Field label="終了日（完工予定日）">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" id="unk" checked={endDateUnknown} onChange={(e) => setEndDateUnknown(e.target.checked)} />
              <label htmlFor="unk" style={{ fontSize: 13, cursor: "pointer" }}>完工日は未定</label>
            </div>
            {!endDateUnknown && <input style={inputStyle} type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />}
          </Field>
          <Field label="請負金額（円） *"><input style={inputStyle} type="number" value={form.contractAmount} placeholder="例：3200000" onChange={(e) => setForm((p) => ({ ...p, contractAmount: e.target.value }))} /></Field>
          <Field label="総フロア数（フロア別利益計算に使用／不要なら空欄）">
            <input style={inputStyle} type="number" min="0" value={form.totalFloors} placeholder="例：10" onChange={(e) => setForm((p) => ({ ...p, totalFloors: e.target.value }))} />
          </Field>
          <Field label="状況">
            <select style={inputStyle} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option>施工中</option><option>完工</option><option>完工（日程未定）</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={btnStyle(false)} onClick={() => { resetForm(); setShowForm(false); }}>キャンセル</button>
            <button style={btnStyle(true)} onClick={save}>保存</button>
          </div>
        </Modal>
      )}

      {showExpForm && selected && (
        <Modal title={`経費追加 — ${selected.name}`} onClose={() => setShowExpForm(false)}>
          <Field label="カテゴリ"><select style={inputStyle} value={expForm.category} onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="日付"><input style={inputStyle} type="date" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="金額（円）"><input style={inputStyle} type="number" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} /></Field>
          <Field label="メモ"><input style={inputStyle} value={expForm.memo} onChange={(e) => setExpForm((p) => ({ ...p, memo: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={btnStyle(false)} onClick={() => setShowExpForm(false)}>キャンセル</button>
            <button style={btnStyle(true)} onClick={saveExp}>保存</button>
          </div>
        </Modal>
      )}

      {showFloorDetail && (
        <FloorDetail site={showFloorDetail} floors={floors} expenses={expenses} setExpenses={setExpenses} onClose={() => setShowFloorDetail(null)} />
      )}
    </div>
  );
}

// Attendance
function Attendance({ sites, employees, attendance, setAttendance }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", siteId: "", employeeId: "", status: "出勤", overtime: "0" });
  const [filterSite, setFilterSite] = useState("");

  const save = () => {
    if (!form.date || !form.siteId || !form.employeeId) return;
    setAttendance((prev) => [...prev, { ...form, id: Date.now(), siteId: Number(form.siteId), employeeId: Number(form.employeeId), overtime: Number(form.overtime) }]);
    setForm({ date: "", siteId: "", employeeId: "", status: "出勤", overtime: "0" });
    setShowForm(false);
  };

  const filtered = filterSite ? attendance.filter((a) => a.siteId === Number(filterSite)) : attendance;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>出勤管理</div>
        <button style={btnStyle(true)} onClick={() => setShowForm(true)}>＋ 出勤登録</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select style={{ ...inputStyle, width: "auto", minWidth: 180 }} value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
          <option value="">全現場</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ background: C.panel, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F7F8FA" }}>
              {["日付", "現場", "氏名", "状況", "残業(h)", "日当", "残業代"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.muted, fontSize: 11, letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((a) => {
              const site = sites.find((s) => s.id === a.siteId);
              const emp = employees.find((e) => e.id === a.employeeId);
              const ot = emp ? (emp.dailyRate / 8) * 1.25 * a.overtime : 0;
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px" }}>{a.date}</td>
                  <td style={{ padding: "10px 12px", color: C.muted }}>{site?.name || "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{emp?.name || "—"}</td>
                  <td style={{ padding: "10px 12px" }}><Badge status={a.status} /></td>
                  <td style={{ padding: "10px 12px" }}>{a.overtime}h</td>
                  <td style={{ padding: "10px 12px" }}>{emp ? fmt(emp.dailyRate) : "—"}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: ot > 0 ? C.orange : C.muted }}>{ot > 0 ? fmt(ot) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="出勤を登録" onClose={() => setShowForm(false)}>
          <Field label="日付"><input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="現場">
            <select style={inputStyle} value={form.siteId} onChange={(e) => setForm((p) => ({ ...p, siteId: e.target.value }))}>
              <option value="">選択してください</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="従業員">
            <select style={inputStyle} value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}>
              <option value="">選択してください</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="状況">
            <select style={inputStyle} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option>出勤</option><option>欠勤</option>
            </select>
          </Field>
          <Field label="残業時間（h）"><input style={inputStyle} type="number" step="0.5" value={form.overtime} onChange={(e) => setForm((p) => ({ ...p, overtime: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={btnStyle(false)} onClick={() => setShowForm(false)}>キャンセル</button>
            <button style={btnStyle(true)} onClick={save}>保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Employees
function Employees({ employees, setEmployees, attendance }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", dailyRate: "", jobType: "型枠大工", employmentType: "正社員", allowances: "" });

  const save = () => {
    if (!form.name || !form.dailyRate) return;
    setEmployees((prev) => [...prev, { ...form, id: Date.now(), dailyRate: Number(form.dailyRate), allowances: Number(form.allowances || 0) }]);
    setForm({ name: "", dailyRate: "", jobType: "型枠大工", employmentType: "正社員", allowances: "" });
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>従業員管理</div>
        <button style={btnStyle(true)} onClick={() => setShowForm(true)}>＋ 従業員追加</button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {employees.map((e) => {
          const days = attendance.filter((a) => a.employeeId === e.id && a.status === "出勤").length;
          const totalOt = attendance.filter((a) => a.employeeId === e.id).reduce((s, a) => s + a.overtime, 0);
          const monthSalary = e.dailyRate * days + (e.dailyRate / 8) * 1.25 * totalOt + e.allowances;
          return (
            <div key={e.id} style={{ background: C.panel, borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.steel, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {e.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{e.jobType} ／ {e.employmentType}</div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[["日当", fmt(e.dailyRate)], ["出勤日数", `${days} 日`], ["残業", `${totalOt}h`], ["月給（概算）", fmt(monthSalary)]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <Modal title="従業員を追加" onClose={() => setShowForm(false)}>
          <Field label="氏名"><input style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="日当（円）"><input style={inputStyle} type="number" value={form.dailyRate} onChange={(e) => setForm((p) => ({ ...p, dailyRate: e.target.value }))} /></Field>
          <Field label="職種">
            <select style={inputStyle} value={form.jobType} onChange={(e) => setForm((p) => ({ ...p, jobType: e.target.value }))}>
              {["型枠大工", "助手", "職長", "現場監督"].map((j) => <option key={j}>{j}</option>)}
            </select>
          </Field>
          <Field label="雇用区分">
            <select style={inputStyle} value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
              {["正社員", "日雇い", "パート"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="各種手当（円/月）"><input style={inputStyle} type="number" value={form.allowances} onChange={(e) => setForm((p) => ({ ...p, allowances: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={btnStyle(false)} onClick={() => setShowForm(false)}>キャンセル</button>
            <button style={btnStyle(true)} onClick={save}>保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Payroll
function Payroll({ employees, attendance }) {
  const [selected, setSelected] = useState(null);
  const months = ["2026-06", "2026-05", "2026-04"];
  const [month, setMonth] = useState("2026-06");

  const rows = employees.map((e) => {
    const recs = attendance.filter((a) => a.employeeId === e.id && a.date.startsWith(month));
    const days = recs.filter((a) => a.status === "出勤").length;
    const ot = recs.reduce((s, a) => s + a.overtime, 0);
    const basePay = e.dailyRate * days;
    const otPay = (e.dailyRate / 8) * 1.25 * ot;
    const allowances = e.allowances;
    const deduction = Math.round((basePay + otPay) * 0.15); // simplified 15%
    const net = basePay + otPay + allowances - deduction;
    return { ...e, days, ot, basePay, otPay, allowances, deduction, net };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>給与計算</div>
        <select style={{ ...inputStyle, width: "auto" }} value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ background: C.panel, borderRadius: 8, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F7F8FA" }}>
              {["氏名", "出勤日数", "基本給", "残業代", "手当", "控除", "差引支給額", ""].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.muted, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "10px 12px" }}>{r.days}日</td>
                <td style={{ padding: "10px 12px" }}>{fmt(r.basePay)}</td>
                <td style={{ padding: "10px 12px", color: r.otPay > 0 ? C.orange : C.muted }}>{r.otPay > 0 ? fmt(r.otPay) : "—"}</td>
                <td style={{ padding: "10px 12px" }}>{r.allowances > 0 ? fmt(r.allowances) : "—"}</td>
                <td style={{ padding: "10px 12px", color: C.red }}>−{fmt(r.deduction)}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: C.green }}>{fmt(r.net)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.panel, fontSize: 12, cursor: "pointer" }} onClick={() => setSelected(r)}>明細</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={`給与明細 — ${selected.name} ${month}`} onClose={() => setSelected(null)}>
          <div style={{ background: "#F7F8FA", borderRadius: 8, padding: 16, marginBottom: 16, fontFamily: "monospace" }}>
            <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 12 }}>給　与　明　細　書</div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>氏名：{selected.name}　{month}</div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
              {[["出勤日数", `${selected.days} 日`], ["基本給", fmt(selected.basePay)], ["残業手当", fmt(selected.otPay)], ["各種手当", fmt(selected.allowances)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: C.red }}>
                <span>社会保険等控除</span><span>−{fmt(selected.deduction)}</span>
              </div>
            </div>
            <div style={{ borderTop: `2px solid ${C.steel}`, paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
              <span>差引支給額</span><span style={{ color: C.green }}>{fmt(selected.net)}</span>
            </div>
          </div>
          <div style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>※ PDF出力は実装版でご利用いただけます</div>
        </Modal>
      )}
    </div>
  );
}

// ─── NAV ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "ダッシュボード", icon: "📊" },
  { id: "sites", label: "現場管理", icon: "🏗" },
  { id: "attendance", label: "出勤管理", icon: "📋" },
  { id: "employees", label: "従業員", icon: "👷" },
  { id: "payroll", label: "給与計算", icon: "💴" },
];

// ─── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sites, setSites] = useState([]);
  const [floors, setFloors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        {/* Header */}
        <div style={{ background: C.steel, color: "#fff", padding: "0 16px", display: "flex", alignItems: "center", height: 56, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ width: 32, height: 32, background: C.orange, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>型</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>現場利益管理</div>
              <div style={{ fontSize: 10, color: C.cement, letterSpacing: "0.08em" }}>KATAWAKU PRO</div>
            </div>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22 }}>☰</button>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setMenuOpen(false)}>
            <div style={{ position: "absolute", top: 56, right: 0, width: 220, background: C.steel, boxShadow: "-4px 0 12px rgba(0,0,0,.3)" }} onClick={(e) => e.stopPropagation()}>
              {NAV.map((n) => (
                <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px", background: page === n.id ? C.orange : "none", color: "#fff", border: "none", fontSize: 14, fontWeight: page === n.id ? 700 : 400, textAlign: "left" }}>
                  {n.icon} {n.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom nav (mobile) */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.steel, display: "flex", zIndex: 50, borderTop: `1px solid rgba(255,255,255,.1)` }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ flex: 1, padding: "8px 4px", background: "none", border: "none", color: page === n.id ? C.orange : C.cement, fontSize: 20, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700 }}>{n.label.replace("管理", "")}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 16px 100px" }}>
          {page === "dashboard" && <Dashboard sites={sites} attendance={attendance} employees={employees} expenses={expenses} />}
          {page === "sites" && <Sites sites={sites} setSites={setSites} floors={floors} setFloors={setFloors} attendance={attendance} employees={employees} expenses={expenses} setExpenses={setExpenses} />}
          {page === "attendance" && <Attendance sites={sites} employees={employees} attendance={attendance} setAttendance={setAttendance} />}
          {page === "employees" && <Employees employees={employees} setEmployees={setEmployees} attendance={attendance} />}
          {page === "payroll" && <Payroll employees={employees} attendance={attendance} />}
        </div>
      </div>
    </>
  );
}
