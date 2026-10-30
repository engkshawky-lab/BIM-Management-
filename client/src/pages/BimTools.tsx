import type { CSSProperties } from "react";
import { t } from "../i18n";
import { TONES } from "./HubPage";
import BcfStudio from "./tools/BcfStudio";
import Correspondence from "./tools/Correspondence";
import IdsBuilder from "./tools/IdsBuilder";
import MeetingMinutes from "./tools/MeetingMinutes";

// Everyday tools for BIM managers and coordinators that work without opening a project.
// /bim-tools/:tool

const TOOLS = [
  { id: "ids", label: "IDS builder", eyebrow: "buildingSMART IDS 1.0", title: "Write model requirements as IDS", hint: "Set the properties, classification and materials each element must carry, then export an .ids file your model checker can run.", body: () => <IdsBuilder /> },
  { id: "bcf", label: "BCF studio", eyebrow: "BIM Collaboration Format", title: "Open, review and convert BCF issues", hint: "Open a .bcfzip from Navisworks, Revizto, BIMcollab, Solibri or ACC, filter and edit the issues, and export them to Excel — or turn an Excel issue list into BCF.", body: () => <BcfStudio /> },
  { id: "minutes", label: "Meeting minutes (AI)", eyebrow: "AI · Meetings", title: "Turn notes into formal minutes", hint: "Paste rough notes or a Teams or Zoom transcript and get minutes with decisions and an action list with owners and dates.", body: () => <MeetingMinutes /> },
  { id: "comms", label: "Transmittals & letters", eyebrow: "Transmittals · AI correspondence", title: "Transmittals, RFIs and notices", hint: "Build a transmittal from a list of file names, and draft RFIs, rejection notices, non-conformance notices and reminders that cite ISO 19650.", body: () => <Correspondence /> },
] as const;

export default function BimTools({ tool }: { tool?: string }) {
  const cur = TOOLS.find((x) => x.id === tool) ?? TOOLS[0];
  return (
    <div className="hub" style={{ "--hub": TONES.blue } as CSSProperties}>
      <div className="hub-hero"><div className="eyebrow">{t(cur.eyebrow)}</div><h1>{t(cur.title)}</h1><p>{t(cur.hint)}</p></div>
      <nav className="tabs" aria-label={t("BIM tools")}>
        {TOOLS.map((x) => <a key={x.id} className={"tab" + (x.id === cur.id ? " on" : "")} href={`#/bim-tools/${x.id}`}>{t(x.label)}</a>)}
      </nav>
      <div key={cur.id}>{cur.body()}</div>
    </div>
  );
}
