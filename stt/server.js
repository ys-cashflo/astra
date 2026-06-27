// Standalone HTTP endpoint: POST /transcribe  (multipart "audio" field)
// Run: GROQ_API_KEY=xxx npm run serve
import express from "express";
import multer from "multer";
import { transcribe } from "./transcribe.js";

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
const app = express();

app.use(express.static("public")); // serves the voice-capture page at /

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

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`STT service on http://localhost:${PORT}`));
