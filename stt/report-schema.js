// Report schema for the Astra Reunite intake agent.
// This is the *human-extractable* subset of the `report` table — the fields a
// person actually says when they report a missing person / item by voice.
//
// System / derived columns are intentionally NOT here (the DB or downstream
// services own them): id, external_case_id, master_incident_id, reported_by,
// language_id, description_tsv, description_embed, last_seen_node,
// last_seen_geom, resolution_hours, is_duplicate, created_at.

// Enum domains, mirrored from the `report` table.
export const ENUMS = {
  type: ["missing_person", "found_person", "lost_item", "found_item"],
  gender: ["Male", "Female", "Other", "Unknown"],
  age_band: ["0-12", "13-17", "18-40", "41-60", "61-70", "71-80", "80+", "Unknown"],
  status: [
    "draft", "provisional", "verified", "active_search",
    "located", "reunited", "unresolved", "transferred_hospital", "closed",
  ],
};

/**
 * Every field the agent may fill from speech.
 * `major: true`  -> if it's still missing we ask the reporter for it.
 * `enum`         -> constrained to ENUMS[...] (model must pick one).
 */
export const FIELDS = [
  { name: "type", enum: "type", major: false,
    desc: "What is being reported. Default to missing_person unless they clearly describe an item or someone they FOUND." },
  { name: "person_name", major: true,
    desc: "Name of the missing/found person. Often unknown — leave null if not said." },
  { name: "gender", enum: "gender", major: true,
    desc: "Gender of the person. Use Unknown only if truly unclear." },
  { name: "age_band", enum: "age_band", major: true,
    desc: "Approximate age bucket. Infer from any age/'5 year old'/'old man' cue." },
  { name: "language", major: false,
    desc: "Language the person speaks / report was given in, as a name e.g. 'Hindi', 'Tamil'." },
  { name: "origin_state", major: false,
    desc: "Home state of the person (where they came from)." },
  { name: "origin_district", major: false,
    desc: "Home district / city of the person." },
  { name: "physical_description", major: true,
    desc: "Free-text appearance: clothing colour, build, height, marks, what they carried. The single most useful field for search." },
  { name: "last_seen_text", major: true,
    desc: "Where and when the person was last seen, in the reporter's own words (raw location string)." },
  { name: "reporter_mobile", major: true,
    desc: "Contact mobile number to reach the reporter. Needed for callback when a match is found." },
  { name: "remarks", major: false,
    desc: "Anything else relevant that doesn't fit another field." },
];

export const MAJOR_FIELDS = FIELDS.filter((f) => f.major).map((f) => f.name);

/** A blank report — the starting state for a new intake. */
export function emptyReport() {
  return Object.fromEntries(FIELDS.map((f) => [f.name, null]));
}

/** Which major fields are still empty/unknown in a given report. */
export function missingMajors(report = {}) {
  return MAJOR_FIELDS.filter((name) => {
    const v = report[name];
    return v == null || v === "" || v === "Unknown";
  });
}

/**
 * JSON Schema for the `fill_report` tool the model is forced to call.
 * Every field is nullable so the model can honestly say "not stated".
 */
export function toolParametersSchema() {
  const properties = {};
  for (const f of FIELDS) {
    const base = f.enum
      ? { type: ["string", "null"], enum: [...ENUMS[f.enum], null] }
      : { type: ["string", "null"] };
    properties[f.name] = { ...base, description: f.desc };
  }
  properties.clarifying_question = {
    type: ["string", "null"],
    description:
      "What to say back to the reporter, in THEIR language: first a warm, natural line that " +
      "calms and reassures them (the team is already searching, they're not alone), then — if any " +
      "MAJOR field is still missing — a gentle ask for the 1–3 most important missing details. " +
      "2–3 sentences, never scripted-sounding. Reassurance only (no questions) when nothing major is missing.",
  };
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: FIELDS.map((f) => f.name).concat("clarifying_question"),
  };
}

export const FILL_REPORT_TOOL = {
  type: "function",
  function: {
    name: "fill_report",
    description:
      "Record the structured missing-person/item report extracted from the reporter's words.",
    parameters: toolParametersSchema(),
  },
};
