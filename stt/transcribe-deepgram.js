// Deepgram STT — auto-detects the spoken language from the input audio.
// Raw-binary body, Token auth, Deepgram-specific response shape.
const MIME = {
  wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4",
  webm: "audio/webm", ogg: "audio/ogg", oga: "audio/ogg", flac: "audio/flac", aac: "audio/aac",
};

/**
 * @param {Buffer} audioBuffer
 * @param {object} [opts]
 * @param {string} [opts.filename]    - used to infer content-type
 * @param {string} [opts.contentType] - explicit audio mime (preferred)
 * @param {string} [opts.language]    - force a language (e.g. "hi"); omit to AUTO-DETECT
 * @returns {Promise<{text:string, provider:string, model:string, language:string|null}>}
 */
export async function transcribeDeepgram(audioBuffer, opts = {}) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("Missing DEEPGRAM_API_KEY");

  const model = process.env.STT_MODEL || "nova-2";
  const params = new URLSearchParams({ model, smart_format: "true", punctuate: "true" });

  if (opts.language && opts.language !== "auto") {
    params.set("language", opts.language);          // caller forced a language
  } else if (model.startsWith("nova-3")) {
    params.set("language", "multi");                // nova-3: multilingual / code-switching
  } else {
    params.set("detect_language", "true");          // nova-2: auto-detect from the input
  }

  const ext = (opts.filename || "").split(".").pop()?.toLowerCase();
  const contentType = opts.contentType || MIME[ext] || "application/octet-stream";

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: { Authorization: `Token ${key}`, "Content-Type": contentType },
    body: audioBuffer,
  });
  if (!res.ok) {
    throw new Error(`Deepgram failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const channel = data.results?.channels?.[0];
  const text = channel?.alternatives?.[0]?.transcript ?? "";
  const language = channel?.detected_language || opts.language || null;
  return { text: text.trim(), provider: "deepgram", model, language };
}
