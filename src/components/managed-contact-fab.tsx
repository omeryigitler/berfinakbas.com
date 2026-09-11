"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ChannelId = "whatsapp" | "instagram" | "phone" | "email";

type SiteContactSettings = {
  fabEnabled: boolean;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  whatsappUrl: string;
  instagramUrl: string;
  phone: string;
  email: string;
  labels: Record<ChannelId, string>;
  enabled: Record<ChannelId, boolean>;
  order: ChannelId[];
};

const channelIds: ChannelId[] = ["whatsapp", "instagram", "phone", "email"];

const defaults: SiteContactSettings = {
  fabEnabled: true,
  showOnMobile: true,
  showOnDesktop: true,
  whatsappUrl: "",
  instagramUrl: "",
  phone: "",
  email: "",
  labels: {
    whatsapp: "WhatsApp ile bize ulaşın",
    instagram: "Instagram'da bizi takip edin",
    phone: "Telefonla bizi arayın",
    email: "E-posta gönderin",
  },
  enabled: {
    whatsapp: true,
    instagram: true,
    phone: true,
    email: true,
  },
  order: channelIds,
};

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5.2 18.2 3.8 21l3.3-1a9 9 0 1 0-1.9-1.8Z" />
      <path d="M8.2 9.3h7.6M8.2 13h5.2" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 11.8a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.8Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.3" cy="6.8" r=".7" className="filled" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7.2 3.8 9.5 8c.2.4.1.8-.2 1.1l-1.2 1.2a14 14 0 0 0 5.6 5.6l1.2-1.2c.3-.3.7-.4 1.1-.2l4.2 2.3c.4.2.6.7.5 1.1l-.5 2c-.1.5-.6.8-1.1.8C10.4 20.7 3.3 13.6 3.3 4.9c0-.5.3-1 .8-1.1l2-.5c.4-.1.9.1 1.1.5Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m5 7 7 5.5L19 7" />
    </svg>
  );
}

function channelHref(settings: SiteContactSettings, id: ChannelId): string {
  if (id === "whatsapp") return settings.whatsappUrl || "/iletisim";
  if (id === "instagram") return settings.instagramUrl || "/iletisim";
  if (id === "phone") {
    if (!settings.phone) return "/iletisim";
    return settings.phone.startsWith("tel:")
      ? settings.phone
      : `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  }
  if (!settings.email) return "/iletisim";
  return settings.email.startsWith("mailto:") ? settings.email : `mailto:${settings.email}`;
}

const channelIcons = {
  whatsapp: <WhatsAppIcon />,
  instagram: <InstagramIcon />,
  phone: <PhoneIcon />,
  email: <MailIcon />,
} satisfies Record<ChannelId, ReactNode>;

export default function ManagedContactFab({ hideOnHome = false }: { hideOnHome?: boolean }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteContactSettings>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const suppressedRoute =
    pathname.startsWith("/yonetim") ||
    pathname.startsWith("/giris") ||
    (hideOnHome && pathname === "/");

  useEffect(() => {
    if (suppressedRoute) return;

    let active = true;

    fetch("/api/site-contact", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("contact"))))
      .then((data: SiteContactSettings) => {
        if (active) setSettings(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [suppressedRoute]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu when the route changes
    setIsOpen(false);
  }, [pathname]);

  const orderIndex = useMemo(
    () =>
      Object.fromEntries(settings.order.map((id, index) => [id, index + 1])) as Record<
        ChannelId,
        number
      >,
    [settings.order],
  );

  const availableChannels = channelIds.filter(
    (id) => settings.enabled[id] && Boolean(channelHref(settings, id)),
  );

  if (
    suppressedRoute ||
    !loaded ||
    !settings.fabEnabled ||
    availableChannels.length === 0
  ) {
    return null;
  }

  return (
    <>
      <div
        className={`contact-fab managed-contact-fab ${isOpen ? "is-open" : ""} ${
          settings.showOnMobile ? "" : "contact-fab--mobile-hidden"
        } ${settings.showOnDesktop ? "" : "contact-fab--desktop-hidden"}`}
      >
        {isOpen ? (
          <div className="contact-fab-menu" id="managed-contact-fab-menu" role="menu">
            <div className="contact-fab-heading">
              <span className="contact-fab-mini-brand">
                <span className="brand-symbol" aria-hidden="true">
                  <Image src="/logo-mark.png" alt="" width={36} height={36} />
                </span>
                <span>
                  <small>iletişim notu</small>
                  <strong>Berfin Akbaş</strong>
                </span>
              </span>
            </div>

            {channelIds.map((id) => {
              const href = channelHref(settings, id);
              const visible = settings.enabled[id] && Boolean(href);
              const external = href.startsWith("http");

              return (
                <a
                  className={visible ? "" : "contact-fab-channel-hidden"}
                  href={href || "/iletisim"}
                  key={id}
                  onClick={() => setIsOpen(false)}
                  rel={external ? "noreferrer" : undefined}
                  role="menuitem"
                  style={{ order: orderIndex[id] ?? channelIds.indexOf(id) + 1 }}
                  target={external ? "_blank" : undefined}
                >
                  <span className="contact-fab-label">{settings.labels[id]}</span>
                  <span className="contact-fab-action-icon">{channelIcons[id]}</span>
                </a>
              );
            })}
          </div>
        ) : null}

        <button
          aria-controls="managed-contact-fab-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? "İletişim menüsünü kapat" : "İletişim menüsünü aç"}
          className="contact-fab-trigger"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? <span className="contact-fab-close">×</span> : <ChatIcon />}
        </button>
      </div>

      <style jsx global>{`
        .scrollHero > .contact-fab:not(.managed-contact-fab) {
          display: none !important;
        }

        .managed-contact-fab.contact-fab {
          --fab-paper: #fbfaf7;
          --fab-ink: #3f3c38;
          --fab-muted: #807a73;
          --fab-teal: #08a49c;
          --fab-grid: rgb(72 67 61 / 5.5%);
          --fab-hand: "Segoe Print", "Comic Sans MS", "Bradley Hand", "Chalkboard SE", cursive;
          position: fixed;
          right: clamp(18px, 2vw, 28px);
          bottom: clamp(18px, 2vw, 28px);
          z-index: 9000;
          display: grid;
          justify-items: end;
          gap: 13px;
        }

        .managed-contact-fab .contact-fab-trigger {
          position: relative;
          display: grid;
          width: 56px;
          height: 56px;
          place-items: center;
          border: 1.5px solid var(--fab-ink);
          border-radius: 48% 52% 46% 54% / 52% 46% 54% 48%;
          background: var(--fab-ink);
          box-shadow: 4px 5px 0 rgb(63 60 56 / 20%);
          color: var(--fab-paper);
          cursor: pointer;
          transform: rotate(-1.8deg);
          transition:
            transform 170ms ease,
            box-shadow 170ms ease,
            background 170ms ease,
            color 170ms ease;
        }

        .managed-contact-fab .contact-fab-trigger::after {
          position: absolute;
          top: 8px;
          right: 7px;
          width: 8px;
          height: 8px;
          border: 1px solid var(--fab-paper);
          border-radius: 50%;
          background: var(--fab-teal);
          content: "";
        }

        .managed-contact-fab .contact-fab-trigger:hover,
        .managed-contact-fab .contact-fab-trigger:focus-visible {
          box-shadow: 2px 3px 0 rgb(63 60 56 / 18%);
          transform: translate(2px, 2px) rotate(0.8deg);
        }

        .managed-contact-fab.is-open .contact-fab-trigger {
          background: var(--fab-paper);
          color: var(--fab-ink);
        }

        .managed-contact-fab.is-open .contact-fab-trigger::after {
          border-color: var(--fab-ink);
        }

        .managed-contact-fab .contact-fab-trigger svg {
          width: 25px;
          height: 25px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.8;
        }

        .managed-contact-fab .contact-fab-close {
          margin-top: -2px;
          font-family: var(--fab-hand);
          font-size: 2rem;
          font-weight: 500;
          line-height: 1;
        }

        .managed-contact-fab .contact-fab-menu {
          position: relative;
          display: grid;
          width: 300px;
          overflow: visible;
          border: 1.5px solid rgb(63 60 56 / 78%);
          border-radius: 15px 19px 14px 18px;
          background-color: rgb(251 250 247 / 98%);
          background-image:
            linear-gradient(var(--fab-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--fab-grid) 1px, transparent 1px);
          background-size: 22px 22px;
          box-shadow: 7px 8px 0 rgb(63 60 56 / 14%);
          color: var(--fab-ink);
          transform: rotate(-0.35deg);
          animation: contact-fab-note-in 180ms ease-out both;
        }

        .managed-contact-fab .contact-fab-menu::before {
          position: absolute;
          top: -11px;
          left: 50%;
          width: 78px;
          height: 20px;
          background: rgb(235 218 172 / 72%);
          box-shadow: 0 1px 0 rgb(63 60 56 / 7%);
          content: "";
          transform: translateX(-50%) rotate(1.8deg);
        }

        .managed-contact-fab .contact-fab-heading {
          display: flex;
          justify-content: center;
          padding: 20px 18px 14px;
          border-bottom: 1px solid rgb(63 60 56 / 16%);
        }

        .managed-contact-fab .contact-fab-mini-brand {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          font-family: var(--fab-hand);
        }

        .managed-contact-fab .contact-fab-mini-brand > span:last-child {
          display: grid;
          gap: 1px;
        }

        .managed-contact-fab .contact-fab-mini-brand small {
          color: var(--fab-teal);
          font-size: 0.58rem;
          font-weight: 800;
          transform: rotate(-1.5deg);
        }

        .managed-contact-fab .contact-fab-mini-brand strong {
          font-size: 0.94rem;
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .managed-contact-fab .contact-fab-mini-brand .brand-symbol {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          overflow: hidden;
          border: 0;
          border-radius: 0;
          background: transparent;
          filter: grayscale(1) contrast(1.18);
        }

        .managed-contact-fab .contact-fab-mini-brand .brand-symbol img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .managed-contact-fab .contact-fab-menu > a {
          display: grid;
          grid-template-columns: 1fr 38px;
          gap: 12px;
          align-items: center;
          min-height: 56px;
          padding: 9px 13px 9px 17px;
          border-bottom: 1px solid rgb(63 60 56 / 13%);
          color: var(--fab-ink);
          font-family: var(--fab-hand);
          font-size: 0.75rem;
          font-weight: 750;
          transition:
            background 150ms ease,
            transform 150ms ease;
        }

        .managed-contact-fab .contact-fab-menu > a:hover,
        .managed-contact-fab .contact-fab-menu > a:focus-visible {
          background: rgb(8 164 156 / 7%);
          transform: translateX(-2px);
        }

        .managed-contact-fab .contact-fab-menu > a:last-of-type {
          border-bottom: 0;
        }

        .managed-contact-fab .contact-fab-channel-hidden {
          display: none !important;
        }

        .managed-contact-fab .contact-fab-action-icon {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 1.25px solid rgb(63 60 56 / 70%);
          border-radius: 48% 52% 46% 54%;
          background: rgb(251 250 247 / 88%);
          color: var(--fab-teal);
          box-shadow: 2px 2px 0 rgb(63 60 56 / 8%);
        }

        .managed-contact-fab .contact-fab-menu > a:nth-of-type(odd) .contact-fab-action-icon {
          transform: rotate(-2deg);
        }

        .managed-contact-fab .contact-fab-menu > a:nth-of-type(even) .contact-fab-action-icon {
          transform: rotate(2deg);
        }

        .managed-contact-fab .contact-fab-action-icon svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.75;
        }

        .managed-contact-fab .contact-fab-action-icon svg .filled {
          fill: currentColor;
          stroke: none;
        }

        @keyframes contact-fab-note-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.97) rotate(-1.1deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(-0.35deg);
          }
        }

        @media (min-width: 981px) {
          .managed-contact-fab.contact-fab--desktop-hidden {
            display: none !important;
          }
        }

        @media (max-width: 980px) {
          .managed-contact-fab.contact-fab--mobile-hidden {
            display: none !important;
          }

          .managed-contact-fab.contact-fab {
            right: 15px;
            bottom: 17px;
            gap: 10px;
          }

          .managed-contact-fab .contact-fab-menu {
            width: auto;
            border: 0;
            background: transparent;
            box-shadow: none;
            transform: none;
            animation: none;
          }

          .managed-contact-fab .contact-fab-menu::before,
          .managed-contact-fab .contact-fab-heading {
            display: none;
          }

          .managed-contact-fab .contact-fab-menu > a {
            display: flex;
            min-height: 0;
            justify-content: flex-end;
            gap: 8px;
            padding: 4px 0;
            border: 0;
            background: transparent;
            font-family: var(--fab-hand);
          }

          .managed-contact-fab .contact-fab-menu > a:hover,
          .managed-contact-fab .contact-fab-menu > a:focus-visible {
            background: transparent;
            transform: none;
          }

          .managed-contact-fab .contact-fab-label {
            max-width: 200px;
            border: 1.25px solid rgb(63 60 56 / 68%);
            border-radius: 10px 13px 9px 12px;
            background-color: rgb(251 250 247 / 98%);
            background-image:
              linear-gradient(var(--fab-grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--fab-grid) 1px, transparent 1px);
            background-size: 18px 18px;
            padding: 8px 10px;
            box-shadow: 3px 4px 0 rgb(63 60 56 / 11%);
            color: var(--fab-ink);
            font-size: 0.67rem;
            line-height: 1.35;
            text-align: right;
            transform: rotate(-0.5deg);
          }

          .managed-contact-fab .contact-fab-action-icon {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            border: 1.4px solid var(--fab-ink);
            background: var(--fab-paper);
            color: var(--fab-teal);
            box-shadow: 3px 4px 0 rgb(63 60 56 / 14%);
          }

          .managed-contact-fab .contact-fab-trigger {
            width: 54px;
            height: 54px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .managed-contact-fab .contact-fab-trigger,
          .managed-contact-fab .contact-fab-menu,
          .managed-contact-fab .contact-fab-menu > a {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
