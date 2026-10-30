import { airDeepDive } from "./air";
import { bepDeepDive } from "./bep";
import { eirDeepDive } from "./eir";
import type { DeepDive } from "./types";

export const DEEP_DIVES: DeepDive[] = [eirDeepDive, bepDeepDive, airDeepDive];
/** The deep dive shown on a document guide; both BEP guides share the BEP one. */
export const deepDiveFor = (guideId: string) => DEEP_DIVES.find((d) => d.id === (guideId === "bep-pre" ? "bep-post" : guideId));
