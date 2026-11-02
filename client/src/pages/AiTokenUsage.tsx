import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { t } from "../i18n";

interface Row {
  userId: string | null; name: string | null; email: string | null; feature: string; model: string;
  requests: number; inputTokens: number; outputTokens: number; cacheCreationInputTokens: number; cacheReadInputTokens: number; estimatedUsd: number | null;
}
const columns = ["name", "email", "requests", "inputTokens", "outputTokens", "cacheCreationInputTokens", "cacheReadInputTokens", "estimatedUsd"] as const;
const labels = ["User", "Email", "Requests", "Input tokens", "Output tokens", "Cache write tokens", "Cache read tokens", "Estimated USD"];
const displayName = (r: Row) => r.userId === null ? t("System / background") : r.name ?? t("Deleted user");
const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return `"${(/^[\s]*[=+\-@]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
};
function exportCsv(rows: Row[], detail: boolean) {
  const header = detail ? ["Feature", "Model", ...labels] : labels;
  const values = rows.map((r) => [...(detail ? [r.feature, r.model] : []), displayName(r), r.email, r.requests, r.inputTokens, r.outputTokens, r.cacheCreationInputTokens, r.cacheReadInputTokens, r.estimatedUsd ?? t("Unpriced")]);
  const url = URL.createObjectURL(new Blob(["\uFEFF" + [header.map(t), ...values].map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "ai-usage.csv"; a.click(); URL.revokeObjectURL(url);
}
export default function AiTokenUsage() {
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | undefined>();
  const [sort, setSort] = useState<typeof columns[number]>("estimatedUsd"); const [ascending, setAscending] = useState(false);
  const now = new Date(), year = now.getUTCFullYear(), month = now.getUTCMonth();
  const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
  const start = period === "month" ? day(year, month, 1) : period === "last" ? day(year, month - 1, 1) : period === "custom" ? from : "";
  const end = period === "month" ? day(year, month + 1, 0) : period === "last" ? day(year, month, 0) : period === "custom" ? to : "";
  const invalid = period === "custom" && (!start || !end || start > end);
  const query = new URLSearchParams({ ...(start ? { from: start } : {}), ...(end ? { to: end } : {}) }).toString();
  useEffect(() => {
    let active = true;
    setRows([]); setError(""); setLoading(true);
    if (invalid) { setLoading(false); return; }
    api<{ rows: Row[] }>(`/admin/ai-tokens?${query}`).then((r) => { if (active) setRows(r.rows); })
      .catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, invalid]);
  const users = new Map<string, Row>();
  for (const r of rows) {
    const key = r.userId ?? "system", old = users.get(key);
    if (!old) users.set(key, { ...r });
    else {
      old.requests += r.requests; old.inputTokens += r.inputTokens; old.outputTokens += r.outputTokens;
      old.cacheCreationInputTokens += r.cacheCreationInputTokens; old.cacheReadInputTokens += r.cacheReadInputTokens;
      old.estimatedUsd = old.estimatedUsd === null || r.estimatedUsd === null ? null : old.estimatedUsd + r.estimatedUsd;
    }
  }
  const list = [...users.values()].sort((a, b) => {
    const av = sort === "name" ? displayName(a) : a[sort], bv = sort === "name" ? displayName(b) : b[sort];
    return (typeof av === "string" ? av.localeCompare(String(bv ?? "")) : Number(av ?? -1) - Number(bv ?? -1)) * (ascending ? 1 : -1);
  });
  const details = rows.filter((r) => (r.userId ?? "system") === selected);
  const cells = (r: Row) => <><td>{r.email}</td><td>{r.requests.toLocaleString()}</td><td>{r.inputTokens.toLocaleString()}</td><td>{r.outputTokens.toLocaleString()}</td><td>{r.cacheCreationInputTokens.toLocaleString()}</td><td>{r.cacheReadInputTokens.toLocaleString()}</td><td>{r.estimatedUsd === null ? t("Unpriced") : r.estimatedUsd.toFixed(6)}</td></>;
  return <section>
    <p className="muted">{t("Token estimates use current prices, exclude tool fees, and are not invoices. Tracking starts when enabled; earlier usage is unavailable. Dates are UTC.")}</p>
    <p className="small muted">{t("Baseline rates assume five-minute cache writes and standard processing. Haiku 5.5 prompts over 100,000 tokens and other pricing modifiers may cost more.")}</p>
    <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
      <select aria-label={t("Period")} value={period} onChange={(e) => { setPeriod(e.target.value); setSelected(undefined); }}>
        {[['month', 'This month'], ['last', 'Last month'], ['custom', 'Custom range'], ['all', 'All time']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
      </select>
      {period === "custom" && <><label>{t("From")} <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>{t("To")} <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></>}
      <button disabled={loading || invalid || !!error} onClick={() => exportCsv(list, false)}>{t("Export CSV")}</button>
      <a href="#/admin/settings">{t("Change AI settings")}</a>
    </div>
    {invalid && <p role="alert">{t("Choose a valid date range.")}</p>}
    {error && <p role="alert">{error}</p>}
    {loading ? <p>{t("Loading…")}</p> : !invalid && !error && <>
      {!list.length && <p>{t("No recorded token usage.")}</p>}
      <div className="table-wrap"><table className="data"><thead><tr>{columns.map((c, i) => <th key={c} aria-sort={sort === c ? ascending ? "ascending" : "descending" : "none"}><button onClick={() => { setSort(c); setAscending(sort === c ? !ascending : true); }}>{t(labels[i])}</button></th>)}</tr></thead>
        <tbody>{list.map((r) => <tr key={r.userId ?? "system"}><td><button onClick={() => setSelected(r.userId ?? "system")}>{displayName(r)}</button></td>{cells(r)}</tr>)}</tbody></table></div>
      {selected !== undefined && <><h3>{t("Usage by feature and model")}: {details[0] && displayName(details[0])}</h3><button onClick={() => exportCsv(details, true)}>{t("Export detail CSV")}</button>
        <div className="table-wrap"><table className="data"><thead><tr>{["Feature", "Model", ...labels.slice(1)].map((l) => <th key={l}>{t(l)}</th>)}</tr></thead><tbody>{details.map((r) => <tr key={JSON.stringify([r.feature, r.model])}><td>{r.feature}</td><td>{r.model}</td>{cells(r)}</tr>)}</tbody></table></div></>}
    </>}
  </section>;
}
