# astra-stt — Speech-to-Text service

An **independent**, drop-in speech-to-text module for Astra Reunite. It converts a
voice note into text and **auto-detects the spoken language** — built so families and
field staff can report a missing person by *speaking* instead of typing, in any major
Indian language.

No coupling to the rest of the app: it talks over one tiny HTTP contract and can also be
used as a Node module or CLI.

## What it does

- Accepts audio (wav / mp3 / m4a / webm / ogg / flac) and returns the transcript.
- **Auto-detects the language from the input** (Hindi, Marathi, Tamil, Telugu, Bengali,
  English, …) — the caller doesn't have to specify it.
- Returns the detected language alongside the text, so the rest of Astra can route by language.
- Pluggable provider: **Groq Whisper** (default, broad multilingual), Deepgram, OpenAI,
  Sarvam (best for Indic dialects), or fully-local Whisper (no API key).
- Ships a minimal browser page to record from the mic and transcribe.

## Why Groq Whisper is the default

Whisper `large-v3` covers ~99 languages including all major Indian ones and auto-detects
language natively. (Deepgram is faster but only reliably handles English/Hindi, so it's
optional here. Sarvam is best for dialects/code-mixed Indic but needs its own key.)

## Setup

```bash
cd stt
npm install
cp .env.example .env        # set GROQ_API_KEY (default provider)
```

## Use it 3 ways

### 1. HTTP service (also serves a record-and-transcribe page)
```bash
npm run serve                                   # http://localhost:8090
curl -F "audio=@clip.wav" http://localhost:8090/transcribe
# -> { "text": "...", "provider": "groq", "model": "whisper-large-v3", "language": "Hindi" }
```
Open <http://localhost:8090> to record from the mic (or upload a file) and see the transcript.

### 2. CLI
```bash
npm run cli -- sample.wav            # auto-detect language
npm run cli -- sample.wav hi         # force a language
```

### 3. As a module
```js
import { transcribe, transcribeFile } from "./transcribe.js";
const { text, language } = await transcribeFile("clip.mp3");   // language auto-detected
```

## HTTP contract (for integrators)

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| `POST` | `/transcribe` | multipart field `audio`; optional `?language=hi`, `?provider=groq\|deepgram\|sarvam\|local` | `{ text, provider, model, language }` |
| `GET` | `/health` | — | `{ ok: true }` |

Leave `language` off to auto-detect.

## Voice → structured report (intake agent)

The STT text is only step one. The **intake agent** folds that text into the Astra
`report` schema and — when a *major* field is still missing — asks the reporter for
it **in their own language**. It's a conversation: speak → form fills → it asks back →
you answer by voice → it merges. State lives with the caller, so the agent stays
stateless and drop-in.

- **Extracts** the human-stated fields: `type, person_name, gender, age_band,
  language, origin_state, origin_district, physical_description, last_seen_text,
  reporter_mobile, remarks`. System/derived columns (ids, embeddings, geom, tsv, …)
  are left to the DB.
- **Never invents** anything — unstated fields stay `null`; enums are honoured.
- **Asks only for the majors** if missing: `person_name, gender, age_band,
  physical_description, last_seen_text, reporter_mobile`.
- Reuses your **`GROQ_API_KEY`** (tool-calling on `llama-3.3-70b-versatile`) — no new key.

### Try it
```bash
npm run serve                 # then open http://localhost:8090/report.html  (full voice loop)

# CLI (text in — in production this text comes from STT):
npm run report -- "मेरी बेटी खो गई है, करीब पाँच साल की, लाल फ्रॉक में"
npm run report -- clip.wav                       # transcribe a file, then fill
npm run report -- "उसका नाम रिया है" --state r.json   # multi-turn: load+save the report
```

### HTTP
| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/report` | JSON `{ text, report?, language? }` | `{ report, missing, clarifyingQuestion, complete }` |
| `POST` | `/voice-report` | multipart `audio` + optional `report` (JSON string), `?language=` | STT fields **plus** `{ report, missing, clarifyingQuestion, complete }` |

`/voice-report` does transcribe-then-fill in one call. Pass the returned `report`
back on the next turn to continue the conversation.

### Spoken follow-ups (natural voice)
The follow-up question is also **read aloud** so a reporter who can't read can answer
hands-free. By default the browser speaks it (now **language-aware** — it picks the
best Hindi/Tamil/… voice instead of a robotic English one). For a fully **neural**
voice, set a TTS key and the UI uses it automatically:

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/speak` | JSON `{ text, language?, provider? }` | `{ audioBase64, contentType, provider }` |

| Provider | Key | Best for |
|---|---|---|
| `sarvam` | `SARVAM_API_KEY` | most natural Indian-language voices (Bulbul) |
| `openai` | `OPENAI_API_KEY` | natural, follows the text's language |
| `groq` | `GROQ_API_KEY` | very natural but English/Arabic only |

Pick one via `TTS_PROVIDER` (see `.env.example`). No key set → browser voice fallback.

### Files
| File | Role |
|---|---|
| `report-schema.js` | report fields, enums, major-field list, tool JSON schema |
| `report-agent.js` | `fillReport()` — extract + merge + ask (Groq/OpenAI tool-calling) |
| `report-cli.js` | terminal intake (text or audio file) |
| `tts.js` | `synthesize()` — natural voice for the follow-up (Sarvam/OpenAI/Groq) |
| `public/report.html` | full voice loop: record → fill → spoken follow-up → repeat |

Swap the model with `AGENT_PROVIDER` / `AGENT_MODEL` (see `.env.example`).

## Switching provider

Set `STT_PROVIDER` in `.env` (or `?provider=` per request):

| Provider | Key env | Best for |
|---|---|---|
| `groq` (default) | `GROQ_API_KEY` | broad multilingual, auto-detect |
| `sarvam` | `SARVAM_API_KEY` | Indic dialects, code-mixed |
| `deepgram` | `DEEPGRAM_API_KEY` | fast English/Hindi |
| `openai` | `OPENAI_API_KEY` | Whisper via OpenAI |
| `local` | none | offline, no API key (WAV input) |

## Files

| File | Role |
|---|---|
| `server.js` | HTTP service + serves the recorder page |
| `transcribe.js` | core; Groq / OpenAI / Sarvam |
| `transcribe-deepgram.js` | Deepgram provider (auto-detect) |
| `transcribe-local.js` | no-key local Whisper (Transformers.js) |
| `cli.js` | terminal usage |
| `public/index.html` | mic record + upload + transcribe UI |
| `.env.example` | provider keys (copy to `.env`) |

> Secrets live in `.env` (gitignored). Never commit real API keys.
