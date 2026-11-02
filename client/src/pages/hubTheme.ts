import type { Tone } from "../../../shared/data/hubs/types";

// Accent colours shared by the hub pages, parts hub, role matrix and graphics.
export const TONES: Record<Tone, string> = { blue: "var(--accent)", green: "var(--ok)", amber: "var(--warn)", purple: "var(--purple)", red: "var(--danger)", teal: "var(--teal)" };
export const ORDER: Tone[] = ["blue", "green", "purple", "amber", "red", "teal"];
