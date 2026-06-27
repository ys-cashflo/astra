// Text-to-speech for the intake agent's spoken follow-up questions.
// Pluggable + multilingual, mirroring transcribe.js. OPTIONAL: if no TTS key is
// configured the browser's built-in voice is used instead (see public/report.html),
// so the voice loop still works with zero extra keys.
//
// Best naturalness for Indian languages: Sarvam (Bulbul). OpenAI is a strong
// general option. Groq PlayAI is natural but English/Arabic only.

const LANG_TO_BCP47 = {
  hindi: "hi-IN", hi: "hi-IN",
  tamil: "ta-IN", ta: "ta-IN",
  telugu: "te-IN", te: "te-IN",
  marathi: "mr-IN", mr: "mr-IN",
  bengali: "bn-IN", bn: "bn-IN",
  kannada: "kn-IN", kn: "kn-IN",
  malayalam: "ml-IN", ml: "ml-IN",
  gujarati: "gu-IN", gu: "gu-IN",
  punjabi: "pa-IN", pa: "pa-IN",
  odia: "od-IN", or: "od-IN",
  english: "en-IN", en: "en-IN",
};

function bcp47(language) {
  if (!language) return "hi-IN";
  const k = String(language).toLowerCase().trim();
  return LANG_TO_BCP47[k] || LANG_TO_BCP47[k.split(/[-_]/)[0]] || "en-IN";
}

/** Pick a provider: explicit > env > whichever key is present. Null if none. */
function pickProvider(provider) {
  if (provider) return provider;
  if (process.env.TTS_PROVIDER) return process.env.TTS_PROVIDER;
  if (process.env.SARVAM_API_KEY) return "sarvam";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null; // -> caller falls back to the browser voice
}

/**
 * Synthesize speech for `text`.
 * @returns {Promise<{audioBase64:string, contentType:string, provider:string}>}
 */
export async function synthesize(text, { language, provider } = {}) {
  if (!text || !text.trim()) throw new Error("synthesize: empty text");
  const name = pickProvider(provider);
  if (!name) {
    throw new Error("No TTS provider configured (set SARVAM_API_KEY / OPENAI_API_KEY, or TTS_PROVIDER).");
  }
  if (name === "sarvam") return sarvam(text, language);
  if (name === "openai") return openai(text);
  if (name === "groq") return groq(text);
  throw new Error(`Unknown TTS provider: ${name}`);
}

// Sarvam Bulbul — most natural for Indian languages / code-mixed speech.
async function sarvam(text, language) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("Missing SARVAM_API_KEY");
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: bcp47(language),
      speaker: process.env.TTS_VOICE || "anushka",
      model: process.env.TTS_MODEL || "bulbul:v2",
      speech_sample_rate: 22050,
    }),
  });
  if (!res.ok) throw new Error(`Sarvam TTS failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { audioBase64: data.audios?.[0], contentType: "audio/wav", provider: "sarvam" };
}

// OpenAI gpt-4o-mini-tts — natural, follows the language of the input text.
async function openai(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.TTS_VOICE || "nova",
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { audioBase64: buf.toString("base64"), contentType: "audio/mpeg", provider: "openai" };
}

// Groq PlayAI — very natural, but English/Arabic only (not for Indic questions).
async function groq(text) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");
  const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.TTS_MODEL || "playai-tts",
      voice: process.env.TTS_VOICE || "Celeste-PlayAI",
      input: text,
      response_format: "wav",
    }),
  });
  if (!res.ok) throw new Error(`Groq TTS failed: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { audioBase64: buf.toString("base64"), contentType: "audio/wav", provider: "groq" };
}
