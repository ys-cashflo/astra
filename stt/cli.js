// Standalone CLI: transcribe an audio file from the terminal.
// Usage: node cli.js <audiofile> [languageCode]
//   GROQ_API_KEY=xxx node cli.js sample.mp3 hi
import { transcribeFile } from "./transcribe.js";

const [, , path, language] = process.argv;
if (!path) {
  console.error("Usage: node cli.js <audiofile> [languageCode]");
  process.exit(1);
}

transcribeFile(path, { language })
  .then(({ text, provider, model }) => {
    console.error(`[${provider}/${model}]`);
    console.log(text);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
