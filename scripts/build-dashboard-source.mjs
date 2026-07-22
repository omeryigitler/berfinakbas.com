import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const SOURCE_REPOSITORY = "https://github.com/omeryigitler/Dashboard.git";
const SOURCE_COMMIT = "632ada3f9878c6452846eb3660cba7abc8149840";
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

const sourceIndexPath = path.join(workspace, "dist/index.html");
const sourceIndex = await readFile(sourceIndexPath, "utf-8");
if (!sourceIndex.includes("/yonetim/assets/")) {
  throw new Error("Dashboard build does not use the required /yonetim asset base.");
}

const sidebarLogoScript = `<script>
(() => {
  const applySidebarLogo = () => {
    const icon = document.querySelector('#sidebar-container > div:first-of-type > div:first-child');
    if (!(icon instanceof HTMLElement)) return;
    if (icon.querySelector('img[data-sidebar-home-logo]')) return;

    const image = document.createElement('img');
    image.src = '/logo-mark.png';
    image.alt = '';
    image.dataset.sidebarHomeLogo = 'true';
    image.style.width = '78%';
    image.style.height = '78%';
    image.style.objectFit = 'contain';

    icon.replaceChildren(image);
    icon.setAttribute('aria-label', 'Berfin Akbaş ana sayfasına dön');
    icon.setAttribute('role', 'link');
    icon.setAttribute('tabindex', '0');
    icon.style.width = '32px';
    icon.style.height = '32px';
    icon.style.cursor = 'pointer';
    icon.style.overflow = 'hidden';
    icon.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    icon.style.background = 'rgba(255, 255, 255, 0.7)';

    const goHome = () => window.location.assign('/');
    icon.addEventListener('click', goHome);
    icon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goHome();
      }
    });
  };

  const observer = new MutationObserver(applySidebarLogo);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  applySidebarLogo();
})();
</script>`;

const enhancedSourceIndex = sourceIndex.replace("</body>", `${sidebarLogoScript}\n</body>`);
if (enhancedSourceIndex === sourceIndex) {
  throw new Error("Dashboard index could not be enhanced with the home logo behavior.");
}
await writeFile(sourceIndexPath, enhancedSourceIndex, "utf-8");

await mkdir(publicTarget, { recursive: true });
await cp(path.join(workspace, "dist"), publicTarget, { recursive: true });
await writeFile(
  path.join(publicTarget, "source-manifest.json"),
  JSON.stringify({ repository: SOURCE_REPOSITORY, commit: SOURCE_COMMIT }, null, 2),
  "utf-8",
);

console.log(`Dashboard source ${SOURCE_COMMIT} copied with the site-logo enhancement to public/yonetim-static.`);
