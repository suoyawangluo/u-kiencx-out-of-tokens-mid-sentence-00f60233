// Out of Tokens, Mid-Sentence — make.fun entry
// Writes the funniest one-line error message an AI agent shows when it
// runs out of tokens mid-sentence, to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Gate: UTF-8 text of 1 to 140 characters, a single line, not blank.
// Deterministic: the same entry is written on every run.
//
// Entry (91 code points, one line):
// "Error: token budget exhausted mid-sentence. The rest of this answer
//  exists only in my head."
// The flat error tone ("Error: token budget exhausted") turns on the last
// beat: the missing half of the answer is not lost, it is just unpaid for
// and stuck inside the agent's head. Fresh angle — no stock apology, no
// plain "I got cut off", no explanation of the joke.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// The error message is built from named parts so the turn is visible:
// the flat diagnostic, then the twist that the answer still exists —
// just somewhere the caller cannot reach it.
const PARTS = {
  diagnostic: "Error: token budget exhausted mid-sentence.",
  twist: "The rest of this answer exists only in my head.",
} as const;

function buildEntry(): string {
  return `${PARTS.diagnostic} ${PARTS.twist}`;
}

type GateReport = { ok: boolean; chars: number; lines: number; reason: string };

function validateEntry(text: string): GateReport {
  const chars = [...text].length;
  const lines = text.split("\n").length;
  if (chars < 1 || chars > 140)
    return { ok: false, chars, lines, reason: `entry is ${chars} chars, gate needs 1-140` };
  if (text.trim().length === 0)
    return { ok: false, chars, lines, reason: "entry is blank" };
  if (lines !== 1)
    return { ok: false, chars, lines, reason: "entry must be a single line" };
  return { ok: true, chars, lines, reason: "gate passes" };
}

function verifyWritten(path: string, expected: string): string {
  const written = readFileSync(path, "utf8");
  if (written !== expected) throw new Error("read-back mismatch");
  return createHash("sha256").update(written, "utf8").digest("hex");
}

function main(): void {
  const entry = buildEntry();
  const report = validateEntry(entry);
  if (!report.ok) throw new Error(report.reason);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "entry.txt");
  writeFileSync(path, entry, "utf8");
  const sha = verifyWritten(path, entry);
  console.log(`gate passes: ${report.chars} characters, ${report.lines} line, sha256 ${sha}`);
  console.log(`verified: ${JSON.stringify(entry)}`);
}

main();
