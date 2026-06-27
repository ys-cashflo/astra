// Fully local speech-to-text — NO API key, NO Python, runs Whisper in Node via WASM.
// Uses Transformers.js (onnxruntime). Model downloads once on first run (~200MB), then offline.
// Input must be WAV. Convert other formats first, e.g.:  ffmpeg -i in.mp3 -ar 16000 -ac 1 out.wav
import pkg from "wavefile";
const { WaveFile } = pkg;

let transcriberPromise; // cache the loaded model across calls

async function getTranscriber() {
  if (!transcriberPromise) {
    const { pipeline } = await import("@huggingface/transformers");
    const model = process.env.STT_MODEL || "onnx-community/whisper-base"; // multilingual
    transcriberPromise = pipeline("automatic-speech-recognition", model);
  }
  return transcriberPromise;
}

/**
 * @param {Buffer} audioBuffer - WAV bytes
 * @param {object} [opts] - { language?: "hi"|"ta"|... }
 * @returns {Promise<{text:string, provider:string, model:string}>}
 */
export async function transcribeLocal(audioBuffer, opts = {}) {
  const wav = new WaveFile(audioBuffer);
  wav.toBitDepth("32f");
  wav.toSampleRate(16000);
  let samples = wav.getSamples();
  if (Array.isArray(samples)) samples = samples[0]; // take first channel if stereo
  const audio = Float32Array.from(samples);

  const transcriber = await getTranscriber();
  const result = await transcriber(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: opts.language, // optional; auto-detected if omitted
    task: "transcribe",
  });
  return {
    text: (result.text || "").trim(),
    provider: "local",
    model: process.env.STT_MODEL || "onnx-community/whisper-base",
  };
}
