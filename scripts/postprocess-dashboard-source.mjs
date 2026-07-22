import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve("public/yonetim-static");
const assetsRoot = path.join(outputRoot, "assets");

const identityReplacements = [
  ["Ömer Yiğitler", "Berfin Akbaş"],
  ["Ömer YİĞİTLER", "Berfin Akbaş"],
  ["ÖMER YİĞİTLER", "Berfin Akbaş"],
  ["ÖY", "BA"],
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolutePath));
    else files.push(absolutePath);
  }

  return files;
}

for (const filePath of await listFiles(assetsRoot)) {
  if (!filePath.endsWith(".js")) continue;

  const source = await readFile(filePath, "utf-8");
  let patched = source;

  for (const [search, replacement] of identityReplacements) {
    patched = patched.split(search).join(replacement);
  }

  if (patched !== source) await writeFile(filePath, patched, "utf-8");
}

const runtimePatch = String.raw`
(() => {
  const rules = {
    "Randevular": [
      ["Liste Görünümü", "Randevu Listesi", "Tüm randevuları tek listede yönetin."],
      ["Takvim Görünümü", "Takvim", "Randevuları takvim üzerinde görüntüleyin."],
    ],
    "Takvim ve Uygunluk": [
      ["Takvim", "Takvim", "Randevuları ve uygun saatleri görüntüleyin."],
      ["Haftalık Çalışma Saatleri", "Çalışma Saatleri", "Haftalık çalışma düzenini yönetin."],
      ["Tarihe Özel Saatler", "Özel Saatler", "Belirli tarihler için farklı saatler tanımlayın."],
      ["Kapalı Zamanlar", "Kapalı Zamanlar", "İzin ve kapalı zaman bloklarını yönetin."],
      ["Randevu Kuralları", "Randevu Kuralları", "Süre, tampon ve rezervasyon kurallarını belirleyin."],
      ["İlk Görüşme Ayarları", "İlk Görüşme", "İlk görüşme süresi ve ücretini yönetin."],
      ["İptal ve Değişiklik Kuralları", "İptal ve Değişiklik", "İptal ve yeniden planlama kurallarını yönetin."],
      ["Takvim Entegrasyonları", "Entegrasyonlar", "Google Takvim ve senkronizasyonu yönetin."],
    ],
    "Talepler ve İletişim": [
      ["Tüm Talepler", "Talepler", "Başvuruları tek listede görüntüleyin ve yönetin."],
      ["Mesaj Şablonları", "Mesaj Şablonları", "Hazır iletişim metinlerini yönetin."],
      ["Gönderim Geçmişi", "Gönderim Geçmişi", "Gönderilen mesaj ve e-postaları inceleyin."],
      ["İletişim İzinleri", "İletişim İzinleri", "İletişim ve pazarlama izinlerini yönetin."],
    ],
    "Hizmetler": [
      ["Tüm Hizmetler", "Hizmet Listesi", "Tüm hizmetleri tek listede yönetin."],
    ],
    "Ödeme ve Planlar": [
      ["Finans Özeti", "Finans Özeti", "Tahsilat, alacak ve finans durumunu izleyin."],
      ["Tüm Planlar", "Planlar", "Danışan planlarını görüntüleyin ve yönetin."],
      ["Tüm Ödemeler", "Ödemeler", "Ödeme kayıtlarını görüntüleyin ve yönetin."],
    ],
    "PDF ve Kaynaklar": [
      ["Tüm PDF’ler", "PDF ve Kaynaklar", "Yayınlanan ve taslak dosyaları yönetin."],
      ["PDF Talep Kayıtları", "Talep Kayıtları", "PDF talep ve gönderim kayıtlarını inceleyin."],
      ["Gönderim Ayarları", "Gönderim Ayarları", "E-posta gönderim ayarlarını yönetin."],
    ],
    "Raporlar": [
      ["Finans Raporları", "Finans", "Gelir, ödeme ve alacak raporlarını inceleyin."],
      ["Randevu Raporları", "Randevular", "Randevu performansını inceleyin."],
      ["Danışan Raporları", "Danışanlar", "Danışan dağılımı ve devam oranlarını inceleyin."],
      ["Plan Raporları", "Planlar", "Plan kullanım ve satış verilerini inceleyin."],
      ["Talep ve Dönüşüm Raporları", "Talep ve Dönüşüm", "Talep kaynakları ve dönüşüm oranlarını inceleyin."],
      ["Kayıtlı Raporlar", "Kayıtlı Raporlar", "Kaydedilmiş raporları açın."],
      ["Dışa Aktarımlar", "Dışa Aktarımlar", "Hazırlanan dışa aktarma dosyalarını inceleyin."],
    ],
    "Kullanıcılar ve Yetkiler": [
      ["Tüm Kullanıcılar", "Kullanıcılar", "Berfin Akbaş ve yetkili hesapları yönetin."],
      ["Kullanıcı Davetleri", "Davetler", "Yeni kullanıcı davetlerini yönetin."],
      ["Roller", "Roller", "Sistem rollerini yönetin."],
      ["Yetki Grupları", "Yetki Grupları", "Erişim yetkilerini yönetin."],
      ["Yönetici E-posta İzinleri", "Yönetici E-posta İzinleri", "Yönetim paneline erişebilecek adresleri yönetin."],
      ["Giriş Geçmişi", "Giriş Geçmişi", "Hesap erişim geçmişini inceleyin."],
    ],
    "Ayarlar": [
      ["İşletme Bilgileri", "İşletme", "Berfin Akbaş işletme ve iletişim bilgilerini yönetin."],
      ["Danışan Ayarları", "Danışanlar", "Danışan kayıt kurallarını yönetin."],
      ["Randevu Ayarları", "Randevular", "Varsayılan randevu ayarlarını yönetin."],
      ["Finans Ayarları", "Finans", "Para birimi ve ödeme kurallarını yönetin."],
      ["Bildirim Ayarları", "Bildirimler", "Sistem bildirimlerini yönetin."],
      ["E-posta Şablonları", "E-posta Şablonları", "Otomatik e-posta içeriklerini yönetin."],
      ["Entegrasyonlar", "Entegrasyonlar", "Bağlı servisleri yönetin."],
      ["KVKK ve Veri", "KVKK ve Veri", "Veri saklama ve izin ayarlarını yönetin."],
      ["Görünüm Ayarları", "Görünüm", "Yönetim paneli görünümünü yönetin."],
    ],
    "Arşiv": [
      ["Arşivlenen Danışanlar", "Arşivlenen Kayıtlar", "Arşivlenen kayıtları tek alanda inceleyin."],
      ["Çöp Kutusu", "Çöp Kutusu", "Silinen kayıtları inceleyin ve geri yükleyin."],
      ["İşlem Geçmişi", "İşlem Geçmişi", "Sistem değişiklik geçmişini inceleyin."],
    ],
  };

  const exactTextReplacements = new Map([
    ["Ömer Yiğitler", "Berfin Akbaş"],
    ["Ömer YİĞİTLER", "Berfin Akbaş"],
    ["ÖMER YİĞİTLER", "Berfin Akbaş"],
    ["ÖY", "BA"],
  ]);

  const getTextParts = (button) => {
    const textContainer = Array.from(button.querySelectorAll("div")).find((element) =>
      element.className.includes("min-w-0") && element.className.includes("flex-1")
    );
    const spans = textContainer ? Array.from(textContainer.querySelectorAll("span")) : [];
    return { label: spans[0], description: spans[1] };
  };

  const isActive = (button) =>
    button.className.includes("from-[#eafda8]") ||
    button.className.includes("bg-gradient-to-br") ||
    button.getAttribute("aria-current") === "page";

  const normalizeIdentity = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const textNode of textNodes) {
      const original = textNode.nodeValue || "";
      const trimmed = original.trim();
      const replacement = exactTextReplacements.get(trimmed);
      if (!replacement) continue;
      textNode.nodeValue = original.replace(trimmed, replacement);
    }

    const profile = Array.from(document.querySelectorAll("#main-app-header *")).find(
      (element) => element.childElementCount === 0 && element.textContent?.trim() === "BA"
    );
    if (profile) {
      profile.setAttribute("title", "Berfin Akbaş · Terapist ve Site Sahibi");
      profile.setAttribute("aria-label", "Berfin Akbaş · Terapist ve Site Sahibi");
    }

    const berfinLabels = Array.from(document.querySelectorAll("#module-workspace *")).filter(
      (element) => element.childElementCount === 0 && element.textContent?.trim() === "Berfin Akbaş"
    );

    for (const label of berfinLabels) {
      let container = label.parentElement;
      for (let depth = 0; container && depth < 5; depth += 1, container = container.parentElement) {
        if ((container.textContent || "").length > 700) continue;
        const role = Array.from(container.querySelectorAll("span, p, div")).find((element) => {
          if (element.childElementCount > 0) return false;
          const value = element.textContent?.trim();
          return value === "Yönetici" || value === "Sahip" || value === "Terapist";
        });
        if (role) {
          role.textContent = "Terapist ve Site Sahibi";
          break;
        }
      }
    }
  };

  const compactNavigation = () => {
    const panel = document.querySelector("#module-nav-panel");
    if (!panel) return;

    const moduleTitle = panel.querySelector("h2")?.textContent?.trim();
    const moduleRules = moduleTitle ? rules[moduleTitle] : null;
    if (!moduleRules) return;

    const headerAction = panel.querySelector(":scope > div:first-child button");
    if (headerAction) headerAction.style.display = "none";

    const searchInput = panel.querySelector("input");
    let searchBlock = searchInput;
    while (searchBlock && searchBlock.parentElement !== panel) searchBlock = searchBlock.parentElement;
    if (searchBlock) searchBlock.style.display = "none";

    const scrollArea = Array.from(panel.children).find((element) =>
      element.className.includes("overflow-y-auto")
    );
    if (!scrollArea) return;

    const originalSections = Array.from(scrollArea.querySelectorAll(":scope > section:not([data-compact-nav])"));
    const originalButtons = originalSections.flatMap((section) => Array.from(section.querySelectorAll("button")));

    const allowed = moduleRules.map(([source, label, description]) => {
      const original = originalButtons.find((button) => getTextParts(button).label?.textContent?.trim() === source);
      return original ? { source, label, description, original } : null;
    }).filter(Boolean);

    if (!allowed.length) return;

    originalSections.forEach((section) => { section.style.display = "none"; });

    const activeAllowed = allowed.find(({ original }) => isActive(original));
    if (!activeAllowed) {
      allowed[0].original.click();
      return;
    }

    const signature = JSON.stringify({
      moduleTitle,
      active: activeAllowed.source,
      items: allowed.map(({ source, label }) => [source, label]),
    });

    let compactSection = scrollArea.querySelector(":scope > section[data-compact-nav]");
    if (compactSection?.dataset.signature === signature) return;
    compactSection?.remove();

    compactSection = document.createElement("section");
    compactSection.dataset.compactNav = "true";
    compactSection.dataset.signature = signature;
    compactSection.className = "space-y-2";

    const heading = document.createElement("div");
    heading.className = "flex items-center justify-between px-1";
    heading.innerHTML = '<span class="text-[9px] text-gray-400 font-black tracking-[0.16em] uppercase">Bölümler</span>' +
      '<span class="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">' + allowed.length + '</span>';

    const list = document.createElement("div");
    list.className = "space-y-2";

    for (const { label, description, original } of allowed) {
      const compactButton = original.cloneNode(true);
      compactButton.removeAttribute("key");
      const parts = getTextParts(compactButton);
      if (parts.label) parts.label.textContent = label;
      if (parts.description) parts.description.textContent = description;
      compactButton.addEventListener("click", () => original.click());
      list.appendChild(compactButton);
    }

    compactSection.append(heading, list);
    scrollArea.prepend(compactSection);
  };

  let scheduled = false;
  const apply = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      normalizeIdentity();
      compactNavigation();
    });
  };

  new MutationObserver(apply).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "aria-current"],
  });

  apply();
})();
`;

const indexPath = path.join(outputRoot, "index.html");
const indexSource = await readFile(indexPath, "utf-8");
const marker = "data-dashboard-compact-navigation";

if (!indexSource.includes(marker)) {
  const injection = `<script ${marker}>${runtimePatch}</script>`;
  const patchedIndex = indexSource.includes("</body>")
    ? indexSource.replace("</body>", `${injection}</body>`)
    : `${indexSource}${injection}`;
  await writeFile(indexPath, patchedIndex, "utf-8");
}

console.log("Dashboard navigation compacted and owner identity normalized to Berfin Akbaş.");
