import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("public/yonetim-static");
const assets = path.join(root, "assets");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(file));
    else out.push(file);
  }
  return out;
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

const runtime = String.raw`
(() => {
  const CONTACT_CACHE = "berfin-site-contact-cache-v3";
  const realFetch = window.fetch.bind(window);
  const cacheContact = async (response) => {
    if (!response?.ok) return;
    try {
      const value = await response.clone().text();
      JSON.parse(value);
      localStorage.setItem(CONTACT_CACHE, value);
    } catch {}
  };
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : request?.url || "";
    const method = String(init?.method || request?.method || "GET").toUpperCase();
    if (url.includes("/api/site-contact") && method === "GET") {
      const cached = localStorage.getItem(CONTACT_CACHE);
      if (cached) {
        realFetch(input, init).then(cacheContact).catch(() => {});
        return new Response(cached, { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }
    const response = await realFetch(input, init);
    if (url.includes("/api/site-contact") && response.ok) cacheContact(response);
    return response;
  };
  realFetch("/api/site-contact", { cache: "no-store", credentials: "include" }).then(cacheContact).catch(() => {});

  const NAV = {
    "Randevular": [["Liste Görünümü","Randevu Listesi"],["Takvim Görünümü","Takvim"]],
    "Takvim ve Uygunluk": [["Takvim","Takvim"],["Haftalık Çalışma Saatleri","Çalışma Saatleri"],["Tarihe Özel Saatler","Özel Saatler"],["Kapalı Zamanlar","Kapalı Zamanlar"],["Randevu Kuralları","Randevu Kuralları"],["İlk Görüşme Ayarları","İlk Görüşme"],["İptal ve Değişiklik Kuralları","İptal ve Değişiklik"],["Takvim Entegrasyonları","Entegrasyonlar"]],
    "Talepler ve İletişim": [["Tüm Talepler","Talepler"],["Mesaj Şablonları","Mesaj Şablonları"],["Gönderim Geçmişi","Gönderim Geçmişi"],["İletişim İzinleri","İletişim İzinleri"]],
    "Hizmetler": [["Tüm Hizmetler","Hizmet Listesi"]],
    "Ödeme ve Planlar": [["Finans Özeti","Finans Özeti"],["Tüm Planlar","Planlar"],["Tüm Ödemeler","Ödemeler"]],
    "PDF ve Kaynaklar": [["Tüm PDF’ler","PDF ve Kaynaklar"],["PDF Talep Kayıtları","Talep Kayıtları"],["Gönderim Ayarları","Gönderim Ayarları"]],
    "Raporlar": [["Finans Raporları","Finans"],["Randevu Raporları","Randevular"],["Danışan Raporları","Danışanlar"],["Plan Raporları","Planlar"],["Talep ve Dönüşüm Raporları","Talep ve Dönüşüm"],["Kayıtlı Raporlar","Kayıtlı Raporlar"],["Dışa Aktarımlar","Dışa Aktarımlar"]],
    "Kullanıcılar ve Yetkiler": [["Tüm Kullanıcılar","Kullanıcılar"],["Kullanıcı Davetleri","Davetler"],["Roller","Roller"],["Yetki Grupları","Yetki Grupları"],["Yönetici E-posta İzinleri","Yönetici E-posta İzinleri"],["Giriş Geçmişi","Giriş Geçmişi"]],
    "Ayarlar": [["İşletme Bilgileri","İşletme"],["Danışan Ayarları","Danışanlar"],["Randevu Ayarları","Randevular"],["Finans Ayarları","Finans"],["Bildirim Ayarları","Bildirimler"],["E-posta Şablonları","E-posta Şablonları"],["Entegrasyonlar","Entegrasyonlar"],["KVKK ve Veri","KVKK ve Veri"],["Görünüm Ayarları","Görünüm"]],
    "Arşiv": [["Arşivlenen Danışanlar","Arşivlenen Kayıtlar"],["Çöp Kutusu","Çöp Kutusu"],["İşlem Geçmişi","İşlem Geçmişi"]]
  };

  const SCOPE = {
    "Randevular": {"Randevu Listesi":["Kayıt Listesi","Randevu Listesi"],"Liste Görünümü":["Kayıt Listesi","Randevu Listesi"],"Takvim":["Takvim","Takvim Görünümü"],"Takvim Görünümü":["Takvim","Takvim Görünümü"]},
    "Takvim ve Uygunluk": {"Takvim":["Takvim"],"Çalışma Saatleri":["Haftalık Çalışma Saatleri"],"Haftalık Çalışma Saatleri":["Haftalık Çalışma Saatleri"],"Özel Saatler":["Tarihe Özel Saatler"],"Tarihe Özel Saatler":["Tarihe Özel Saatler"],"Kapalı Zamanlar":["Kapalı Zamanlar"],"Randevu Kuralları":["Randevu Kuralları"],"İlk Görüşme":["İlk Görüşme Ayarları"],"İlk Görüşme Ayarları":["İlk Görüşme Ayarları"],"İptal ve Değişiklik":["İptal Kuralları"],"İptal ve Değişiklik Kuralları":["İptal Kuralları"],"Entegrasyonlar":["Entegrasyonlar"],"Takvim Entegrasyonları":["Entegrasyonlar"]},
    "Talepler ve İletişim": {"Talepler":["Kayıt Listesi","Talep Detayı","Talep İşlemleri"],"Tüm Talepler":["Kayıt Listesi","Talep Detayı","Talep İşlemleri"],"Mesaj Şablonları":["Mesaj Şablonları"],"Gönderim Geçmişi":["Kayıt Listesi","Gönderim Geçmişi"],"İletişim İzinleri":["İletişim İzinleri"]},
    "Hizmetler": {"Hizmet Listesi":["Kayıt Listesi","Hizmet Genel Bilgileri"],"Tüm Hizmetler":["Kayıt Listesi","Hizmet Genel Bilgileri"]},
    "Ödeme ve Planlar": {"Finans Özeti":["Finans Genel Bakış"],"Planlar":["Kayıt Listesi","Plan Detayı","Ödeme Planı","Seans Kullanımı","Hareket Geçmişi","Plan İşlemleri"],"Tüm Planlar":["Kayıt Listesi","Plan Detayı","Ödeme Planı","Seans Kullanımı","Hareket Geçmişi","Plan İşlemleri"],"Ödemeler":["Kayıt Listesi","Ödeme Detayı","Ödeme İşlemleri"],"Tüm Ödemeler":["Kayıt Listesi","Ödeme Detayı","Ödeme İşlemleri"]},
    "PDF ve Kaynaklar": {"PDF ve Kaynaklar":["Kayıt Listesi","PDF Detayı","PDF İşlemleri"],"Tüm PDF’ler":["Kayıt Listesi","PDF Detayı","PDF İşlemleri"],"Talep Kayıtları":["Kayıt Listesi","PDF Talep Kayıtları"],"PDF Talep Kayıtları":["Kayıt Listesi","PDF Talep Kayıtları"],"Gönderim Ayarları":["Gönderim Ayarları"]},
    "Raporlar": {"Finans":["Finans Raporları","Rapor Üst İşlemleri"],"Finans Raporları":["Finans Raporları","Rapor Üst İşlemleri"],"Randevular":["Randevu Raporları","Rapor Üst İşlemleri"],"Randevu Raporları":["Randevu Raporları","Rapor Üst İşlemleri"],"Danışanlar":["Danışan Raporları","Rapor Üst İşlemleri"],"Danışan Raporları":["Danışan Raporları","Rapor Üst İşlemleri"],"Planlar":["Plan Raporları","Rapor Üst İşlemleri"],"Plan Raporları":["Plan Raporları","Rapor Üst İşlemleri"],"Talep ve Dönüşüm":["Talep Raporları","Rapor Üst İşlemleri"],"Talep ve Dönüşüm Raporları":["Talep Raporları","Rapor Üst İşlemleri"],"Kayıtlı Raporlar":["Kayıt Listesi","Kayıtlı Raporlar"],"Dışa Aktarımlar":["Kayıt Listesi","Dışa Aktarımlar"]},
    "Kullanıcılar ve Yetkiler": {"Kullanıcılar":["Kayıt Listesi","Kullanıcı Detayı","Kullanıcı İşlemleri"],"Tüm Kullanıcılar":["Kayıt Listesi","Kullanıcı Detayı","Kullanıcı İşlemleri"],"Davetler":["Kayıt Listesi","Kullanıcı Davetleri"],"Kullanıcı Davetleri":["Kayıt Listesi","Kullanıcı Davetleri"],"Roller":["Roller"],"Yetki Grupları":["Yetkiler","Yetki Grupları"],"Yönetici E-posta İzinleri":["Yönetici E-posta İzinleri"],"Giriş Geçmişi":["Kayıt Listesi","Giriş Geçmişi"]},
    "Ayarlar": {"İşletme":["İşletme Bilgileri"],"İşletme Bilgileri":["İşletme Bilgileri"],"Danışanlar":["Danışan Ayarları"],"Danışan Ayarları":["Danışan Ayarları"],"Randevular":["Randevu Ayarları"],"Randevu Ayarları":["Randevu Ayarları"],"Finans":["Finans Ayarları"],"Finans Ayarları":["Finans Ayarları"],"Bildirimler":["Bildirim Ayarları"],"Bildirim Ayarları":["Bildirim Ayarları"],"E-posta Şablonları":["E-posta Şablonları"],"Entegrasyonlar":["Entegrasyonlar"],"KVKK ve Veri":["KVKK ve Veri"],"Görünüm":["Görünüm Ayarları"],"Görünüm Ayarları":["Görünüm Ayarları"]},
    "Arşiv": {"Arşivlenen Kayıtlar":["Kayıt Listesi","Arşiv Detayı"],"Arşivlenen Danışanlar":["Kayıt Listesi","Arşiv Detayı"],"Çöp Kutusu":["Kayıt Listesi","Çöp Kutusu"],"İşlem Geçmişi":["Kayıt Listesi","İşlem Geçmişi"]}
  };

  const txt = (e) => (e?.textContent || "").replace(/\s+/g," ").trim();
  const nav = () => document.querySelector("#module-nav-panel");
  const ws = () => document.querySelector("#module-workspace") || document.querySelector("#contact-social-workspace");
  const mod = () => txt(nav()?.querySelector("h2"));
  const view = () => txt(ws()?.querySelector("h1"));
  const parts = (b) => { const d = Array.from(b.querySelectorAll("div")).find((x) => x.className.includes("min-w-0") && x.className.includes("flex-1")); const s = d ? Array.from(d.querySelectorAll("span")) : []; return {label:s[0],desc:s[1]}; };
  const originals = () => Array.from(nav()?.querySelectorAll("section:not([data-compact-nav]) button") || []);
  const findOriginal = (labels) => { const wanted = new Set(Array.isArray(labels) ? labels : [labels]); return originals().find((b) => wanted.has(parts(b).label?.textContent?.trim())); };
  const clickOriginal = (labels) => { const b = findOriginal(labels); if (!b) return false; b.click(); setTimeout(run,0); return true; };
  const active = (b) => b.className.includes("from-[#eafda8]") || b.className.includes("bg-gradient-to-br") || b.getAttribute("aria-current") === "page";

  function compactNav() {
    const panel = nav(); if (!panel) return;
    const scroll = Array.from(panel.children).find((e) => e.className.includes("overflow-y-auto")); if (!scroll) return;
    const old = scroll.querySelector(":scope>section[data-compact-nav]");
    const sections = Array.from(scroll.querySelectorAll(":scope>section:not([data-compact-nav])"));
    const rules = NAV[mod()];
    let search = panel.querySelector("input"); while (search && search.parentElement !== panel) search = search.parentElement;
    const plus = panel.querySelector(":scope>div:first-child button");
    if (!rules) { old?.remove(); sections.forEach((s)=>s.style.display=""); if(search)search.style.display=""; if(plus)plus.style.display=""; return; }
    const source = sections.flatMap((s)=>Array.from(s.querySelectorAll("button")));
    const allowed = rules.map(([from,to]) => { const button=source.find((b)=>parts(b).label?.textContent?.trim()===from); return button ? {from,to,button}:null; }).filter(Boolean);
    if (!allowed.length) return;
    const selected = allowed.find((x)=>active(x.button)); if(!selected){allowed[0].button.click();setTimeout(run,0);return;}
    sections.forEach((s)=>s.style.display="none"); if(search)search.style.display="none"; if(plus)plus.style.display="none";
    const sig=mod()+"|"+selected.from; if(old?.dataset.signature===sig)return; old?.remove();
    const section=document.createElement("section"); section.dataset.compactNav="1"; section.dataset.signature=sig; section.className="space-y-2";
    section.innerHTML='<div class="flex items-center justify-between px-1"><span class="text-[9px] text-gray-400 font-black tracking-[0.16em] uppercase">Bölümler</span><span class="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">'+allowed.length+'</span></div>';
    const list=document.createElement("div"); list.className="space-y-2";
    allowed.forEach(({to,button})=>{const clone=button.cloneNode(true);const p=parts(clone);if(p.label)p.label.textContent=to;clone.addEventListener("click",()=>{button.click();setTimeout(run,0);});list.appendChild(clone);});
    section.appendChild(list);scroll.prepend(section);
  }

  const sections = (root) => Array.from(root.querySelectorAll("section")).filter((s)=>!s.dataset.globalFilter && !s.parentElement?.closest("section"));
  function scope() {
    const root=ws(); if(!root || root.id==="contact-social-workspace")return;
    const map=SCOPE[mod()], allowed=map?.[view()]; if(!allowed)return;
    const known=new Set(Object.values(map).flat());
    sections(root).forEach((s)=>{const h=txt(s.querySelector("h2,h3"));if(h&&known.has(h))s.style.display=allowed.includes(h)?"":"none";});
    const stats=Array.from(root.children).find((e)=>e.className?.includes("grid-cols-2")&&e.querySelectorAll(":scope>div").length>=3);
    const keep=new Set(["Randevu Listesi","Liste Görünümü","Takvim","Takvim Görünümü","Talepler","Tüm Talepler","Hizmet Listesi","Tüm Hizmetler","Finans Özeti","PDF ve Kaynaklar","Tüm PDF’ler","Kullanıcılar","Tüm Kullanıcılar","Arşivlenen Kayıtlar","Arşivlenen Danışanlar"]);
    if(stats)stats.style.display=keep.has(view())?"":"none";
  }

  function notice(message,error=false){document.querySelector("[data-dash-note]")?.remove();const n=document.createElement("div");n.dataset.dashNote="1";n.textContent=message;n.className="fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full px-4 py-2 text-[10px] font-black shadow-xl "+(error?"bg-[#9f3f35] text-white":"bg-black text-[#eafda8]");document.body.appendChild(n);setTimeout(()=>n.remove(),2200);}
  function bind(button,key,fn){if(!button)return;button.__dashFn=fn;button.dataset.dashKey=key;if(button.dataset.dashBound)return;button.dataset.dashBound="1";button.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();button.__dashFn?.();},true);}
  const itemText=(item)=>txt(item)+" "+Array.from(item.querySelectorAll("input,textarea,select")).map((c)=>c.value||"").join(" ");
  function rows(root){const status=new Set(["Aktif","Pasif","Yayında","Taslak","Arşivde","Onaylandı","Onay Bekliyor","Ödeme Bekliyor","Yeniden Planlandı","Gönderildi","Bekliyor","Hata","Tamamlandı","İptal"]);const badges=Array.from(root.querySelectorAll("span,div")).filter((e)=>e.childElementCount===0&&status.has(txt(e)));const found=[];badges.forEach((badge)=>{let row=badge.parentElement;while(row&&row!==root){const v=txt(row);if(v.length>=20&&v.length<=700&&row.parentElement?.children.length>=2)break;row=row.parentElement;}if(row&&row!==root&&!found.includes(row))found.push(row);});const count=new Map();found.forEach((r)=>count.set(r.parentElement,(count.get(r.parentElement)||0)+1));const parent=Array.from(count.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0];return parent?found.filter((r)=>r.parentElement===parent):[];}
  function items(){const root=ws();if(!root)return[];if(root.id==="contact-social-workspace"){const h=Array.from(root.querySelectorAll("h2")).find((x)=>txt(x)==="İletişim kanalları");const a=h?.closest("section")?.querySelectorAll("article");if(a?.length)return Array.from(a);}const r=rows(root);if(r.length>1)return r;return sections(root).filter((s)=>s.style.display!=="none"&&txt(s.querySelector("h2,h3")));}

  function filterPanel(){return ws()?.querySelector("[data-global-filter]");}
  function applyFilter(){const panel=filterPanel();if(!panel)return;const q=(panel.querySelector("input")?.value||"").trim().toLocaleLowerCase("tr-TR");items().forEach((item)=>item.style.display=!q||itemText(item).toLocaleLowerCase("tr-TR").includes(q)?"":"none");}
  function filter(){const root=ws();if(!root)return;let panel=filterPanel();if(!panel){panel=document.createElement("section");panel.dataset.globalFilter="1";panel.className="hidden rounded-[1.4rem] border border-black/[0.07] bg-white/88 p-3 shadow-sm items-center gap-2";panel.innerHTML='<input type="search" placeholder="Bu görünümde ara ve filtrele..." class="min-w-[240px] flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold outline-none focus:border-black/25"><button class="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black text-gray-600">Temizle</button>';const header=Array.from(root.children).find((e)=>e.tagName==="HEADER");header?root.insertBefore(panel,header.nextSibling):root.prepend(panel);panel.querySelector("input")?.addEventListener("input",applyFilter);panel.querySelector("button")?.addEventListener("click",()=>{panel.querySelector("input").value="";applyFilter();panel.querySelector("input").focus();});}const open=panel.classList.contains("hidden");panel.classList.toggle("hidden",!open);panel.classList.toggle("flex",open);if(open)panel.querySelector("input")?.focus();else{panel.querySelector("input").value="";applyFilter();}}
  function sort(){const root=ws();if(!root)return;if(root.id==="contact-social-workspace"){const h=Array.from(root.querySelectorAll("h2")).find((x)=>txt(x)==="Sıralama");if(!h)return notice("Sıralama alanı bulunamadı.",true);h.closest("section")?.scrollIntoView({behavior:"smooth",block:"center"});return notice("Kanal sırasını oklarla değiştirip kaydet.");}const list=items().filter((x)=>x.style.display!=="none");if(list.length<2)return notice("Sıralanacak kayıt bulunmuyor.",true);const dir=root.dataset.sortDirection==="asc"?"desc":"asc";root.dataset.sortDirection=dir;const groups=new Map();list.forEach((x)=>{if(!groups.has(x.parentElement))groups.set(x.parentElement,[]);groups.get(x.parentElement).push(x);});for(const [parent,group] of groups){group.sort((a,b)=>itemText(a).localeCompare(itemText(b),"tr",{numeric:true})*(dir==="asc"?1:-1));group.forEach((x)=>parent.appendChild(x));}notice(dir==="asc"?"A–Z sıralandı.":"Z–A sıralandı.");}
  function exportCsv(){const list=items().filter((x)=>x.style.display!=="none");if(!list.length)return notice("Dışa aktarılacak içerik bulunmuyor.",true);const esc=(v)=>'"'+String(v).replaceAll('"','""')+'"';const data=[["Bölüm","Görünüm","Kayıt"],...list.map((x)=>[mod(),view(),itemText(x)])];const blob=new Blob(["\ufeff"+data.map((r)=>r.map(esc).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(mod()||"yonetim").toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/gi,"-")+"-"+new Date().toISOString().slice(0,10)+".csv";a.click();URL.revokeObjectURL(a.href);notice("CSV dışa aktarıldı.");}

  const svg={filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5"><path d="M4 5h16l-6 7v5l-4 2v-7z"/></svg>',sort:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5"><path d="m8 7 4-4 4 4M12 3v18m4-4-4 4-4-4"/></svg>',export:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5"><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>'};
  const primary=()=>{const m=mod(),v=view();if(m==="Randevular"||m==="Takvim ve Uygunluk")return["Yeni randevu",["Yeni Randevu"]];if(m==="Talepler ve İletişim"&&["Talepler","Tüm Talepler"].includes(v))return["Yeni talep",["Manuel Kayıt","Yeni Talep"]];if(m==="Hizmetler")return["Yeni hizmet",["Yeni Hizmet"]];if(m==="Ödeme ve Planlar"&&["Planlar","Tüm Planlar"].includes(v))return["Yeni plan",["Yeni Plan"]];if(m==="Ödeme ve Planlar"&&["Ödemeler","Tüm Ödemeler"].includes(v))return["Yeni ödeme",["Yeni Ödeme"]];if(m==="PDF ve Kaynaklar"&&["PDF ve Kaynaklar","Tüm PDF’ler"].includes(v))return["Yeni PDF",["Yeni PDF"]];if(m==="Kullanıcılar ve Yetkiler"&&["Kullanıcılar","Tüm Kullanıcılar"].includes(v))return["Kullanıcı davet et",["Kullanıcı Davetleri"]];return null;};
  function label(button,value){const nodes=[],walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);while(walker.nextNode())if(walker.currentNode.nodeValue?.trim())nodes.push(walker.currentNode);if(nodes.length)nodes.at(-1).nodeValue=value;}
  function actionButton(key,name,icon){const b=document.createElement("button");b.type="button";b.dataset.globalAction=key;b.className="rounded-full border border-black/10 bg-white/65 px-3 py-1.5 text-[10px] font-bold text-gray-700 flex items-center gap-1.5 transition-all hover:bg-white cursor-pointer";b.innerHTML=icon+"<span>"+name+"</span>";return b;}
  function actions(){const root=ws();if(!root)return;const row=Array.from(root.children).find((e)=>e.tagName==="DIV"&&e.querySelector("button,a"));if(!row)return;const group=Array.from(row.children).find((e)=>e.querySelector?.("button,a"))||row;const contact=root.id==="contact-social-workspace";const existing=Array.from(group.querySelectorAll(":scope>button"));if(!contact){const p=primary();existing.forEach((b,i)=>{if(b.dataset.globalAction)return;if(p&&i===0&&findOriginal(p[1])){b.style.display="";label(b,p[0]);bind(b,"primary",()=>clickOriginal(p[1])||notice("Oluşturma ekranı bulunamadı.",true));}else b.style.display="none";});}[["filter","Filtrele",svg.filter,filter],["sort","Sırala",svg.sort,sort],["export","Dışa aktar",svg.export,exportCsv]].forEach(([key,name,icon,fn])=>{let b=group.querySelector('[data-global-action="'+key+'"]');if(!b){b=actionButton(key,name,icon);group.appendChild(b);}bind(b,key,fn);});}
  function header(){const h=document.querySelector("#main-app-header");if(!h)return;const buttons=Array.from(h.querySelectorAll("button"));["Son işlemler","Öngörüler","Yardım","Destek","Filtreler"].forEach((title)=>{const b=buttons.find((x)=>x.title===title);if(b)b.style.display="none";});const p=primary(),plus=buttons.find((x)=>x.title==="Hızlı oluştur");if(plus&&p&&findOriginal(p[1])){plus.style.display="";bind(plus,"header-primary",()=>clickOriginal(p[1]));}else if(plus)plus.style.display="none";const search=buttons.find((x)=>x.title==="Ara");if(search){search.style.display="";bind(search,"header-search",filter);}const profile=Array.from(h.querySelectorAll("*")).find((e)=>e.childElementCount===0&&txt(e)==="BA");if(profile){profile.title="Berfin Akbaş · Terapist ve Site Sahibi";profile.setAttribute("aria-label",profile.title);}}

  let queued=false;function apply(){queued=false;compactNav();scope();actions();header();}function run(){if(queued)return;queued=true;requestAnimationFrame(apply);}function start(){const style=document.createElement("style");style.textContent="#contact-social-workspace{animation-duration:.12s!important}#dashboard-right-column>.grid.place-items-center{background:linear-gradient(118deg,#eafda8 0%,#fff8ed 28%,#fff 55%,#fff8f4 100%)!important}";document.head.appendChild(style);new MutationObserver(run).observe(document.querySelector("#app-root-layout")||document.body,{childList:true,subtree:true});run();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
`;

const indexPath = path.join(root, "index.html");
const html = await readFile(indexPath, "utf-8");
const marker = "data-dashboard-runtime-v4";
if (!html.includes(marker)) {
  const injection = `<script ${marker}>${runtime}</script>`;
  const moduleScript = '<script type="module"';
  const patched = html.includes(moduleScript)
    ? html.replace(moduleScript, `${injection}${moduleScript}`)
    : html.includes("</body>")
      ? html.replace("</body>", `${injection}</body>`)
      : `${html}${injection}`;
  await writeFile(indexPath, patched, "utf-8");
}

console.log("Dashboard scoped workspaces, active filter/sort/export controls and contact cache applied.");
