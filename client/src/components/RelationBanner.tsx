import { getLocale, t } from "../i18n";
import type { Relation } from "../../../shared/docMatch";

// Says whether the two compared documents belong together. An unrelated pair or a wrong file is shown as an alert
// above the results, so a score from mismatched documents is never mistaken for a real one.
export function RelationBanner({ relation }: { relation?: Relation }) {
  if (!relation) return null;
  const msg = getLocale() === "ar" && relation.messageAr ? relation.messageAr : relation.message;
  if (relation.status === "related") return <div className="small muted relation-ok no-i18n">✓ {msg}</div>;
  const bad = relation.status === "unrelated" || relation.status === "wrong-type";
  return (
    <div className={"hub-card " + (bad ? "cm-error relation-bad" : "cm-note relation-unclear")} role={bad ? "alert" : "status"}>
      <b>{bad ? (relation.status === "unrelated" ? t("⚠ These documents are not related to each other") : t("⚠ Wrong document")) : t("Check the documents")}</b>
      <p className="cm-p no-i18n" style={{ margin: "4px 0 0" }}>{msg}</p>
    </div>
  );
}

export const relationBlocks = (r?: Relation) => r?.status === "unrelated" || r?.status === "wrong-type";
