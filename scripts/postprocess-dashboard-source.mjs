import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const assets = path.resolve("public/yonetim-static/assets");

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}

for (const file of await walk(assets)) {
  if (!file.endsWith(".js")) continue;
  const source = await readFile(file, "utf-8");
  const patched = source
    .replaceAll("Ömer Yiğitler", "Berfin Akbaş")
    .replaceAll("Ömer YİĞİTLER", "Berfin Akbaş")
    .replaceAll("ÖMER YİĞİTLER", "Berfin Akbaş")
    .replaceAll("ÖY", "BA");
  if (patched !== source) await writeFile(file, patched, "utf-8");
}

console.log("Dashboard identity normalization completed without DOM runtime patches.");
