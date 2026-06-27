// Standalone HTTP endpoint: POST /transcribe  (multipart "audio" field)
// Run: GROQ_API_KEY=xxx npm run serve
import express from "express";
import multer from "multer";
import { transcribe } from "./transcribe.js";
import { fillReport } from "./report-agent.js";
import { synthesize } from "./tts.js";

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
const app = express();

app.use(express.static("public")); // serves the voice-capture page at /
app.use(express.json({ limit: "1mb" })); // for /report (text-in)

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no audio file (field 'audio')" });
    const out = await transcribe(req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype, // needed by Deepgram (raw-binary body)
      language: req.query.language, // optional ?language=hi (omit to auto-detect)
      provider: req.query.provider, // optional ?provider=groq|deepgram|sarvam|local
    });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Text-in: fold one utterance into a running report (the caller keeps `report`).
// Body: { text, report?, language? } -> { report, missing, clarifyingQuestion, complete }
app.post("/report", async (req, res) => {
  try {
    const { text, report, language } = req.body || {};
    if (!text) return res.status(400).json({ error: "missing 'text'" });
    res.json(await fillReport({ text, report, language }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Voice-in: transcribe audio AND fold it into the report in one call.
// multipart: field 'audio'; optional 'report' (JSON string), '?language='.
// -> { text, language, provider, model, report, missing, clarifyingQuestion, complete }
app.post("/voice-report", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no audio file (field 'audio')" });
    const stt = await transcribe(req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      language: req.query.language,
      provider: req.query.provider,
    });
    const prior = req.body?.report ? JSON.parse(req.body.report) : undefined;
    const filled = stt.text?.trim()
      ? await fillReport({ text: stt.text, report: prior, language: stt.language })
      : { report: prior || null, missing: [], clarifyingQuestion: null, complete: false };
    res.json({ ...stt, ...filled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Text-to-speech: speak the agent's follow-up question in a natural voice.
// Body: { text, language?, provider? } -> { audioBase64, contentType, provider }.
// Returns 503 (not 500) when no provider is configured, so the UI falls back
// to the browser's built-in voice.
app.post("/speak", async (req, res) => {
  try {
    const { text, language, provider } = req.body || {};
    if (!text) return res.status(400).json({ error: "missing 'text'" });
    res.json(await synthesize(text, { language, provider }));
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`STT service on http://localhost:${PORT}`));
