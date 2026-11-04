// Videos for each learning-path step: path id → step title → YouTube ids from the curated library (videos.ts).
// The page shows the videos in the spoken language of the interface first. learningPaths.test.ts checks that every
// path, step title and video id exists, so a renamed step or a removed video fails the tests.

import { VIDEOS, type Video } from "./videos";
import type { LearningPath } from "./learningPaths";

export const PATH_VIDEOS: Record<string, Record<string, string[]>> = {
  modeller: {
    "ISO 19650 in plain terms": ["u3rImY-5q6Y", "cd5Atg7LNRc", "-Vz5KbGoU0A"],
    "Glossary and acronyms": ["tKTeMUcFhi4", "4iXykC77VKo"],
    "CDE states and status codes": ["lEvarrG6w5g", "qb7FWv4l-zM"],
    "Build a compliant container name": ["21xUPIF9J3c", "LuMHdLn_QVI"],
    "Level of information need": ["IV1l2gbvCKI", "1jzSQe5wVaQ"],
    "How your task team plans its deliverables": ["uhzkU6Ryg20"],
    "Revit best practices": ["XIdkM33C6UE", "-B8YTajdGw8", "V_YQvEbjxeo", "y4cdk67RfpI"],
    "Check your Revit project": ["tCWw3Z1j7Zw"],
    "How documents move through the CDE": ["nZQoWC7_DTs"],
    "Part 2 practical examples": ["ewviy9QDcWc", "wxVOu4TjgiA"],
    "Respond to issues in BCF": ["yrm5SrEfSvE", "AIH9VzRJVCE"],
  },
  coordinator: {
    "The BIM coordinator role": ["CGLxoC2dKn4"],
    "The delivery process": ["9uElHB2lJDI", "wxVOu4TjgiA"],
    "The post-appointment BEP": ["GzSLDobn51Q", "Lbu5I-9AcNc"],
    "Level of information need": ["IV1l2gbvCKI", "oRVzlxRuVWk", "1jzSQe5wVaQ"],
    "Build a clash matrix": ["l489GxRcB3E", "LwkNlCwUX6k", "2Y7ASIYO8Ck"],
    "Analyse IFC models against requirements": ["9YgXXbdohOQ", "g4yu2s3Wp7Y", "2m_IL99WOzQ"],
    "Write model checks as IDS": ["ZYwtz841XEU", "SaRtOFpW0zk"],
    "Grade models with the QA/QC checker": ["lV9BAC7M6eQ"],
    "Manage issues in BCF": ["yrm5SrEfSvE", "EQhX_NHahoI", "AIH9VzRJVCE"],
  },
  "bim-manager": {
    "The BIM manager role": ["MdsahKgxMyM", "Ha0FrCpTL1w"],
    "The delivery team information manager": ["oOJw24decnA"],
    "The project workflow": ["9uElHB2lJDI", "lD8jNuVgEvI"],
    "Part 2 clauses and checklist": ["wxVOu4TjgiA"],
    "Read the EIR like a bidder": ["3k2c36B7lfQ"],
    "Write the pre-appointment BEP": ["GzSLDobn51Q", "Lbu5I-9AcNc"],
    "Generate TIDPs and the MIDP": ["uhzkU6Ryg20", "CTeu4cM5ed0"],
    "Security-minded information management": ["xw394OV3jzA"],
    "Plan the handover": ["kBRWHBz7VXw", "Q4E7VbDUfIY", "Zq56mPIzgv4"],
    "BIM implementation best practices": ["ewviy9QDcWc", "6XkYYsOSmag"],
  },
  client: {
    "ISO 19650 concepts": ["0FKKcpaaDI4", "niU_1YoR-4A"],
    "Organisational information requirements": ["Iqpsty70K6I"],
    "Asset information requirements": ["tKTeMUcFhi4"],
    "Exchange information requirements": ["3k2c36B7lfQ"],
    "Project information standard": ["lEvarrG6w5g", "LuMHdLn_QVI"],
    "CDE procedure": ["v6NF0i8ZUAs", "qb7FWv4l-zM"],
    "Security triage": ["xw394OV3jzA"],
    "Information in the operational phase": ["Gw2dOtJAoew"],
    "COBie practical guide": ["kBRWHBz7VXw", "-ZDQOm-laug", "okFo94St75s"],
    "Implementation guide": ["ewviy9QDcWc"],
  },
  "ai-governance": {
    "AI in BIM": ["3t5DX7iL9WY", "iLfKAO9aa54"],
    "Connecting AI to BIM tools": ["Qm_vRncHHGU", "Neb7g5xPfFk"],
    "Review an AI connection set-up": ["STy8v26dOfw"],
    "Security-minded information management": ["xw394OV3jzA"],
  },
};

const byId = new Map(VIDEOS.map((v) => [v.id, v]));

/** Videos for one step, in the interface language first. */
export function stepVideos(pathId: string, stepTitle: string, lang: "en" | "ar" = "en"): Video[] {
  const list = (PATH_VIDEOS[pathId]?.[stepTitle] ?? []).map((id) => byId.get(id)).filter((v): v is Video => !!v);
  return [...list.filter((v) => v.lang === lang), ...list.filter((v) => v.lang !== lang)];
}

/** Number of distinct videos linked to a path. */
export const pathVideoCount = (p: LearningPath) => new Set(p.steps.flatMap((s) => PATH_VIDEOS[p.id]?.[s.title] ?? [])).size;
