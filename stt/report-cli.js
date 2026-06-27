// CLI for the intake agent — text in, structured report + follow-up out.
// Useful for testing without a mic; in production the text comes from STT.
//
//   npm run report -- "मेरी बेटी खो गई है, करीब पाँच साल की, लाल फ्रॉक में"
//   npm run report -- sample.wav            # transcribe a file, then fill
//
// Multi-turn: pass --state file.json to load/save the accumulating report,
// so you can answer the follow-up question on the next call.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fillReport } from "./report-agent.js";
import { transcribeFile } from "./transcribe.js";

const AUDIO_RE = /\.(wav|mp3|m4a|webm|ogg|flac)$/i;

async function main() {
  const args = process.argv.slice(2);
  let statePath = null;
  const idx = args.indexOf("--state");
  if (idx !== -1) { statePath = args[idx + 1]; args.splice(idx, 2); }

  const arg = args.join(" ").trim();
  if (!arg) {
    console.error('Usage: npm run report -- "<text>" | <audio-file> [--state report.json]');
    process.exit(1);
  }

  let text = arg, language;
  if (AUDIO_RE.test(arg)) {
    const stt = await transcribeFile(arg);
    text = stt.text; language = stt.language;
    console.error(`🗣️  ${language || "?"}: ${text}\n`);
  }

  let report;
  if (statePath && existsSync(statePath)) {
    report = JSON.parse(await readFile(statePath, "utf8"));
  }

  const out = await fillReport({ text, report, language });
  if (statePath) await writeFile(statePath, JSON.stringify(out.report, null, 2));

  console.log(JSON.stringify(out.report, null, 2));
  if (out.complete) {
    console.error("\n✅ All major fields captured.");
  } else {
    console.error(`\n• Missing major fields: ${out.missing.join(", ")}`);
    if (out.clarifyingQuestion) console.error(`❓ ${out.clarifyingQuestion}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
