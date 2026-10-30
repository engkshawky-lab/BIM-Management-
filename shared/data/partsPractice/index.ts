import { part1Practice } from "./part1";
import { part2Practice } from "./part2";
import { part3Practice } from "./part3";
import { part4Practice } from "./part4";
import { part5Practice } from "./part5";
import { part6Practice } from "./part6";
import type { PartPractice } from "./types";

export const partsPractice: PartPractice[] = [part1Practice, part2Practice, part3Practice, part4Practice, part5Practice, part6Practice];
export const practiceFor = (part: number): PartPractice => partsPractice.find((p) => p.part === part) ?? { part: 1, examples: [], faq: [], quiz: [] };
