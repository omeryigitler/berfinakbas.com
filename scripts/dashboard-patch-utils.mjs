import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve(".dashboard-source/src");

export function replaceRequired(source, search, replacement, label) {
  const patched = source.replace(search, replacement);
  if (patched === source) throw new Error(`${label} could not be applied.`);
  return patched;
}

export function replaceRegexRequired(source, pattern, replacement, label) {
  const patched = source.replace(pattern, replacement);
  if (patched === source) throw new Error(`${label} could not be applied.`);
  return patched;
}

export async function patchFile(relativePath, transform) {
  const filePath = path.join(sourceRoot, relativePath);
  const source = await readFile(filePath, "utf-8");
  const patched = transform(source);
  await writeFile(filePath, patched, "utf-8");
}
