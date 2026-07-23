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
patchedApp = replaceRequired(
  patchedApp,
  `  const handleToggleCat = () => {`,
  `  const handleOpenWorkspace = (menuItem: string, itemId: string) => {
    setActiveMenuItem(menuItem);
    setSelectedLeadId(itemId);
    setShowOrta(true);
    setShowSag(true);
  };

  const handleToggleCat = () => {`,
  "Dashboard summary navigation handler",
);
patchedApp = replaceRequired(
  patchedApp,
  `                  onDeleteClient={handleDeleteClient}
                />`,
  `                  onDeleteClient={handleDeleteClient}
                  onOpenWorkspace={handleOpenWorkspace}
                />`,
  "Dashboard summary navigation prop",
);
patchedApp = patchedApp.replaceAll("Ömer Yiğitler", "Berfin Akbaş").replaceAll("Ömer YİĞİTLER", "Berfin Akbaş").replaceAll("ÖMER YİĞİTLER", "Berfin Akbaş");
await writeFile(appPath, patchedApp, "utf-8");

const workspacePanelPath = path.join(workspace, "src/components/WorkspacePanel.tsx");
let workspacePanelSource = await readFile(workspacePanelPath, "utf-8");
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `  onUpdateClientDetails: (id: string, updatedClient: ClientDetails) => void;
  onDeleteClient: (id: string) => void;
}`,
  `  onUpdateClientDetails: (id: string, updatedClient: ClientDetails) => void;
  onDeleteClient: (id: string) => void;
  onOpenWorkspace?: (menuItem: string, itemId: string) => void;
}`,
  "Workspace summary navigation interface",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `  onUpdateClientDetails,
  onDeleteClient
}: WorkspacePanelProps) {`,
  `  onUpdateClientDetails,
  onDeleteClient,
  onOpenWorkspace
}: WorkspacePanelProps) {`,
  "Workspace summary navigation parameter",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `              <div className="px-3.5 py-1.5 rounded-full bg-black text-[#eafda8] text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eafda8] animate-ping" />
                CANLI VERİ AKIŞI
              </div>`,
  ``,
  "Remove fake live data badge",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `            {/* AI Recommendation Banner */}
            <div className="border border-dashed border-gray-300 rounded-[2rem] p-5 bg-white/30 flex items-center gap-4 mt-auto">
              <Sparkles className="w-8 h-8 text-[#a9df20] shrink-0 animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Yapay Zeka Önerisi</h3>
                <p className="text-[11px] text-gray-500 font-semibold mt-0.5 leading-relaxed">
                  Bugün seans doluluğunuz %80 seviyesinde. Finansal akışta bekleyen 4,500 TL'lik tahsilatı tamamlamak ve potansiyel olan 5 yeni adayı kazanmak için hızlı işlemlerden iletişime geçebilirsiniz.
                </p>
              </div>
            </div>`,
  ``,
  "Remove fake AI recommendation",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `        const todayAppointments = [
          { name: 'Gabriela Christiansen', time: '09:30', service: 'Diyet ve Beslenme', duration: '50 dk', type: 'Online', status: 'Tamamlandı', payment: 'Ödendi', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
          { name: 'Halle Griffiths', time: '11:15', service: 'Bireysel Yaşam Koçluğu', duration: '60 dk', type: 'Yüz Yüze', status: 'Tamamlandı', payment: 'Ödendi', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
          { name: 'Kemal Sayar', time: '14:00', service: 'Bireysel Psikoterapi', duration: '50 dk', type: 'Online', status: 'Sıradaki', payment: 'Bekleniyor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
          { name: 'Ayşe Yılmaz', time: '16:30', service: 'Kariyer Mentorluğu', duration: '45 dk', type: 'Yüz Yüze', status: 'Gelmedi', payment: 'Gecikmiş', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' }
        ];`,
  `        const todayAppointments = [
          { clientId: 'gabriela', name: 'Gabriela Christiansen', time: '09:30', service: 'Diyet ve Beslenme', duration: '50 dk', type: 'Online', status: 'Tamamlandı', payment: 'Ödendi', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
          { clientId: 'halle', name: 'Halle Griffiths', time: '11:15', service: 'Bireysel Yaşam Koçluğu', duration: '60 dk', type: 'Yüz Yüze', status: 'Tamamlandı', payment: 'Ödendi', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
          { clientId: 'kemal_sayar', name: 'Kemal Sayar', time: '14:00', service: 'Bireysel Psikoterapi', duration: '50 dk', type: 'Online', status: 'Sıradaki', payment: 'Bekleniyor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
          { clientId: 'ayse_yilmaz', name: 'Ayşe Yılmaz', time: '16:30', service: 'Kariyer Mentorluğu', duration: '45 dk', type: 'Yüz Yüze', status: 'Gelmedi', payment: 'Gecikmiş', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' }
        ];`,
  "Link summary appointments to clients",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `                      onClick={() => alert(\`${'${app.name}'} için Randevu Kartı Detayları Açılıyor...\`)}`,
  `                      onClick={() => onOpenWorkspace?.('randevular', 'liste')}`,
  "Open appointment workspace from summary",
);
workspacePanelSource = replaceRequired(
  workspacePanelSource,
  `                      onClick={() => alert(\`${'${app.name}'} için Danışan Profili Yükleniyor...\`)}`,
  `                      onClick={() => onOpenWorkspace?.('danisanlar', app.clientId)}`,
  "Open client workspace from summary",
);
workspacePanelSource = workspacePanelSource.replaceAll("Ömer Yiğitler", "Berfin Akbaş").replaceAll("Ömer YİĞİTLER", "Berfin Akbaş").replaceAll("ÖMER YİĞİTLER", "Berfin Akbaş");
await writeFile(workspacePanelPath, workspacePanelSource, "utf-8");

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
