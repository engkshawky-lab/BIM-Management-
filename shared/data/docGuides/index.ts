import { DELIVERY_GUIDES } from "./delivery";
import { PLAN_GUIDES } from "./plans";
import { REQUIREMENT_GUIDES } from "./requirements";
import type { DocGuide } from "./types";

/** Every document guide, in working order: requirements, tender and plans, delivery and close-out. */
export const DOC_GUIDES: DocGuide[] = [...REQUIREMENT_GUIDES, ...PLAN_GUIDES, ...DELIVERY_GUIDES];
export const guideById = (id: string) => DOC_GUIDES.find((g) => g.id === id);
export const guideByCode = (code: string) => DOC_GUIDES.find((g) => g.code === code);
