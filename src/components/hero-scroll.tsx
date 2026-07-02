"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/public-shell";

const heroHighlights = ["Kişiye göre planlama", "Yüz yüze veya online görüşme", "Onaylı randevu akışı"];

const heroCss = `
.scrollHero{position:relative;height:210vh;min-height:1100px;overflow:clip;background:var(--paper);--hero-room-scale:1.13;--hero-room-y:0vh;--hero-nav-y:-96px;--hero-nav-opacity:0;--hero-copy-y:100px;--hero-copy-opacity:0;--hero-portrait-left:49%;--hero-portrait-bottom:-2vh;--hero-portrait-width:530px;--hero-portrait-scale:1.06;--hero-card-y:36px;--hero-card-opacity:0;--hero-speech-opacity:.08}.scrollHeroSticky{position:sticky;top:0;height:100vh;min-height:720px;overflow:hidden;background:#fffaf4}.scrollHeroRoom{position:absolute;inset:-5vh -4vw;z-index:1;background-image:url('/therapy-office-hero.png');background-position:center;background-repeat:no-repeat;background-size:cover;transform:translate3d(0,var(--hero-room-y),0) scale(var(--hero-room-scale));transform-origin:center}.scrollHeroSticky:after{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,rgb(255 250 244 / 88%) 0%,rgb(255 250 244 / 42%) 42%,transparent 100%);content:""}.scrollHeroStage{position:relative;z-index:5;width:min(1280px,calc(100% - 54px));height:100%;margin-inline:auto}.scrollHeroNav{position:absolute;top:20px;left:50%;z-index:40;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:34px;width:min(1160px,calc(100% - 48px));min-height:68px;padding:0 16px 0 22px;border-radius:999px;background:rgb(255 250 244 / 82%);box-shadow:0 18px 54px rgb(85 55 39 / 9%);backdrop-filter:blur(22px);opacity:var(--hero-nav-opacity);transform:translate3d(-50%,var(--hero-nav-y),0)}.scrollHeroNav nav{display:flex;justify-content:center;gap:30px;color:#604d44;font-size:.82rem;font-weight:650}.scrollHeroNavCta{justify-self:end;border-radius:999px;background:var(--coral);padding:13px 20px;color:#fff;font-size:.78rem;font-weight:800}.scrollHeroPortrait{position:absolute;left:var(--hero-portrait-left);bottom:var(--hero-portrait-bottom);z-index:18;width:min(var(--hero-portrait-width),40vw);height:min(79vh,770px);min-height:520px;display:flex;align-items:flex-end;justify-content:center;transform:translateX(-50%) scale(var(--hero-portrait-scale));transform-origin:bottom center;filter:drop-shadow(0 34px 60px rgb(74 47 32 / 18%))}.scrollHeroPortrait img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom}.scrollHeroCopy{position:absolute;right:4vw;bottom:10vh;z-index:14;width:min(660px,52vw);opacity:var(--hero-copy-opacity);transform:translate3d(0,var(--hero-copy-y),0)}.scrollHeroCopy h1{margin:0;color:var(--ink);font-family:var(--serif);font-size:clamp(4.35rem,7.4vw,8.2rem);font-weight:500;letter-spacing:-.058em;line-height:.9}.scrollHeroCopy h1 span,.scrollHeroCopy h1 em{display:block}.scrollHeroCopy h1 em{color:var(--coral);font-style:italic}.scrollHeroCopy>p:not(.section-kicker){max-width:520px;margin:28px 0 0;color:var(--muted);line-height:1.75}.scrollHeroActions,.scrollHeroHighlights{display:flex;flex-wrap:wrap;gap:12px}.scrollHeroActions{margin-top:30px}.scrollHeroHighlights{margin:28px 0 0;padding:0;list-style:none;color:#6b594f;font-size:.74rem;font-weight:700}.scrollHeroHighlights li{display:flex;align-items:center;gap:7px}.scrollHeroHighlights span{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:#e8eee2;color:#65725d}.scrollProgressCard{position:absolute;right:2vw;bottom:16vh;z-index:20;width:242px;border-radius:24px;background:rgb(255 250 244 / 84%);padding:21px;box-shadow:0 22px 56px rgb(67 39 26 / 12%);opacity:var(--hero-card-opacity);transform:translate3d(0,var(--hero-card-y),0)}.scrollProgressCard span,.scrollProgressCard small{color:var(--muted);font-size:.68rem;font-weight:800}.scrollProgressCard>div{display:flex;align-items:center;justify-content:space-between;gap:12px}.scrollProgressCard strong{display:block;margin-top:12px;color:var(--ink);font-size:2.6rem;line-height:1}.scrollProgressCard svg{width:100%;height:58px;margin-top:11px}.scrollProgressCard path{fill:none;stroke:var(--coral);stroke-linecap:round;stroke-width:4}.scrollSpeechLayer{position:absolute;top:25vh;left:48%;z-index:9;width:310px;height:170px;opacity:var(--hero-speech-opacity);pointer-events:none}.scrollSpeechLayer:before,.scrollSpeechLayer:after{position:absolute;inset:0;border:1px solid rgb(217 111 77 / 20%);border-radius:50%;content:""}.scrollSpeechLayer:after{inset:28px}.scrollSpeechLayer span{position:absolute;top:50%;width:5px;border-radius:99px;background:rgb(217 111 77 / 50%);transform:translateY(-50%)}.scrollSpeechLayer span:nth-child(1){left:120px;height:26px}.scrollSpeechLayer span:nth-child(2){left:147px;height:58px}.scrollSpeechLayer span:nth-child(3){left:174px;height:36px}.scrollSpeechLayer i{position:absolute;right:-78px;width:180px;height:1px;background:linear-gradient(90deg,rgb(217 111 77 / 28%),transparent);transform-origin:left}.scrollSpeechLayer i:nth-of-type(1){top:76px;transform:rotate(-8deg)}.scrollSpeechLayer i:nth-of-type(2){top:96px;transform:rotate(7deg)}@media(max-width:980px){.scrollHero{height:190vh;min-height:1080px}.scrollHeroNav nav,.scrollProgressCard,.scrollSpeechLayer{display:none}.scrollHeroPortrait{left:50%;bottom:33vh;width:min(320px,74vw);height:430px;min-height:430px;transform:translateX(-50%) scale(1)}.scrollHeroCopy{right:auto;bottom:6vh;left:0;width:100%}.scrollHeroCopy h1{font-size:clamp(3.45rem,14vw,6rem)}}`;

export default function HeroScroll() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const updateHeroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollableDistance = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollableDistance, 0, 1);
      const copyProgress = clamp((progress - 0.18) / 0.48, 0, 1);
      const navProgress = clamp(progress / 0.22, 0, 1);
      const cardProgress = clamp((progress - 0.52) / 0.3, 0, 1);

      hero.style.setProperty("--hero-room-scale", (1.13 - progress * 0.13).toFixed(4));
      hero.style.setProperty("--hero-room-y", `${progress * -1.8}vh`);
      hero.style.setProperty("--hero-nav-y", `${-96 + navProgress * 116}px`);
      hero.style.setProperty("--hero-nav-opacity", navProgress.toFixed(4));
      hero.style.setProperty("--hero-copy-y", `${100 - copyProgress * 100}px`);
      hero.style.setProperty("--hero-copy-opacity", copyProgress.toFixed(4));
      hero.style.setProperty("--hero-portrait-left", `${49 - progress * 23}%`);
      hero.style.setProperty("--hero-portrait-bottom", `${-2 + progress * 7}vh`);
      hero.style.setProperty("--hero-portrait-width", `${530 - progress * 155}px`);
      hero.style.setProperty("--hero-portrait-scale", (1.06 - progress * 0.14).toFixed(4));
      hero.style.setProperty("--hero-card-y", `${36 - cardProgress * 36}px`);
      hero.style.setProperty("--hero-card-opacity", cardProgress.toFixed(4));
      hero.style.setProperty("--hero-speech-opacity", (0.08 + progress * 0.3).toFixed(4));
    };

    updateHeroProgress();
    window.addEventListener("scroll", updateHeroProgress, { passive: true });
    window.addEventListener("resize", updateHeroProgress);
    return () => {
      window.removeEventListener("scroll", updateHeroProgress);
      window.removeEventListener("resize", updateHeroProgress);
    };
  }, []);

  return (
    <section className="scrollHero" ref={heroRef} aria-labelledby="hero-scroll-title">
      <style>{heroCss}</style>
      <div className="scrollHeroSticky">
        <div className="scrollHeroRoom" aria-hidden="true" />
        <header className="scrollHeroNav" aria-label="Ana menü">
          <Link href="/" aria-label="Berfin Akbaş ana sayfa"><BrandMark /></Link>
          <nav><Link href="/hizmetler">Hizmetler</Link><Link href="/hakkimda">Hakkımda</Link><Link href="/randevu">Randevu</Link><Link href="/iletisim">İletişim</Link></nav>
          <Link className="scrollHeroNavCta" href="/randevu">Randevu Al</Link>
        </header>
        <div className="scrollHeroStage">
          <div className="scrollHeroPortrait"><img src="/berfin-hero.png" alt="Berfin Akbaş, Dil ve Konuşma Terapisti" draggable="false" /></div>
          <div className="scrollHeroCopy">
            <p className="section-kicker">Dil ve Konuşma Terapisi</p>
            <h1 id="hero-scroll-title"><span>Her kelime,</span><em>yeni bir başlangıç.</em></h1>
            <p>Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel iletişim desteği.</p>
            <div className="scrollHeroActions"><Link className="primary-button" href="/randevu">Randevu Al</Link><Link className="secondary-button" href="/hizmetler">Hizmetleri İncele</Link></div>
            <ul className="scrollHeroHighlights" aria-label="Temel yaklaşım">{heroHighlights.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
          </div>
          <div className="scrollSpeechLayer" aria-hidden="true"><span /><span /><span /><i /><i /></div>
          <div className="scrollProgressCard" aria-hidden="true"><div><span>Gelişim takibi</span><small>Bu ay</small></div><strong>86%</strong><svg viewBox="0 0 180 70"><path d="M5 54 C28 45, 37 58, 58 43 S91 36, 108 31 S141 23, 175 9" /></svg><small>Düzenli seans ile ilerleme takibi</small></div>
        </div>
      </div>
    </section>
  );
}
