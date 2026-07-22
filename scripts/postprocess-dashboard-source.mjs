import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("public/yonetim-static");
const assets = path.join(root, "assets");
const identities = [["Ömer Yiğitler", "Berfin Akbaş"], ["Ömer YİĞİTLER", "Berfin Akbaş"], ["ÖMER YİĞİTLER", "Berfin Akbaş"], ["ÖY", "BA"]];

async function files(dir) {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...await files(file));
    else out.push(file);
  }
  return out;
}

for (const file of await files(assets)) {
  if (!file.endsWith(".js")) continue;
  const source = await readFile(file, "utf-8");
  let next = source;
  for (const [from, to] of identities) next = next.split(from).join(to);
  if (next !== source) await writeFile(file, next, "utf-8");
}

const runtime = String.raw`
(() => {
  const R = {
    "Randevular": [["Liste Görünümü","Randevu Listesi","Tüm randevuları tek listede yönetin."],["Takvim Görünümü","Takvim","Randevuları takvim üzerinde görüntüleyin."]],
    "Takvim ve Uygunluk": [["Takvim","Takvim","Randevuları ve uygun saatleri görüntüleyin."],["Haftalık Çalışma Saatleri","Çalışma Saatleri","Haftalık çalışma düzenini yönetin."],["Tarihe Özel Saatler","Özel Saatler","Belirli tarihler için farklı saatler tanımlayın."],["Kapalı Zamanlar","Kapalı Zamanlar","İzin ve kapalı zaman bloklarını yönetin."],["Randevu Kuralları","Randevu Kuralları","Süre, tampon ve rezervasyon kurallarını belirleyin."],["İlk Görüşme Ayarları","İlk Görüşme","İlk görüşme süresi ve ücretini yönetin."],["İptal ve Değişiklik Kuralları","İptal ve Değişiklik","İptal ve yeniden planlama kurallarını yönetin."],["Takvim Entegrasyonları","Entegrasyonlar","Google Takvim ve senkronizasyonu yönetin."]],
    "Talepler ve İletişim": [["Tüm Talepler","Talepler","Başvuruları tek listede görüntüleyin ve yönetin."],["Mesaj Şablonları","Mesaj Şablonları","Hazır iletişim metinlerini yönetin."],["Gönderim Geçmişi","Gönderim Geçmişi","Gönderilen mesaj ve e-postaları inceleyin."],["İletişim İzinleri","İletişim İzinleri","İletişim ve pazarlama izinlerini yönetin."]],
    "Hizmetler": [["Tüm Hizmetler","Hizmet Listesi","Tüm hizmetleri tek listede yönetin."]],
    "Ödeme ve Planlar": [["Finans Özeti","Finans Özeti","Tahsilat, alacak ve finans durumunu izleyin."],["Tüm Planlar","Planlar","Danışan planlarını görüntüleyin ve yönetin."],["Tüm Ödemeler","Ödemeler","Ödeme kayıtlarını görüntüleyin ve yönetin."]],
    "PDF ve Kaynaklar": [["Tüm PDF’ler","PDF ve Kaynaklar","Yayınlanan ve taslak dosyaları yönetin."],["PDF Talep Kayıtları","Talep Kayıtları","PDF talep ve gönderim kayıtlarını inceleyin."],["Gönderim Ayarları","Gönderim Ayarları","E-posta gönderim ayarlarını yönetin."]],
    "Raporlar": [["Finans Raporları","Finans","Gelir, ödeme ve alacak raporlarını inceleyin."],["Randevu Raporları","Randevular","Randevu performansını inceleyin."],["Danışan Raporları","Danışanlar","Danışan dağılımı ve devam oranlarını inceleyin."],["Plan Raporları","Planlar","Plan kullanım ve satış verilerini inceleyin."],["Talep ve Dönüşüm Raporları","Talep ve Dönüşüm","Talep kaynakları ve dönüşüm oranlarını inceleyin."],["Kayıtlı Raporlar","Kayıtlı Raporlar","Kaydedilmiş raporları açın."],["Dışa Aktarımlar","Dışa Aktarımlar","Hazırlanan dışa aktarma dosyalarını inceleyin."]],
    "Kullanıcılar ve Yetkiler": [["Tüm Kullanıcılar","Kullanıcılar","Berfin Akbaş ve yetkili hesapları yönetin."],["Kullanıcı Davetleri","Davetler","Yeni kullanıcı davetlerini yönetin."],["Roller","Roller","Sistem rollerini yönetin."],["Yetki Grupları","Yetki Grupları","Erişim yetkilerini yönetin."],["Yönetici E-posta İzinleri","Yönetici E-posta İzinleri","Yönetim paneline erişebilecek adresleri yönetin."],["Giriş Geçmişi","Giriş Geçmişi","Hesap erişim geçmişini inceleyin."]],
    "Ayarlar": [["İşletme Bilgileri","İşletme","Berfin Akbaş işletme ve iletişim bilgilerini yönetin."],["Danışan Ayarları","Danışanlar","Danışan kayıt kurallarını yönetin."],["Randevu Ayarları","Randevular","Varsayılan randevu ayarlarını yönetin."],["Finans Ayarları","Finans","Para birimi ve ödeme kurallarını yönetin."],["Bildirim Ayarları","Bildirimler","Sistem bildirimlerini yönetin."],["E-posta Şablonları","E-posta Şablonları","Otomatik e-posta içeriklerini yönetin."],["Entegrasyonlar","Entegrasyonlar","Bağlı servisleri yönetin."],["KVKK ve Veri","KVKK ve Veri","Veri saklama ve izin ayarlarını yönetin."],["Görünüm Ayarları","Görünüm","Yönetim paneli görünümünü yönetin."]],
    "Arşiv": [["Arşivlenen Danışanlar","Arşivlenen Kayıtlar","Arşivlenen kayıtları tek alanda inceleyin."],["Çöp Kutusu","Çöp Kutusu","Silinen kayıtları inceleyin ve geri yükleyin."],["İşlem Geçmişi","İşlem Geçmişi","Sistem değişiklik geçmişini inceleyin."]]
  };

  const t = (e) => (e?.textContent || "").replace(/\s+/g, " ").trim();
  const nav = () => document.querySelector("#module-nav-panel");
  const ws = () => document.querySelector("#module-workspace");
  const moduleTitle = () => t(nav()?.querySelector("h2"));
  const workspaceTitle = () => t(ws()?.querySelector("h1"));
  const parts = (b) => {
    const box = Array.from(b.querySelectorAll("div")).find((e) => e.className.includes("min-w-0") && e.className.includes("flex-1"));
    const spans = box ? Array.from(box.querySelectorAll("span")) : [];
    return { label: spans[0], description: spans[1] };
  };
  const originalButtons = () => Array.from(nav()?.querySelectorAll("section:not([data-compact-nav]) button") || []);
  const original = (labels) => {
    const set = new Set(Array.isArray(labels) ? labels : [labels]);
    return originalButtons().find((b) => set.has(parts(b).label?.textContent?.trim()));
  };
  const clickOriginal = (labels) => { const b = original(labels); if (!b) return false; b.click(); return true; };
  const active = (b) => b.className.includes("from-[#eafda8]") || b.className.includes("bg-gradient-to-br") || b.getAttribute("aria-current") === "page";
  const searchBlock = (panel) => {
    let e = panel?.querySelector("input");
    while (e && e.parentElement !== panel) e = e.parentElement;
    return e;
  };

  const compactNav = () => {
    const panel = nav();
    if (!panel) return;
    const scroll = Array.from(panel.children).find((e) => e.className.includes("overflow-y-auto"));
    if (!scroll) return;
    const rules = R[t(panel.querySelector("h2"))];
    const compact = scroll.querySelector(":scope > section[data-compact-nav]");
    const sections = Array.from(scroll.querySelectorAll(":scope > section:not([data-compact-nav])"));
    const headButton = panel.querySelector(":scope > div:first-child button");
    const search = searchBlock(panel);

    if (!rules) {
      compact?.remove();
      sections.forEach((s) => { s.style.display = ""; });
      if (headButton) headButton.style.display = "";
      if (search) search.style.display = "";
      return;
    }

    const buttons = sections.flatMap((s) => Array.from(s.querySelectorAll("button")));
    const allowed = rules.map(([source,label,description]) => {
      const button = buttons.find((b) => parts(b).label?.textContent?.trim() === source);
      return button ? { source,label,description,button } : null;
    }).filter(Boolean);
    if (!allowed.length) return;
    const selected = allowed.find(({button}) => active(button));
    if (!selected) { allowed[0].button.click(); return; }
    const signature = JSON.stringify([t(panel.querySelector("h2")), selected.source]);

    sections.forEach((s) => { s.style.display = "none"; });
    if (headButton) headButton.style.display = "none";
    if (search) search.style.display = "none";
    if (compact?.dataset.signature === signature) return;
    compact?.remove();

    const section = document.createElement("section");
    section.dataset.compactNav = "true";
    section.dataset.signature = signature;
    section.className = "space-y-2";
    section.innerHTML = '<div class="flex items-center justify-between px-1"><span class="text-[9px] text-gray-400 font-black tracking-[0.16em] uppercase">Bölümler</span><span class="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">' + allowed.length + '</span></div>';
    const list = document.createElement("div");
    list.className = "space-y-2";
    allowed.forEach(({label,description,button}) => {
      const clone = button.cloneNode(true);
      const p = parts(clone);
      if (p.label) p.label.textContent = label;
      if (p.description) p.description.textContent = description;
      clone.addEventListener("click", () => button.click());
      list.appendChild(clone);
    });
    section.appendChild(list);
    scroll.prepend(section);
  };

  const bind = (button, key, fn) => {
    if (!button) return;
    button.__runtimeFn = fn;
    button.dataset.runtimeKey = key;
    if (button.dataset.runtimeBound) return;
    button.dataset.runtimeBound = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      button.__runtimeFn?.();
    }, true);
  };
  const notice = (message, error = false) => {
    document.querySelector("[data-runtime-notice]")?.remove();
    const e = document.createElement("div");
    e.dataset.runtimeNotice = "1";
    e.textContent = message;
    e.className = "fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full px-4 py-2 text-[10px] font-black shadow-xl " + (error ? "bg-[#9f3f35] text-white" : "bg-black text-[#eafda8]");
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 2200);
  };
  const rename = (button, text) => {
    if (!button) return;
    const nodes = []; const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (walker.currentNode.nodeValue?.trim()) nodes.push(walker.currentNode);
    if (nodes.length) nodes.at(-1).nodeValue = text;
  };

  const rows = () => {
    const workspace = ws();
    if (!workspace) return [];
    const statuses = ["Yayında","Taslak","Arşivde","Gönderildi","Bekliyor","Hata"];
    const badges = Array.from(workspace.querySelectorAll("span,div")).filter((e) => e.childElementCount === 0 && statuses.includes(t(e)));
    const found = [];
    badges.forEach((badge) => {
      let row = badge.parentElement;
      while (row && row !== workspace) {
        const value = t(row);
        if (value.length < 420 && (value.includes("PDF-") || value.includes("@") || value.includes("Talep"))) break;
        row = row.parentElement;
      }
      if (row && row !== workspace && !found.includes(row)) found.push(row);
    });
    const counts = new Map(); found.forEach((r) => counts.set(r.parentElement, (counts.get(r.parentElement) || 0) + 1));
    const parent = Array.from(counts.entries()).sort((a,b) => b[1]-a[1])[0]?.[0];
    return parent ? found.filter((r) => r.parentElement === parent) : found;
  };

  const tools = () => {
    const workspace = ws();
    if (!workspace) return null;
    let box = workspace.querySelector("[data-pdf-tools]");
    if (box) return box;
    const listTitle = Array.from(workspace.querySelectorAll("h2,h3,span")).find((e) => e.childElementCount === 0 && ["Kayıt Listesi","PDF Listesi","Talep Listesi"].includes(t(e)));
    if (!listTitle) return null;
    let card = listTitle.parentElement;
    while (card && card !== workspace && !t(card).includes("PDF-") && !t(card).includes("Talep")) card = card.parentElement;
    if (!card || card === workspace) return null;
    const request = workspaceTitle().includes("Talep");
    const statuses = request ? ["Gönderildi","Bekliyor","Hata"] : ["Yayında","Taslak","Arşivde"];
    box = document.createElement("div");
    box.dataset.pdfTools = "1";
    box.className = "hidden rounded-[1.4rem] border border-black/[0.07] bg-white/85 p-3 shadow-sm flex-wrap items-center gap-2";
    box.innerHTML = '<input data-pdf-search type="search" placeholder="PDF veya kayıt ara..." class="min-w-[240px] flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold outline-none focus:border-black/25" /><button data-status="all" class="rounded-full bg-black px-3 py-2 text-[9px] font-black text-[#eafda8]">Tümü</button>' + statuses.map((s) => '<button data-status="' + s + '" class="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black text-gray-700">' + s + '</button>').join("");
    card.parentElement?.insertBefore(box, card);
    const apply = () => {
      const q = (box.querySelector("input")?.value || "").trim().toLocaleLowerCase("tr-TR");
      const status = box.dataset.status || "all";
      rows().forEach((row) => {
        const value = t(row).toLocaleLowerCase("tr-TR");
        row.style.display = (!q || value.includes(q)) && (status === "all" || value.includes(status.toLocaleLowerCase("tr-TR"))) ? "" : "none";
      });
    };
    box.querySelector("input")?.addEventListener("input", apply);
    box.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
      box.dataset.status = button.dataset.status || "all";
      box.querySelectorAll("[data-status]").forEach((b) => { b.className = b === button ? "rounded-full bg-black px-3 py-2 text-[9px] font-black text-[#eafda8]" : "rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black text-gray-700"; });
      apply();
    }));
    return box;
  };
  const toggleTools = () => {
    const box = tools();
    if (!box) return notice("Bu görünümde filtrelenecek liste bulunmuyor.", true);
    const open = box.classList.contains("hidden");
    box.classList.toggle("hidden", !open); box.classList.toggle("flex", open);
    if (open) box.querySelector("input")?.focus();
  };
  const sortRows = () => {
    const list = rows(); if (list.length < 2) return notice("Sıralanacak kayıt bulunmuyor.", true);
    const mode = ws().dataset.sortMode === "asc" ? "desc" : "asc"; ws().dataset.sortMode = mode;
    list.sort((a,b) => t(a).localeCompare(t(b), "tr", { numeric: true }) * (mode === "asc" ? 1 : -1));
    list.forEach((row) => row.parentElement?.appendChild(row)); notice(mode === "asc" ? "Kayıtlar A–Z sıralandı." : "Kayıtlar Z–A sıralandı.");
  };
  const exportRows = () => {
    const list = rows().filter((r) => r.style.display !== "none"); if (!list.length) return notice("Dışa aktarılacak kayıt bulunmuyor.", true);
    const esc = (v) => '"' + String(v).replaceAll('"','""') + '"';
    const blob = new Blob(["\ufeff", ["Kayıt", ...list.map((r) => esc(t(r)))].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (workspaceTitle().includes("Talep") ? "pdf-talep-kayitlari-" : "pdf-kayitlari-") + new Date().toISOString().slice(0,10) + ".csv"; a.click(); URL.revokeObjectURL(a.href); notice("CSV dosyası hazırlandı.");
  };

  const pdfActions = () => {
    if (moduleTitle() !== "PDF ve Kaynaklar") return;
    const workspace = ws(); if (!workspace) return;
    const title = workspaceTitle();
    const buttons = Array.from(workspace.querySelectorAll("button"));
    const by = (label) => buttons.find((b) => t(b) === label);
    const add = by("Yeni kayıt") || by("Yeni PDF"); const filter = by("Filtrele"); const sort = by("Sırala"); const exp = by("Dışa aktar");
    const library = title === "Tüm PDF’ler" || title === "PDF ve Kaynaklar";
    const list = library || title.includes("Talep");
    if (library) { rename(add, "Yeni PDF"); if (add) add.style.display = ""; bind(add,"pdf-new",() => clickOriginal("Yeni PDF") || notice("Yeni PDF ekranı bulunamadı.", true)); }
    else if (add) add.style.display = "none";
    [filter,sort,exp].forEach((b) => { if (b) b.style.display = list ? "" : "none"; });
    if (list) { bind(filter,"pdf-filter",toggleTools); bind(sort,"pdf-sort",sortRows); bind(exp,"pdf-export",exportRows); }
    buttons.forEach((b) => {
      if (b.querySelector("svg.lucide-search")) { if (list) bind(b,"pdf-search",toggleTools); else b.style.display = "none"; }
      if (b.querySelector("svg.lucide-settings-2")) b.style.display = "none";
    });
  };

  const calendarActions = () => {
    if (!["Randevular","Takvim ve Uygunluk"].includes(moduleTitle())) return;
    const buttons = Array.from(ws()?.querySelectorAll("button") || []);
    const add = buttons.find((b) => t(b) === "Yeni randevu");
    bind(add,"new-appointment",() => clickOriginal("Yeni Randevu") || notice("Yeni randevu ekranı bulunamadı.", true));
    ["Bugüne dön","Görünüm","Senkronize et"].forEach((label) => { const b = buttons.find((x) => t(x) === label); if (b) b.style.display = "none"; });
  };

  const headerActions = () => {
    const header = document.querySelector("#main-app-header"); if (!header) return;
    const buttons = Array.from(header.querySelectorAll("button"));
    ["Son işlemler","Öngörüler","Yardım","Destek"].forEach((title) => { const b = buttons.find((x) => x.title === title); if (b) b.style.display = "none"; });
    const map = { "Randevular":["Yeni Randevu"], "Takvim ve Uygunluk":["Yeni Randevu"], "Talepler ve İletişim":["Manuel Kayıt","Yeni Talep"], "Hizmetler":["Yeni Hizmet"], "Ödeme ve Planlar":["Yeni Plan"], "PDF ve Kaynaklar":["Yeni PDF"], "Kullanıcılar ve Yetkiler":["Kullanıcı Davetleri"] };
    const plus = buttons.find((b) => b.title === "Hızlı oluştur"); const labels = map[moduleTitle()];
    if (plus && labels && original(labels)) { plus.style.display = ""; bind(plus,"header-add-" + moduleTitle(),() => clickOriginal(labels)); } else if (plus) plus.style.display = "none";
    const filter = buttons.find((b) => b.title === "Filtreler");
    if (filter && moduleTitle() === "PDF ve Kaynaklar" && workspaceTitle().includes("PDF")) { filter.style.display = ""; bind(filter,"header-pdf-filter",toggleTools); } else if (filter) filter.style.display = "none";
    const search = buttons.find((b) => b.title === "Ara");
    const input = Array.from(document.querySelectorAll("#module-workspace input,#contact-social-workspace input")).find((e) => e.getClientRects().length && getComputedStyle(e).display !== "none");
    if (search && input) { search.style.display = ""; bind(search,"header-focus-" + moduleTitle(),() => input.focus()); }
    else if (search && moduleTitle() === "PDF ve Kaynaklar" && workspaceTitle().includes("PDF")) { search.style.display = ""; bind(search,"header-pdf-search",toggleTools); }
    else if (search) search.style.display = "none";
  };

  const identity = () => {
    const profile = Array.from(document.querySelectorAll("#main-app-header *")).find((e) => e.childElementCount === 0 && t(e) === "BA");
    if (profile) { profile.title = "Berfin Akbaş · Terapist ve Site Sahibi"; profile.setAttribute("aria-label", profile.title); }
  };

  let queued = false;
  const apply = () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; identity(); compactNav(); pdfActions(); calendarActions(); headerActions(); });
  };
  new MutationObserver(apply).observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["class","aria-current"] });
  apply();
})();
`;

const index = path.join(root, "index.html");
const html = await readFile(index, "utf-8");
const marker = "data-dashboard-runtime-enhancements";
if (!html.includes(marker)) {
  const script = `<script ${marker}>${runtime}</script>`;
  await writeFile(index, html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`, "utf-8");
}

console.log("Dashboard navigation, PDF actions and identity post-processing completed.");
