import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSession } from "../App";
import { t } from "../i18n";
import { api } from "../lib/api";
import { LockIcon, PLAN_CHANGED, useAccess } from "../lib/access";
import { buildAccessTree, descendantsOf, type AccessNode } from "../lib/accessTree";
import { blockedAt, canOpenKey, defaultPlansFor, plansFor, type AccessMap, type TabAccessMap } from "../../../shared/access";
import { PLAN_IDS, type Plan, type PlanId } from "../../../shared/plans";
import "./adminAccess.css";

// Admin › Plans & access › Subscription permission control: one tree from sidebar sections down to the deepest tab,
// with a tick per plan on every row. Sections and groups set everything under them; pages keep their plan list;
// tabs follow their parent unless closed to a plan here. A plan the parent closes cannot be opened on a child.

interface Props { plans: Plan[]; access: AccessMap; tabAccess: TabAccessMap; onSaved: (access: AccessMap, tabAccess: TabAccessMap) => void }

const KIND_LABEL = { section: "Section", group: "Group", page: "Page", tab: "Tab" } as const;
const kindLabel = (n: AccessNode) => (n.kind === "tab" && n.level > 1 ? "Nested tab" : KIND_LABEL[n.kind]);
const ruleNodes = (nodes: AccessNode[]) => nodes.filter((n) => n.kind === "page" || n.kind === "tab");
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const sortedPlans = (list: PlanId[]) => PLAN_IDS.filter((p) => list.includes(p));

export default function AdminAccess({ plans, access: savedAccess, tabAccess: savedTabs, onSaved }: Props) {
  const { toast } = useSession();
  const { setPreview } = useAccess();
  const tree = useMemo(buildAccessTree, []);
  const [access, setAccess] = useState<AccessMap>(savedAccess);
  const [tabs, setTabs] = useState<TabAccessMap>(savedTabs);
  const [q, setQ] = useState("");
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  useEffect(() => { setAccess(savedAccess); setTabs(savedTabs); }, [savedAccess, savedTabs]);

  // lookups built once: parent and descendants of every node
  const { parent, below, all } = useMemo(() => {
    const parent = new Map<string, AccessNode>(); const below = new Map<string, AccessNode[]>(); const all: AccessNode[] = [];
    const walk = (n: AccessNode) => { all.push(n); below.set(n.key, descendantsOf(n)); n.children.forEach((c) => { parent.set(c.key, n); walk(c); }); };
    tree.forEach(walk);
    return { parent, below, all };
  }, [tree]);

  const color = (id: PlanId) => plans.find((p) => p.id === id)?.color ?? "var(--accent)";
  const planName = (id: PlanId) => t(plans.find((p) => p.id === id)?.name ?? id);
  const isCustom = (n: AccessNode) => (n.kind === "page" ? n.key in access : n.kind === "tab" ? !!tabs[n.key] : false);
  const opens = (n: AccessNode, p: PlanId) => (n.kind === "page" ? plansFor(n.key, access).includes(p) : canOpenKey(n.key, p, access, tabs));

  const changes = useMemo(() => {
    const keys = new Set([...Object.keys(access), ...Object.keys(savedAccess)]);
    const tabKeys = new Set([...Object.keys(tabs), ...Object.keys(savedTabs)]);
    return [...keys].filter((k) => !same(access[k], savedAccess[k])).length + [...tabKeys].filter((k) => !same(tabs[k], savedTabs[k])).length;
  }, [access, tabs, savedAccess, savedTabs]);
  const customCount = Object.keys(access).length + Object.keys(tabs).length;

  // ---------- edits ----------
  /** Allow or close one plan on a node and everything under it; tabs below drop their own mark for that plan. */
  const setBranch = (n: AccessNode, p: PlanId, allow: boolean) => {
    const nodes = [n, ...below.get(n.key)!];
    const nextAccess = { ...access }; const nextTabs = { ...tabs };
    for (const x of nodes) {
      if (x.kind === "page") {
        const cur = plansFor(x.key, nextAccess);
        const list = sortedPlans(allow ? [...cur, p] : cur.filter((y) => y !== p));
        if (same(list, defaultPlansFor(x.key))) delete nextAccess[x.key]; else nextAccess[x.key] = list;
      } else if (x.kind === "tab") {
        const rule = { ...nextTabs[x.key] };
        if (!allow && x === n) rule[p] = false; else delete rule[p];
        if (Object.keys(rule).length) nextTabs[x.key] = rule; else delete nextTabs[x.key];
      }
    }
    setAccess(nextAccess); setTabs(nextTabs);
  };
  const resetNode = (n: AccessNode) => {
    if (n.kind === "page") { const { [n.key]: _, ...rest } = access; setAccess(rest); }
    else { const { [n.key]: _, ...rest } = tabs; setTabs(rest); }
  };

  const save = async () => {
    setBusy(true);
    try {
      const r = await api<{ access: AccessMap; tabAccess: TabAccessMap }>("/admin/access", { method: "PUT", body: { access, tabAccess: tabs } });
      onSaved(r.access, r.tabAccess); toast(t("Access saved")); window.dispatchEvent(new Event(PLAN_CHANGED));
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  };
  const preview = (p: PlanId) => {
    setPreview({ plan: p, access, tabAccess: tabs, draft: changes > 0 });
    toast(`${t("Previewing as")} ${planName(p)}. ${t("Browse the portal; exit from the bar at the bottom.")}`);
    location.hash = "#/";
  };

  // ---------- filters ----------
  const query = q.trim().toLowerCase();
  const filtering = !!query || onlyCustom;
  const visible = useMemo(() => {
    if (!filtering) return null;
    const hit = (n: AccessNode) => (!query || `${n.label} ${n.hint ?? ""}`.toLowerCase().includes(query)) && (!onlyCustom || isCustom(n));
    const keep = new Set<string>();
    for (const n of all) if (hit(n)) { keep.add(n.key); for (let p = parent.get(n.key); p; p = parent.get(p.key)) keep.add(p.key); }
    return keep;
  }, [filtering, query, onlyCustom, all, parent, access, tabs]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows: { n: AccessNode; depth: number }[] = [];
  const walk = (n: AccessNode, depth: number) => {
    if (visible && !visible.has(n.key)) return;
    rows.push({ n, depth });
    if (filtering || open.has(n.key)) n.children.forEach((c) => walk(c, depth + 1));
  };
  tree.forEach((n) => walk(n, 0));
  const branches = all.filter((n) => n.children.length).map((n) => n.key);
  const toggleOpen = (key: string) => { const next = new Set(open); if (next.has(key)) next.delete(key); else next.add(key); setOpen(next); };

  return (
    <div className="acc">
      <div className="acc-preview">
        <div><b className="small"><EyeIcon /> {t("Preview as plan")}</b><div className="tiny muted">{t("See the portal as a subscriber on that plan would, with the access below (saved or not).")}</div></div>
        <div className="acc-plan-buttons">{PLAN_IDS.map((id) => (
          <button key={id} type="button" className="small" style={{ "--plan": color(id) } as CSSProperties} onClick={() => preview(id)}><i className="acc-dot" />{planName(id)}</button>))}</div>
      </div>

      <div className="acc-toolbar">
        <input type="search" aria-label={t("Search pages, tabs or sections…")} placeholder={t("Search pages, tabs or sections…")} value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="small" disabled={filtering} onClick={() => setOpen(new Set(branches))}>{t("Expand all")}</button>
        <button type="button" className="small" disabled={filtering} onClick={() => setOpen(new Set())}>{t("Collapse all")}</button>
        <label className="acc-filter"><input type="checkbox" checked={onlyCustom} onChange={(e) => setOnlyCustom(e.target.checked)} /> {t("Show only customised")}</label>
      </div>

      <div className="acc-legend" id="acc-legend">
        <span><i className="acc-sample" /> {t("Set here")}</span>
        <span><i className="acc-sample faint" /> {t("Inherited or default")}</span>
        <span><i className="acc-sample mixed" /> {t("Mixed below")}</span>
        <span><i className="acc-sample blocked" /> {t("Closed by a parent")}</span>
      </div>
      <p className="acc-note small">{t("Each tick applies to the row and everything under it. A plan a parent closes cannot be opened on a tab under it: change the parent first.")}</p>

      <div className="acc-savebar">
        <span className={"acc-status small" + (changes ? " dirty" : "")} aria-live="polite"><i />{changes ? `${changes} ${t(changes === 1 ? "unsaved change" : "unsaved changes")}` : t("All changes saved")}</span>
        <span className="tiny muted">{customCount} {t("customised rows")}</span>
        <span className="acc-grow" />
        <button type="button" className="ghost small" disabled={busy || !customCount} onClick={() => { if (confirm(t("Reset every page and tab to the default plans?"))) { setAccess({}); setTabs({}); } }}>{t("Reset all")}</button>
        <button type="button" className="ghost small" disabled={busy || !changes} onClick={() => { setAccess(savedAccess); setTabs(savedTabs); }}>{t("Discard")}</button>
        <button type="button" className="primary small" disabled={busy || !changes} onClick={save}>{busy ? t("Saving…") : t("Save access")}</button>
      </div>

      <div className="acc-wrap" role="region" aria-label={t("Access by plan")} tabIndex={0}>
        <table className="acc-table" aria-describedby="acc-legend">
          <colgroup><col className="acc-col-name" />{PLAN_IDS.map((id) => <col key={id} className="acc-col-plan" />)}</colgroup>
          <thead><tr>
            <th scope="col">{t("Section / group / page / tab")}<small>{t("Open a row to see what is under it")}</small></th>
            {PLAN_IDS.map((id) => <th key={id} scope="col" style={{ "--plan": color(id) } as CSSProperties}><span className="acc-th"><i className="acc-dot" />{planName(id)}</span></th>)}
          </tr></thead>
          <tbody>
            {rows.map(({ n, depth }) => renderRow(n, depth))}
            {!rows.length && <tr><td colSpan={PLAN_IDS.length + 1} className="acc-empty">{t("Nothing matches. Try another search or turn off \"Show only customised\".")}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="tiny muted">{rows.length} {t("rows shown")} · {all.filter((n) => n.kind === "page").length} {t("pages")} · {all.filter((n) => n.kind === "tab").length} {t("tabs")}</p>
    </div>
  );

  function renderRow(n: AccessNode, depth: number) {
    const kids = below.get(n.key)!;
    const rules = n.kind === "section" || n.kind === "group" ? ruleNodes(kids) : ruleNodes([n, ...kids]);
    const custom = isCustom(n);
    const up = parent.get(n.key);
    const isOpen = filtering || open.has(n.key);
    const hint = n.kind === "section" || n.kind === "group"
      ? `${rules.filter((x) => x.kind === "page").length} ${t("pages")}${rules.some((x) => x.kind === "tab") ? ` · ${rules.filter((x) => x.kind === "tab").length} ${t("tabs")}` : ""}`
      : n.kind === "page" ? (custom ? t("Plans set here") : t("Default plans"))
        : custom ? `${t("Closed to")} ${PLAN_IDS.filter((p) => tabs[n.key]?.[p] === false).map(planName).join(", ")} ${t("here")}`
          : `${t("Follows")} ${t(up?.label ?? "")}`;
    const noPlan = n.kind === "page" && plansFor(n.key, access).length === 0;
    return (
      <tr key={n.key} className={`acc-row acc-${n.kind}`}>
        <td className="acc-name" style={{ "--depth": depth } as CSSProperties}>
          <div className="acc-node">
            {n.children.length
              ? <button type="button" className="acc-disclosure" aria-expanded={isOpen} disabled={filtering} onClick={() => toggleOpen(n.key)}
                aria-label={`${t(isOpen ? "Collapse" : "Expand")} ${t(n.label)}`}><Chevron open={isOpen} /></button>
              : <span className="acc-leaf" aria-hidden="true" />}
            <div className="acc-label">
              <div className="acc-title">
                <span>{t(n.label)}</span><span className="acc-kind">{t(kindLabel(n))}</span>
                {custom && <span className="badge acc-custom">{t("custom")}</span>}
                {noPlan && <span className="badge acc-none">{t("Only administrators")}</span>}
              </div>
              <div className="acc-hint">{hint}{custom && <button type="button" className="linklike" onClick={() => resetNode(n)}>{t(n.kind === "page" ? "Reset to default" : "Reset to inherited")}</button>}</div>
            </div>
          </div>
        </td>
        {PLAN_IDS.map((p) => {
          const count = rules.filter((x) => opens(x, p)).length;
          const allOpen = rules.length > 0 && count === rules.length;
          const mixed = count > 0 && count < rules.length;
          const stop = n.kind === "tab" ? blockedAt(n.key, p, access, tabs) : null;
          const blocked = !!stop && stop !== n.key;
          const stopNode = blocked ? all.find((x) => x.key === stop) : undefined;
          const inherited = (n.kind === "tab" && tabs[n.key]?.[p] === undefined) || (n.kind === "page" && !custom) || n.kind === "section" || n.kind === "group";
          const why = blocked
            ? `${planName(p)}: ${t("closed by")} ${t(stopNode?.label ?? stop!)}. ${t("Open it there first.")}`
            : `${planName(p)}: ${count} ${t("of")} ${rules.length} ${t("open")}. ${t(allOpen ? "Untick to close" : "Tick to open")} ${t(n.label)}${n.children.length ? ` ${t("and everything under it")}` : ""}.`;
          return (
            <td key={p} className="acc-cell-td">
              <label className={"acc-cell" + (inherited && !mixed ? " faint" : "") + (blocked ? " blocked" : "")} style={{ "--plan": color(p) } as CSSProperties} title={why}>
                <input type="checkbox" checked={allOpen} disabled={blocked || !rules.length}
                  ref={(el) => { if (el) el.indeterminate = mixed && !blocked; }}
                  aria-label={`${t(n.label)} · ${planName(p)}. ${why}`}
                  onChange={() => setBranch(n, p, !allOpen)} />
                {blocked && <LockIcon size={11} />}
              </label>
            </td>);
        })}
      </tr>
    );
  }
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform .12s" }}><path d="m9 6 6 6-6 6" /></svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px" }}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
