import { hubById, hubs } from "../../../shared/data/hubs";
import HubPage, { HubsIndex } from "./HubPage";

// /hubs/<id>/<section>/<tab>, or the hubs index (optionally focused on a theme). Kept apart from App.tsx
// so the hub content loads only when a hub is opened.
export default function HubRoute({ id, sectionId, tabId }: { id?: string; sectionId?: string; tabId?: string }) {
  const hub = hubById(id ?? "");
  if (hub) return <HubPage hub={hub} sectionId={sectionId} tabId={tabId} />;
  return <HubsIndex hubs={hubs} focus={id === "theme" ? sectionId : undefined} />;
}
