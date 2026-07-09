import { existsSync, mkdirSync, statSync, createWriteStream } from "node:fs";
import { resolve, dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * Downloads the Whisper transcription model from Hugging Face into
 * public/models so the extension ships a self-contained, offline model.
 *
 * The large .onnx weights are git-ignored (see .gitignore), so this script is
 * what makes a fresh clone / CI build produce a working package. It runs as a
 * pre-build step and is idempotent: existing, non-empty files are skipped
 * unless FORCE_MODEL_DOWNLOAD=1 (or --force) is set.
 */

const MODEL_REPO = "Xenova/whisper-tiny.en";
// Pin a revision for reproducible builds. Override with MODEL_REVISION=<sha>.
// "main" tracks the latest weights, which are the ones compatible with the
// onnxruntime-web bundled by @huggingface/transformers.
const MODEL_REVISION = process.env.MODEL_REVISION ?? "main";

// dtype 'q8' in transformers.js resolves to the *_quantized.onnx weights.
const FILES = [
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
];

const DEST_ROOT = resolve("public/models", MODEL_REPO);
const force = process.argv.includes("--force") || process.env.FORCE_MODEL_DOWNLOAD === "1";

function fileUrl(path: string): string {
  return `https://huggingface.co/${MODEL_REPO}/resolve/${MODEL_REVISION}/${path}`;
}

async function downloadFile(path: string): Promise<void> {
  const dest = resolve(DEST_ROOT, path);

  if (!force && existsSync(dest) && statSync(dest).size > 0) {
    console.log(`  ✓ ${path} (cached)`);
    return;
  }

  const url = fileUrl(path);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  mkdirSync(dirname(dest), { recursive: true });
  // Stream to a temp file, then only the caller-visible path once complete, so
  // an interrupted download never leaves a truncated file that looks "cached".
  const tmp = `${dest}.download`;
  await pipeline(Readable.fromWeb(res.body as import("stream/web").ReadableStream), createWriteStream(tmp));
  const { renameSync } = await import("node:fs");
  renameSync(tmp, dest);

  const sizeMb = (statSync(dest).size / 1_048_576).toFixed(1);
  console.log(`  ↓ ${path} (${sizeMb} MB)`);
}

async function main(): Promise<void> {
  console.log(`Fetching ${MODEL_REPO}@${MODEL_REVISION} -> public/models/`);
  for (const file of FILES) {
    await downloadFile(file);
  }
  console.log("Model ready.");
}

main().catch((err) => {
  console.error(`\nModel download failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
