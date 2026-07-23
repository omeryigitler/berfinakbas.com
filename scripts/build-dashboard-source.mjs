import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const SOURCE_REPOSITORY = 'https://github.com/omeryigitler/Dashboard.git';
const SOURCE_COMMIT = '6562cae4950c8e9e3e779f1e71bdef0c81a0ac98';
const KEDI_REPOSITORY = 'https://github.com/omeryigitler/kedi.git';
const KEDI_COMMIT = '739faa3f41ba31dff435d07dbfeaa642e49290be';
const workspace = path.resolve('.dashboard-source');
const kediWorkspace = path.resolve('.kedi-source');
const overrides = path.resolve('dashboard-overrides/src');
const publicTarget = path.resolve('public/yonetim-static');

function replaceRequired(source, search, replacement, label) {
  const patched = source.replace(search, replacement);
  if (patched === source) throw new Error(`${label} could not be applied.`);
  return patched;
}

function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`)));
  });
}

async function checkoutPinnedSource(repository, commit, target, label) {
  await rm(target, { force: true, recursive: true });
  await mkdir(target, { recursive: true });
  await run('git', ['init'], target);
  await run('git', ['remote', 'add', 'origin', repository], target);
  await run('git', ['fetch', '--depth', '1', 'origin', commit], target);
  await run('git', ['checkout', '--detach', 'FETCH_HEAD'], target);
  const resolvedCommit = await new Promise((resolve, reject) => {
    const child = spawn('git', ['rev-parse', 'HEAD'], { cwd: target });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`git rev-parse HEAD failed with exit code ${code}`)));
  });
  if (resolvedCommit !== commit) throw new Error(`${label} source commit mismatch: expected ${commit}, received ${resolvedCommit}`);
}

async function normalizeDashboardIdentity(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalizeDashboardIdentity(target);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|html)$/.test(entry.name)) continue;
    const source = await readFile(target, 'utf-8');
    const patched = source
      .replaceAll('Ömer Yiğitler', 'Berfin Akbaş')
      .replaceAll('Ömer YİĞİTLER', 'Berfin Akbaş')
      .replaceAll('ÖMER YİĞİTLER', 'Berfin Akbaş')
      .replaceAll('Dynamic 365', 'Berfin Akbaş')
      .replaceAll('Sales Hub', 'Yönetim Merkezi')
      .replaceAll('My Google AI Studio App', 'Berfin Akbaş Yönetim');
    if (patched !== source) await writeFile(target, patched, 'utf-8');
  }
}

await rm(publicTarget, { force: true, recursive: true });
await checkoutPinnedSource(SOURCE_REPOSITORY, SOURCE_COMMIT, workspace, 'Dashboard');
await checkoutPinnedSource(KEDI_REPOSITORY, KEDI_COMMIT, kediWorkspace, 'Kedi');
await cp(overrides, path.join(workspace, 'src'), { recursive: true, force: true });
await normalizeDashboardIdentity(path.join(workspace, 'src'));

const sidebarPath = path.join(workspace, 'src/components/Sidebar.tsx');
let sidebarSource = await readFile(sidebarPath, 'utf-8');
sidebarSource = sidebarSource.replace("  ArrowRightFromLine,\n  Grid\n} from 'lucide-react';", "  ArrowRightFromLine\n} from 'lucide-react';");
sidebarSource = replaceRequired(
  sidebarSource,
  `        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0">\n          <Grid className="w-5 h-5 text-gray-700" />\n        </div>`,
  `        <a href="/" aria-label="Berfin Akbaş ana sayfasına dön" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-black/10 bg-white/70 hover:bg-white transition-colors">\n          <img src="/logo-mark.png" alt="" className="w-[78%] h-[78%] object-contain" />\n        </a>`,
  'Dashboard sidebar logo',
);
await writeFile(sidebarPath, sidebarSource, 'utf-8');

const dashboardComponents = path.join(workspace, 'src/components');
const catWidgetPath = path.join(dashboardComponents, 'KediCatWidget.tsx');
await cp(path.join(kediWorkspace, 'src/components/CatWidget.tsx'), catWidgetPath);
const catWidgetSource = await readFile(catWidgetPath, 'utf-8');
const catLayoutSource = `      const currentScale = propsRef.current.scale;\n      const canvasSize = Math.max(120, Math.floor(180 * (currentScale / 1.3)));\n      const halfSize = canvasSize / 2;\n\n      if (containerRef.current) {\n        const constrainedX = Math.max(halfSize, Math.min(window.innerWidth - halfSize, s.x));`;
const catLayoutTarget = `      const currentScale = propsRef.current.scale;\n      const canvasSize = Math.max(120, Math.floor(180 * (currentScale / 1.3)));\n      const halfSize = canvasSize / 2;\n      const sidePadding = Math.max(24, Math.round(canvasSize * 0.14));\n      const baseCatCenterY = canvasSize - 1 - 37 * currentScale;\n      const floorShift = baseCatCenterY - halfSize;\n\n      if (containerRef.current) {\n        const minX = halfSize + sidePadding;\n        const maxX = Math.max(minX, window.innerWidth - halfSize - sidePadding);\n        const constrainedX = Math.max(minX, Math.min(maxX, s.x));`;
let patchedCatWidget = replaceRequired(catWidgetSource, catLayoutSource, catLayoutTarget, 'Kedi floor layout');
patchedCatWidget = replaceRequired(patchedCatWidget, '          const bubbleBottom = Math.floor(140 * (currentScale / 1.3));', '          const bubbleBottom = Math.max(72, Math.floor(140 * (currentScale / 1.3) - floorShift));', 'Kedi speech bubble floor offset');
patchedCatWidget = replaceRequired(patchedCatWidget, '            if (leftEdge < 10) shift = 10 - leftEdge;\n            else if (rightEdge > window.innerWidth - 10) shift = (window.innerWidth - 10) - rightEdge;', '            if (leftEdge < sidePadding) shift = sidePadding - leftEdge;\n            else if (rightEdge > window.innerWidth - sidePadding) shift = (window.innerWidth - sidePadding) - rightEdge;', 'Kedi speech bubble side margins');
patchedCatWidget = replaceRequired(patchedCatWidget, '          drawCat(ctx, halfSize, halfSize, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);', "          const walkFloorAdjustment = pose === 'WALK' ? Math.max(0, Math.sin(walkCycle) * 5) : 0;\n          const catCenterY = baseCatCenterY - walkFloorAdjustment * currentScale;\n          drawCat(ctx, halfSize, catCenterY, walkCycle, pose, elapsed, s.direction, currentScale, propsRef.current.isDarkMode, propsRef.current.colorTheme, propsRef.current.accessory, propsRef.current.catType);", 'Kedi canvas floor baseline');
await writeFile(catWidgetPath, patchedCatWidget, 'utf-8');

const dashboardKitSource = await readFile(path.join(kediWorkspace, 'src/dashboard/DashboardKit.tsx'), 'utf-8');
let patchedDashboardKit = replaceRequired(dashboardKitSource, "import CatWidget from '../components/CatWidget';", "import CatWidget from './KediCatWidget';", 'Kedi dashboard integration import');
patchedDashboardKit = replaceRequired(patchedDashboardKit, '    <div className="h-full overflow-y-auto bg-[#f6f5f1] p-5 text-[#292723] sm:p-6">', '    <div className="h-full overflow-y-auto overscroll-contain bg-[#f6f5f1] p-5 text-[#292723] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:p-6">', 'Kedi hidden scrollbar');
await writeFile(path.join(dashboardComponents, 'KediDashboardKit.tsx'), patchedDashboardKit, 'utf-8');

await run('npm', ['install', '--no-package-lock'], workspace);
await run('npm', ['run', 'build', '--', '--base=/yonetim/'], workspace);
let sourceIndex = await readFile(path.join(workspace, 'dist/index.html'), 'utf-8');
if (!sourceIndex.includes('/yonetim/assets/')) throw new Error('Dashboard build does not use the required /yonetim asset base.');
sourceIndex = sourceIndex.replace(/<title>.*?<\/title>/, '<title>Berfin Akbaş Yönetim</title>');
await writeFile(path.join(workspace, 'dist/index.html'), sourceIndex, 'utf-8');
await mkdir(publicTarget, { recursive: true });
await cp(path.join(workspace, 'dist'), publicTarget, { recursive: true });
await writeFile(path.join(publicTarget, 'source-manifest.json'), JSON.stringify({
  repository: SOURCE_REPOSITORY,
  commit: SOURCE_COMMIT,
  architecture: 'source-level-real-workspaces-v3',
  overrides: 'dashboard-overrides/src',
  kedi: { repository: KEDI_REPOSITORY, commit: KEDI_COMMIT, integration: 'native' },
}, null, 2), 'utf-8');
console.log(`Dashboard source ${SOURCE_COMMIT} built with unified real workspaces and native Kedi source ${KEDI_COMMIT}.`);
