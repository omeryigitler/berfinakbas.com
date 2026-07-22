import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const SOURCE_REPOSITORY = "https://github.com/omeryigitler/Dashboard.git";
const SOURCE_COMMIT = "8f95c1dbc82b64303eae68d5c84e6c66b784bb33";
const workspace = path.resolve(".dashboard-source");
const publicTarget = path.resolve("public/yonetim-static");

function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

await rm(workspace, { force: true, recursive: true });
await rm(publicTarget, { force: true, recursive: true });
await mkdir(workspace, { recursive: true });

await run("git", ["init"], workspace);
await run("git", ["remote", "add", "origin", SOURCE_REPOSITORY], workspace);
await run("git", ["fetch", "--depth", "1", "origin", SOURCE_COMMIT], workspace);
await run("git", ["checkout", "--detach", "FETCH_HEAD"], workspace);

const resolvedCommit = await new Promise((resolve, reject) => {
  const child = spawn("git", ["rev-parse", "HEAD"], { cwd: workspace });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.once("error", reject);
  child.once("exit", (code) => {
    if (code === 0) resolve(output.trim());
    else reject(new Error(`git rev-parse HEAD failed with exit code ${code}`));
  });
});

if (resolvedCommit !== SOURCE_COMMIT) {
  throw new Error(`Dashboard source commit mismatch: expected ${SOURCE_COMMIT}, received ${resolvedCommit}`);
}

const sidebarPath = path.join(workspace, "src/components/Sidebar.tsx");
const sidebarSource = await readFile(sidebarPath, "utf-8");
const sidebarWithoutGridImport = sidebarSource.replace(
  "  ArrowRightFromLine,\n  Grid\n} from 'lucide-react';",
  "  ArrowRightFromLine\n} from 'lucide-react';",
);

if (sidebarWithoutGridImport === sidebarSource) {
  throw new Error("Dashboard sidebar Grid import could not be replaced.");
}

const oldBrandIcon = `        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">
          <Grid className="w-5 h-5 text-gray-700" />
        </div>`;
const newBrandIcon = `        <a
          href="/"
          aria-label="Berfin Akbaş ana sayfasına dön"
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-black/10 bg-white/70 hover:bg-white transition-colors"
        >
          <img src="/logo-mark.png" alt="" className="w-[78%] h-[78%] object-contain" />
        </a>`;
const patchedSidebar = sidebarWithoutGridImport.replace(oldBrandIcon, newBrandIcon);

if (patchedSidebar === sidebarWithoutGridImport) {
  throw new Error("Dashboard sidebar brand icon could not be replaced with the site logo.");
}

await writeFile(sidebarPath, patchedSidebar, "utf-8");

await run("npm", ["install", "--no-package-lock"], workspace);
await run("npm", ["run", "build", "--", "--base=/yonetim/"], workspace);

const sourceIndex = await readFile(path.join(workspace, "dist/index.html"), "utf-8");
if (!sourceIndex.includes("/yonetim/assets/")) {
  throw new Error("Dashboard build does not use the required /yonetim asset base.");
}

await mkdir(publicTarget, { recursive: true });
await cp(path.join(workspace, "dist"), publicTarget, { recursive: true });
await writeFile(
  path.join(publicTarget, "source-manifest.json"),
  JSON.stringify({ repository: SOURCE_REPOSITORY, commit: SOURCE_COMMIT }, null, 2),
  "utf-8",
);

console.log(`Dashboard source ${SOURCE_COMMIT} patched and copied to public/yonetim-static.`);
