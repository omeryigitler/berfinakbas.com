import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { gunzipSync } from "node:zlib";

const SOURCE_REPOSITORY = "https://github.com/omeryigitler/Dashboard.git";
const SOURCE_COMMIT = "6562cae4950c8e9e3e779f1e71bdef0c81a0ac98";
const KEDI_REPOSITORY = "https://github.com/omeryigitler/kedi.git";
const KEDI_COMMIT = "739faa3f41ba31dff435d07dbfeaa642e49290be";
const workspace = path.resolve(".dashboard-source");
const kediWorkspace = path.resolve(".kedi-source");
const publicTarget = path.resolve("public/yonetim-static");
const MODULE_WORKSPACE_OVERRIDE_GZIP_BASE64 = "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";

function replaceRequired(source, search, replacement, label) {
  const patched = source.replace(search, replacement);
  if (patched === source) {
    throw new Error(`${label} could not be patched.`);
  }
  return patched;
}

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
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(`git rev-parse HEAD failed with exit code ${code}`));
    });
  });

  if (resolvedCommit !== commit) {
    throw new Error(`${label} source commit mismatch: expected ${commit}, received ${resolvedCommit}`);
  }
}

await rm(publicTarget, { force: true, recursive: true });
await checkoutPinnedSource(SOURCE_REPOSITORY, SOURCE_COMMIT, workspace, "Dashboard");
await checkoutPinnedSource(KEDI_REPOSITORY, KEDI_COMMIT, kediWorkspace, "Kedi");

const moduleWorkspacePath = path.join(workspace, "src/components/ModuleWorkspace.tsx");
await writeFile(
  moduleWorkspacePath,
  gunzipSync(Buffer.from(MODULE_WORKSPACE_OVERRIDE_GZIP_BASE64, "base64")).toString("utf-8"),
  "utf-8",
);

const appPath = path.join(workspace, "src/App.tsx");
const appSource = await readFile(appPath, "utf-8");
const patchedApp = replaceRequired(
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
await writeFile(appPath, patchedApp, "utf-8");

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

let patchedCatWidget = replaceRequired(
  catWidgetSource,
  catLayoutSource,
  catLayoutTarget,
  "Kedi floor layout",
);
patchedCatWidget = replaceRequired(
  patchedCatWidget,
  "          const bubbleBottom = Math.floor(140 * (currentScale / 1.3));",
  "          const bubbleBottom = Math.max(72, Math.floor(140 * (currentScale / 1.3) - floorShift));",
  "Kedi speech bubble floor offset",
);
patchedCatWidget = replaceRequired(
  patchedCatWidget,
  "            if (leftEdge < 10) shift = 10 - leftEdge;\n            else if (rightEdge > window.innerWidth - 10) shift = (window.innerWidth - 10) - rightEdge;",
  "            if (leftEdge < sidePadding) shift = sidePadding - leftEdge;\n            else if (rightEdge > window.innerWidth - sidePadding) shift = (window.innerWidth - sidePadding) - rightEdge;",
  "Kedi speech bubble side margins",
);
patchedCatWidget = replaceRequired(
  patchedCatWidget,
  "          drawCat(ctx, halfSize, halfSize, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);",
  "          const walkFloorAdjustment = pose === 'WALK' ? Math.max(0, Math.sin(walkCycle) * 5) : 0;\n          const catCenterY = baseCatCenterY - walkFloorAdjustment * currentScale;\n          drawCat(ctx, halfSize, catCenterY, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);",
  "Kedi canvas floor baseline",
);

await writeFile(catWidgetPath, patchedCatWidget, "utf-8");

const dashboardKitSource = await readFile(
  path.join(kediWorkspace, "src/dashboard/DashboardKit.tsx"),
  "utf-8",
);
let patchedDashboardKit = replaceRequired(
  dashboardKitSource,
  "import CatWidget from '../components/CatWidget';",
  "import CatWidget from './KediCatWidget';",
  "Kedi dashboard integration import",
);
patchedDashboardKit = replaceRequired(
  patchedDashboardKit,
  '    <div className="h-full overflow-y-auto bg-[#f6f5f1] p-5 text-[#292723] sm:p-6">',
  '    <div className="h-full overflow-y-auto overscroll-contain bg-[#f6f5f1] p-5 text-[#292723] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-6">',
  "Kedi hidden scrollbar",
);

await writeFile(
  path.join(dashboardComponents, "KediDashboardKit.tsx"),
  patchedDashboardKit,
  "utf-8",
);

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
  JSON.stringify(
    {
      repository: SOURCE_REPOSITORY,
      commit: SOURCE_COMMIT,
      architecture: "item-specific-module-workspaces-v1",
      kedi: { repository: KEDI_REPOSITORY, commit: KEDI_COMMIT, integration: "native" },
    },
    null,
    2,
  ),
  "utf-8",
);

console.log(
  `Dashboard source ${SOURCE_COMMIT} built with item-specific module workspaces and native Kedi source ${KEDI_COMMIT}.`,
);
