import { Router } from "express";
import { z } from "zod";
import { IFC_VERSIONS, sanitiseSpecs } from "../../shared/ids";
import { AiError, ask, parseJson } from "../claude";
import { h, parse } from "./auth";

// IDS builder: extract buildingSMART IDS specifications from pasted EIR / LOIN text.
// The answer is sanitised into the shared IdsSpec shape; users review it before export.

const r = Router();

const EXPERT = `You are a senior ISO 19650 information manager and openBIM specialist who writes buildingSMART IDS 1.0 files.
Be precise and practical. Only turn statements that clearly require information on model elements into specifications; do not invent requirements the text does not support.`;
const JSON_ONLY = "Respond with one JSON object only, no Markdown fences.";

const SHAPE = `{"specs":[{"name":"short title","description":"why / source clause","ifcVersion":["IFC4"],"cardinality":"required|optional|prohibited",
 "applicability":{"entity":"IfcDoor","predefinedType":"optional UPPERCASE predefined type"},
 "requirements":[
  {"kind":"attribute","name":"Name|Description|LongName|ObjectType|Tag","value":"optional exact value","pattern":"optional XSD regex","cardinality":"required"},
  {"kind":"property","pset":"Pset_DoorCommon","name":"FireRating","dataType":"IFCLABEL","value":"optional","pattern":"optional","cardinality":"required"},
  {"kind":"classification","system":"Uniclass 2015","value":"optional","pattern":"optional e.g. Pr_[0-9]{2}(_[0-9]{2}){3}","cardinality":"required"},
  {"kind":"material","value":"optional","pattern":"optional","cardinality":"required"}]}]}`;

r.post("/ai/tools/ids-extract", h(async (req, res) => {
  const body = parse(z.object({ text: z.string().min(20, "Paste some EIR or LOIN text.").max(60_000), ifcVersion: z.string().max(40).optional() }), req.body, res); if (!body) return;
  const version = IFC_VERSIONS.find((v) => v === body.ifcVersion?.toUpperCase()) ?? "IFC4";
  const system = `${EXPERT}
Convert the information requirements in the user's text into IDS specifications for ${version}.
Rules:
- One specification per IFC class (or closely related group). Applicability entity is a single IFC class in PascalCase (IfcWall, IfcDoor, IfcSpace…). IDS entity facets do not include subtypes, so choose concrete classes.
- Prefer standard buildingSMART property sets (Pset_*Common, Qto_*BaseQuantities) and their exact property names; use a project set name only when the text names one.
- dataType is the upper-case IFC measure/value type (IFCLABEL, IFCTEXT, IFCBOOLEAN, IFCREAL, IFCINTEGER, IFCLENGTHMEASURE, IFCAREAMEASURE, IFCVOLUMEMEASURE, IFCIDENTIFIER).
- Use "value" only for one exact required value and "pattern" (XSD regex) for formats; otherwise leave both out (the value must merely exist).
- cardinality is "required" unless the text says optional or forbidden.
- At most 30 specifications. Keep names under 80 characters and descriptions under 200, citing the source section if the text has one.
${JSON_ONLY} Shape:
${SHAPE}`;
  const { text } = await ask({ system, messages: [{ role: "user", content: `EIR / LOIN text:\n${body.text}` }], maxTokens: 12000, effort: "low" });
  let raw: { specs?: unknown };
  try { raw = parseJson<{ specs?: unknown }>(text); } catch { throw new AiError("The AI answer could not be read. Try again or shorten the text.", 502); }
  const specs = sanitiseSpecs(raw?.specs, 30, version);
  res.json({ specs });
}));

export default r;
