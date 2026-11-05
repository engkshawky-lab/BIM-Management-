// Do two documents belong together? Used before comparing an EIR with a BEP (or two BEP versions): the AI reports what
// each document is and which project / client it names, and this turns that into a clear verdict, cross-checked
// against the names themselves so an unrelated pair is never silently scored.

export interface DocIdentity {
  /** what the document is, e.g. "Exchange Information Requirements (EIR)" */
  type: string;
  /** true when it is the kind of document expected in that slot */
  expected: boolean;
  project: string;
  /** project number / code, if stated */
  code: string;
  client: string;
}

export interface DocMatchInput { a: DocIdentity; b: DocIdentity; sameProject: "yes" | "no" | "unclear"; reason: string }

export type RelationStatus = "related" | "unrelated" | "wrong-type" | "unclear";
export interface Relation extends DocMatchInput { status: RelationStatus; message: string; messageAr?: string }

const STOP = new Set(["the", "and", "for", "project", "projects", "development", "phase", "stage", "package", "works", "contract", "building",
  "buildings", "tower", "towers", "plan", "bim", "eir", "bep", "information", "requirements", "execution", "exchange", "employer", "employers",
  "post", "pre", "appointment", "document", "rev", "revision", "new", "construction", "design", "company", "llc", "ltd", "co", "group"]);
const tokens = (s: string) => new Set(s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d{1,3}$/.test(w)));
const art = (w: string) => `${/^[aeio]/i.test(w) ? "an" : "a"} ${w}`;
const codeOf = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Share at least one significant word, or the same project code. */
export function namesOverlap(a: string, b: string): boolean {
  const x = tokens(a), y = tokens(b);
  for (const w of x) if (y.has(w)) return true;
  return false;
}

const clean = (v: unknown, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const identity = (v: unknown): DocIdentity => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { type: clean(o.type, 120), expected: o.expected !== false, project: clean(o.project), code: clean(o.code, 60), client: clean(o.client) };
};

/** Read the AI's "match" object defensively. */
export function sanitiseMatch(v: unknown): DocMatchInput | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const same = String(o.sameProject ?? "").toLowerCase();
  return { a: identity(o.a), b: identity(o.b), sameProject: same === "yes" || same === "no" ? same : "unclear", reason: clean(o.reason, 600) };
}

/**
 * The verdict on whether the two documents belong together.
 * labels: what each slot should hold, e.g. ["EIR", "BEP"].
 */
export function judgeRelation(m: DocMatchInput | null, labels: [string, string]): Relation {
  const blank: DocIdentity = { type: "", expected: true, project: "", code: "", client: "" };
  const [la, lb] = labels;
  const [ra, rb] = labels.map((l) => AR_LABEL[l] ?? l);
  if (!m) return { a: blank, b: blank, sameProject: "unclear", reason: "", status: "unclear",
    message: `The documents could not be identified, so it is not confirmed that the ${la} and the ${lb} are for the same project. Check them before relying on the result.`,
    messageAr: `تعذّر التعرّف على المستندين، لذا لم يُتأكد من أن ${ra} و${rb} لنفس المشروع. تحقّق منهما قبل الاعتماد على النتيجة.` };
  if (!m.a.expected || !m.b.expected) {
    const en = [!m.a.expected && `the ${la} file looks like ${m.a.type ? art(m.a.type) : "a different kind of document"}`, !m.b.expected && `the ${lb} file looks like ${m.b.type ? art(m.b.type) : "a different kind of document"}`].filter(Boolean);
    const ar = [!m.a.expected && `ملف ${ra} يبدو ${m.a.type ? `«${m.a.type}»` : "مستندًا من نوع آخر"}`, !m.b.expected && `ملف ${rb} يبدو ${m.b.type ? `«${m.b.type}»` : "مستندًا من نوع آخر"}`].filter(Boolean);
    const not = !m.a.expected && !m.b.expected ? `${art(la)} and ${art(lb)}` : !m.a.expected ? art(la) : art(lb);
    return { ...m, status: "wrong-type", message: `Wrong document: ${en.join(" and ")}, not ${not}. Upload the right files and run again.`,
      messageAr: `مستند غير صحيح: ${ar.join(" و")}. ارفع الملفات الصحيحة وأعد التشغيل.` };
  }

  const pa = [m.a.project, m.a.code].filter(Boolean).join(" "), pb = [m.b.project, m.b.code].filter(Boolean).join(" ");
  const sameCode = !!m.a.code && !!m.b.code && codeOf(m.a.code) === codeOf(m.b.code);
  const overlap = sameCode || (!!pa && !!pb && namesOverlap(pa, pb));
  const differentCodes = !!m.a.code && !!m.b.code && !sameCode;
  const differentClients = !!m.a.client && !!m.b.client && !namesOverlap(m.a.client, m.b.client);
  const who = (p: string, c: string, ar: boolean) => `${p || (ar ? "المشروع غير مذكور" : "project not stated")}${c ? ` (${c})` : ""}`;
  const names = `${la}: ${who(pa, m.a.client, false)} · ${lb}: ${who(pb, m.b.client, false)}`;
  const namesAr = `${ra}: ${who(pa, m.a.client, true)} · ${rb}: ${who(pb, m.b.client, true)}`;
  const why = m.reason ? ` ${m.reason}` : "";

  if (m.sameProject === "no" || (m.sameProject === "unclear" && ((!!pa && !!pb && !overlap) || (differentCodes && !overlap))))
    return { ...m, status: "unrelated",
      message: `These documents are not related: the ${la} and the ${lb} are for different projects (${names}).${why} The comparison below is not meaningful — upload the ${lb} written for this ${la}.`,
      messageAr: `هذان المستندان غير مرتبطين: ${ra} و${rb} لمشروعين مختلفين (${namesAr}).${why} المقارنة أدناه بلا معنى — ارفع ${rb} المُعدّ لهذا ${ra}.` };
  if (m.sameProject === "yes" && !!pa && !!pb && !overlap && (differentClients || differentCodes))
    return { ...m, status: "unclear",
      message: `Check that these documents belong together: they name different projects${differentClients ? " and clients" : " and project numbers"} (${names}).${why}`,
      messageAr: `تحقّق من أن المستندين متوافقان: يذكران مشروعين${differentClients ? " وعميلين" : " ورقمي مشروع"} مختلفين (${namesAr}).${why}` };
  if (m.sameProject === "yes") return { ...m, status: "related", message: `Same project — ${names}.`, messageAr: `المشروع نفسه — ${namesAr}.` };
  return { ...m, status: "unclear",
    message: `It could not be confirmed that the ${la} and the ${lb} are for the same project (${names}).${why} Check them before relying on the result.`,
    messageAr: `تعذّر التأكد من أن ${ra} و${rb} لنفس المشروع (${namesAr}).${why} تحقّق منهما قبل الاعتماد على النتيجة.` };
}

const AR_LABEL: Record<string, string> = { EIR: "متطلبات EIR", BEP: "خطة BEP", "Previous BEP": "خطة BEP السابقة", "Revised BEP": "خطة BEP المعدّلة" };

/** Prompt text asking the AI for the "match" object; put it first in the schema so it is decided before the analysis. */
export const matchSchema = (la: string, lb: string) =>
  `"match": {"a": {"type": string (what the ${la} file actually is), "expected": boolean (true if it really is ${art(la)}), "project": string (project name as written, "" if not stated), "code": string (project number/code, "" if none), "client": string (appointing party / client, "" if not stated)}, ` +
  `"b": {same fields for the ${lb} file}, "sameProject": "yes" | "no" | "unclear" (do both documents concern the same project and appointment?), "reason": string (one sentence: the evidence for that answer)}`;

export const MATCH_RULES = `Before analysing, identify each document from its own content (title page, headers, project name and number, client, location) — not from the file name.
Answer "sameProject" honestly: "no" when they name different projects, sites, clients or project numbers; "unclear" when one of them does not say. Never assume they match because you were asked to compare them.
If they are not related, or a file is not the expected kind of document, still return the rest of the schema, but do not mark any requirement as met from the unrelated document.`;
