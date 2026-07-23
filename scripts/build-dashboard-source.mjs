import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const SOURCE_REPOSITORY = "https://github.com/omeryigitler/Dashboard.git";
const SOURCE_COMMIT = "6562cae4950c8e9e3e779f1e71bdef0c81a0ac98";
const KEDI_REPOSITORY = "https://github.com/omeryigitler/kedi.git";
const KEDI_COMMIT = "739faa3f41ba31dff435d07dbfeaa642e49290be";
const workspace = path.resolve(".dashboard-source");
const kediWorkspace = path.resolve(".kedi-source");
const overrides = path.resolve("dashboard-overrides/src");
const publicTarget = path.resolve("public/yonetim-static");

function replaceRequired(source, search, replacement, label) {
  const patched = source.replace(search, replacement);
  if (patched === source) throw new Error(`${label} could not be applied.`);
  return patched;
}

function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`)));
  });
}

async function checkoutPinnedSource(repository, commit, target, label) {
  await rm(target, { force: true, recursive: true });
  await mkdir(target, { recursive: true });
  await run("git", ["init"], target);
  await run("git", ["remote", "add", "origin", repository], target);
  await run("git", ["fetch", "--depth", "1", "origin", commit], target);
  await run("git", ["checkout", "--detach", "FETCH_HEAD"], target);
  const resolvedCommit = await new Promise((resolve, reject) => {
    const child = spawn("git", ["rev-parse", "HEAD"], { cwd: target });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`git rev-parse HEAD failed with exit code ${code}`)));
  });
  if (resolvedCommit !== commit) throw new Error(`${label} source commit mismatch: expected ${commit}, received ${resolvedCommit}`);
}

await rm(publicTarget, { force: true, recursive: true });
await checkoutPinnedSource(SOURCE_REPOSITORY, SOURCE_COMMIT, workspace, "Dashboard");
await checkoutPinnedSource(KEDI_REPOSITORY, KEDI_COMMIT, kediWorkspace, "Kedi");
await cp(overrides, path.join(workspace, "src"), { recursive: true, force: true });

const appPath = path.join(workspace, "src/App.tsx");
const appSource = await readFile(appPath, "utf-8");
let patchedApp = replaceRequired(
  appSource,
  `  const handleSelectLead = (leadId: string) => {
    if (!showOrta) return;

    if (selectedLeadId === leadId) {
      setShowSag(prev => !prev);
    } else {
      setSelectedLeadId(leadId);
      setShowSag(true);
    }
  };`,
  `  const handleSelectLead = (leadId: string) => {
    if (!showOrta) return;
    setSelectedLeadId(leadId);
    setShowSag(true);
  };`,
  "Module selection keeps workspace open",
);
patchedApp = patchedApp.replaceAll("Ömer Yiğitler", "Berfin Akbaş").replaceAll("Ömer YİĞİTLER", "Berfin Akbaş").replaceAll("ÖMER YİĞİTLER", "Berfin Akbaş");
await writeFile(appPath, patchedApp, "utf-8");

const sidebarPath = path.join(workspace, "src/components/Sidebar.tsx");
const sidebarSource = await readFile(sidebarPath, "utf-8");
const sidebarWithoutGridImport = sidebarSource.replace("  ArrowRightFromLine,\n  Grid\n} from 'lucide-react';", "  ArrowRightFromLine\n} from 'lucide-react';");
if (sidebarWithoutGridImport === sidebarSource) throw new Error("Dashboard sidebar Grid import could not be replaced.");
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
if (patchedSidebar === sidebarWithoutGridImport) throw new Error("Dashboard sidebar brand icon could not be replaced with the site logo.");
await writeFile(sidebarPath, patchedSidebar, "utf-8");

const dashboardComponents = path.join(workspace, "src/components");
const catWidgetPath = path.join(dashboardComponents, "KediCatWidget.tsx");
await cp(path.join(kediWorkspace, "src/components/CatWidget.tsx"), catWidgetPath);
const catWidgetSource = await readFile(catWidgetPath, "utf-8");
const catLayoutSource = `      const currentScale = propsRef.current.scale;
      const canvasSize = Math.max(120, Math.floor(180 * (currentScale / 1.3)));
      const halfSize = canvasSize / 2;

      if (containerRef.current) {
        const constrainedX = Math.max(halfSize, Math.min(window.innerWidth - halfSize, s.x));`;
const catLayoutTarget = `      const currentScale = propsRef.current.scale;
      const canvasSize = Math.max(120, Math.floor(180 * (currentScale / 1.3)));
      const halfSize = canvasSize / 2;
      const sidePadding = Math.max(24, Math.round(canvasSize * 0.14));
      const baseCatCenterY = canvasSize - 1 - 37 * currentScale;
      const floorShift = baseCatCenterY - halfSize;

      if (containerRef.current) {
        const minX = halfSize + sidePadding;
        const maxX = Math.max(minX, window.innerWidth - halfSize - sidePadding);
        const constrainedX = Math.max(minX, Math.min(maxX, s.x));`;
let patchedCatWidget = replaceRequired(catWidgetSource, catLayoutSource, catLayoutTarget, "Kedi floor layout");
patchedCatWidget = replaceRequired(patchedCatWidget, "          const bubbleBottom = Math.floor(140 * (currentScale / 1.3));", "          const bubbleBottom = Math.max(72, Math.floor(140 * (currentScale / 1.3) - floorShift));", "Kedi speech bubble floor offset");
patchedCatWidget = replaceRequired(patchedCatWidget, "            if (leftEdge < 10) shift = 10 - leftEdge;\n            else if (rightEdge > window.innerWidth - 10) shift = (window.innerWidth - 10) - rightEdge;", "            if (leftEdge < sidePadding) shift = sidePadding - leftEdge;\n            else if (rightEdge > window.innerWidth - sidePadding) shift = (window.innerWidth - sidePadding) - rightEdge;", "Kedi speech bubble side margins");
patchedCatWidget = replaceRequired(patchedCatWidget, "          drawCat(ctx, halfSize, halfSize, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);", "          const walkFloorAdjustment = pose === 'WALK' ? Math.max(0, Math.sin(walkCycle) * 5) : 0;\n          const catCenterY = baseCatCenterY - walkFloorAdjustment * currentScale;\n          drawCat(ctx, halfSize, catCenterY, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);", "Kedi canvas floor baseline");
await writeFile(catWidgetPath, patchedCatWidget, "utf-8");

const dashboardKitSource = await readFile(path.join(kediWorkspace, "src/dashboard/DashboardKit.tsx"), "utf-8");
let patchedDashboardKit = replaceRequired(dashboardKitSource, "import CatWidget from '../components/CatWidget';", "import CatWidget from './KediCatWidget';", "Kedi dashboard integration import");
patchedDashboardKit = replaceRequired(patchedDashboardKit, '    <div className="h-full overflow-y-auto bg-[#f6f5f1] p-5 text-[#292723] sm:p-6">', '    <div className="h-full overflow-y-auto overscroll-contain bg-[#f6f5f1] p-5 text-[#292723] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-6">', "Kedi hidden scrollbar");
await writeFile(path.join(dashboardComponents, "KediDashboardKit.tsx"), patchedDashboardKit, "utf-8");

await run("npm", ["install", "--no-package-lock"], workspace);
await run("npm", ["run", "build", "--", "--base=/yonetim/"], workspace);
const sourceIndex = await readFile(path.join(workspace, "dist/index.html"), "utf-8");
if (!sourceIndex.includes("/yonetim/assets/")) throw new Error("Dashboard build does not use the required /yonetim asset base.");
await mkdir(publicTarget, { recursive: true });
await cp(path.join(workspace, "dist"), publicTarget, { recursive: true });
await writeFile(path.join(publicTarget, "source-manifest.json"), JSON.stringify({
  repository: SOURCE_REPOSITORY,
  commit: SOURCE_COMMIT,
  architecture: "source-level-real-workspaces-v2",
  overrides: "dashboard-overrides/src",
  kedi: { repository: KEDI_REPOSITORY, commit: KEDI_COMMIT, integration: "native" },
}, null, 2), "utf-8");
console.log(`Dashboard source ${SOURCE_COMMIT} built with source-level real workspaces and native Kedi source ${KEDI_COMMIT}.`);
