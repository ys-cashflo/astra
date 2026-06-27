// Independent speech-to-text core. No framework, no app coupling.
// Default provider: Groq (hosted Whisper large-v3-turbo) — battle-tested + fast.
// Swap PROVIDER=openai or PROVIDER=sarvam to change backends.
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/audio/transcriptions",
    key: () => process.env.GROQ_API_KEY,
    model: process.env.STT_MODEL || "whisper-large-v3", // full model = best multilingual coverage
    verbose: true, // ask Whisper to also return the detected language
  },
  openai: {
    url: "https://api.openai.com/v1/audio/transcriptions",
    key: () => process.env.OPENAI_API_KEY,
    model: process.env.STT_MODEL || "whisper-1",
    verbose: true,
  },
  // Sarvam — strongest for Indian languages / dialects (Maithili, Bhojpuri, code-mixed)
  sarvam: {
    url: "https://api.sarvam.ai/speech-to-text",
    key: () => process.env.SARVAM_API_KEY,
    model: process.env.STT_MODEL || "saarika:v2",
    auth: "subscription", // uses api-subscription-key header instead of Bearer
  },
};

/**
 * Transcribe audio to text.
 * @param {Buffer} audioBuffer - raw audio bytes (wav/mp3/m4a/webm/ogg/flac)
 * @param {object} [opts]
 * @param {string} [opts.filename="audio.webm"]
 * @param {string} [opts.language]  - ISO hint e.g. "hi","ta","mr","te" (optional)
 * @param {string} [opts.provider]  - "groq" | "openai" | "sarvam"
 * @returns {Promise<{text:string, provider:string, model:string}>}
 */
export async function transcribe(audioBuffer, opts = {}) {
  const providerName = opts.provider || process.env.STT_PROVIDER || "groq";

  // Local, no-key path (Whisper via Transformers.js).
  if (providerName === "local") {
    const { transcribeLocal } = await import("./transcribe-local.js");
    return transcribeLocal(audioBuffer, opts);
  }

  // Deepgram — auto-detects language from the input audio.
  if (providerName === "deepgram") {
    const { transcribeDeepgram } = await import("./transcribe-deepgram.js");
    return transcribeDeepgram(audioBuffer, opts);
  }

  const p = PROVIDERS[providerName];
  if (!p) throw new Error(`Unknown STT provider: ${providerName}`);
  const apiKey = p.key();
  if (!apiKey) throw new Error(`Missing API key for provider "${providerName}"`);

  const form = new FormData();
  form.append("file", new Blob([audioBuffer]), opts.filename || "audio.webm");
  form.append("model", p.model);
  if (opts.language) form.append("language", opts.language); // omit to auto-detect
  if (p.verbose) form.append("response_format", "verbose_json"); // returns detected language

  const headers =
    p.auth === "subscription"
      ? { "api-subscription-key": apiKey }
      : { Authorization: `Bearer ${apiKey}` };

  const res = await fetch(p.url, { method: "POST", headers, body: form });
  if (!res.ok) {
    throw new Error(`STT ${providerName} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Groq/OpenAI return {text, language}; Sarvam returns {transcript, language_code}
  const text = data.text ?? data.transcript ?? "";
  const language = data.language ?? data.language_code ?? opts.language ?? null;
  return { text, provider: providerName, model: p.model, language };
}

/** Convenience: transcribe a file path. */
export async function transcribeFile(path, opts = {}) {
  const buf = await readFile(path);
  return transcribe(buf, { filename: basename(path), ...opts });
}
