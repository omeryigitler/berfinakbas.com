import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const SOURCE_REPOSITORY = "https://github.com/omeryigitler/Dashboard.git";
const SOURCE_COMMIT = "8a3eebcabe20169650b688d566f82220f3877f7a";
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

console.log(`Dashboard source ${SOURCE_COMMIT} copied unchanged to public/yonetim-static.`);
