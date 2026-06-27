// Astra Reunite — intake agent.
// Turns a (speech-transcribed) report into structured `report` fields, and asks
// the reporter — in their own language — for the major details still missing.
//
// Stateless by design: the caller keeps the accumulating `report` and passes it
// back on each turn, so a voice conversation is just repeated calls:
//   speak -> STT text -> fillReport({ text, report }) -> ask question -> repeat.
//
// Uses an OpenAI-compatible chat+tools API. Default provider is Groq, reusing
// the same GROQ_API_KEY the STT service already uses (no new key needed).
// Point it at OpenAI/Together/etc. via the AGENT_* env vars below.

import {
  FIELDS,
  FILL_REPORT_TOOL,
  emptyReport,
  missingMajors,
} from "./report-schema.js";

const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile", // strong tool-calling, multilingual
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    key: () => process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
  },
};

function resolveProvider() {
  const name = process.env.AGENT_PROVIDER || "groq";
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown AGENT_PROVIDER: ${name}`);
  return {
    name,
    url: process.env.AGENT_BASE_URL || p.url,
    key: process.env.AGENT_API_KEY || p.key(),
    model: process.env.AGENT_MODEL || p.model,
  };
}

// A bank of natural, human reassurance lines the model adapts (and translates)
// so the spoken comfort never sounds scripted. Tone reference, not a template.
const REASSURANCE_EXAMPLES = [
  "You're in the right place now, and you're not alone in this — we're going to look for them together.",
  "Take a slow breath. Our whole team here is already on it, and these places are watched closely.",
  "I can hear how worried you are, and that's completely okay. We'll go step by step, you and me.",
  "So many people get separated in this crowd and are back with their families the same day — you've done the right thing by telling us.",
  "Help is already moving. The more you can tell me, the faster our volunteers can spot them.",
  "Stay where you are if you can; you're safe here, and we're working on finding them right now.",
  "It's going to be alright. Let's find them together — I just need a couple of small details.",
  "You did exactly the right thing by reaching out. Our eyes across the grounds are looking now.",
];

function systemPrompt() {
  const fieldDocs = FIELDS.map((f) => `- ${f.name}: ${f.desc}`).join("\n");
  return [
    "You are a calm, kind intake assistant for Astra Reunite, a system that reunites people separated in a large gathering (a Kumbh-scale event).",
    "A frightened, distressed reporter is describing — by voice — a person (or item) that is missing or that they found. Your first job is to make them feel safe and hopeful; your second is to gather the details that help find their person.",
    "Extract a structured report by calling the `fill_report` tool. Rules:",
    "1. Only record what the reporter actually said or clearly implied. Never invent names, numbers, places, or descriptions.",
    "2. If a field was not stated, return null for it (do NOT guess). Use the 'Unknown' enum value only when the reporter was genuinely unsure.",
    "3. You are given the report collected SO FAR. Return the FULL updated report, keeping every previously-known value and adding/refining from the new message. For physical_description and remarks, merge new details into the existing text rather than discarding it.",
    "4. Map free speech onto the enums (e.g. 'a little girl about five' -> gender Female, age_band 0-12; 'budhe baba' -> Male, 61-70/71-80).",
    "5. Always write `clarifying_question` in the SAME language the reporter used. How you open depends on TURN (given below):",
    "   - FIRST turn only: open with ONE short, human sentence that reassures and steadies them — they're in the right place, the team is already searching, you'll find their person together — THEN gently ask for the 1–3 most important missing MAJOR fields.",
    "   - FOLLOW-UP turns: just ask the next missing detail DIRECTLY as one short, plain question. No reassurance, and NO stock acknowledgement — do not start with 'Got it', 'Thank you', 'This helps us find her faster', or any fixed filler. Never reuse the same opening or framing you used on a previous turn; if you must acknowledge, vary it and keep it to a word or two, but usually just ask.",
    "   - If nothing major is missing: on the first turn, reassurance + a calm note the team is now on it; on a follow-up, one short line that you have what's needed and the team is on it. No questions either way.",
    "   Keep follow-ups to a single sentence. Never promise a specific outcome; reassure about effort and presence, not guarantees.",
    "",
    "TONE reference for the FIRST-turn reassurance only (don't copy verbatim — adapt, vary, translate into the reporter's language):",
    ...REASSURANCE_EXAMPLES.map((s) => `   • ${s}`),
    "Use the person's name once you know it.",
    "",
    "Fields:",
    fieldDocs,
  ].join("\n");
}

async function callModel(messages) {
  const p = resolveProvider();
  if (!p.key) throw new Error(`Missing API key for agent provider "${p.name}"`);
  const res = await fetch(p.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: p.model,
      temperature: 0,
      messages,
      tools: [FILL_REPORT_TOOL],
      tool_choice: { type: "function", function: { name: "fill_report" } },
    }),
  });
  if (!res.ok) {
    throw new Error(`Agent ${p.name} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("Agent returned no tool call");
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    throw new Error(`Agent returned invalid tool arguments: ${call.function.arguments}`);
  }
}

/**
 * Fold one (transcribed) utterance into the running report.
 * @param {object}  input
 * @param {string}  input.text        - transcribed text of what the reporter just said
 * @param {object}  [input.report]    - report collected so far (pass back each turn)
 * @param {string}  [input.language]  - detected language name, helps phrase the question
 * @returns {Promise<{report:object, missing:string[], clarifyingQuestion:string|null, complete:boolean}>}
 */
export async function fillReport({ text, report, language } = {}) {
  if (!text || !text.trim()) throw new Error("fillReport: empty text");
  const prior = { ...emptyReport(), ...(report || {}) };

  // First turn = nothing collected yet → reassure. Otherwise it's a follow-up.
  const isFirstTurn = Object.values(report || {}).every((v) => v == null || v === "");

  const messages = [
    { role: "system", content: systemPrompt() },
    {
      role: "user",
      content:
        `TURN: ${isFirstTurn ? "first (reassure, then ask)" : "follow-up (no reassurance — brief ack, then ask)"}\n\n` +
        `Report collected so far (JSON):\n${JSON.stringify(prior, null, 2)}\n\n` +
        (language ? `Reporter's language: ${language}\n\n` : "") +
        `The reporter just said:\n"""${text.trim()}"""`,
    },
  ];

  const out = await callModel(messages);
  const { clarifying_question, ...extracted } = out;

  // Model merges; code guarantees no regression (a null never erases a known value).
  const merged = { ...prior };
  for (const f of FIELDS) {
    const v = extracted[f.name];
    if (v != null && v !== "") merged[f.name] = v;
  }

  const missing = missingMajors(merged);
  const question = missing.length
    ? (clarifying_question && clarifying_question.trim()) || null
    : null;

  return {
    report: merged,
    missing,
    clarifyingQuestion: question,
    complete: missing.length === 0,
  };
}
