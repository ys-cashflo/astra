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
