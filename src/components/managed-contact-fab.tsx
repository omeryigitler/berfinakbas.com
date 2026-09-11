"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/public-shell";

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
              <small className="contact-fab-kicker">iletişim notu</small>
              <BrandMark compact />
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
          gap: 11px;
        }

        .managed-contact-fab .contact-fab-trigger {
          display: grid;
          width: 50px;
          height: 50px;
          place-items: center;
          border: 1.35px solid var(--fab-ink);
          border-radius: 48% 52% 46% 54% / 52% 46% 54% 48%;
          background: var(--fab-ink);
          box-shadow: 3px 4px 0 rgb(63 60 56 / 18%);
          color: var(--fab-paper);
          cursor: pointer;
          transform: rotate(-1.4deg);
          transition:
            transform 170ms ease,
            box-shadow 170ms ease,
            background 170ms ease,
            color 170ms ease;
        }

        .managed-contact-fab .contact-fab-trigger:hover,
        .managed-contact-fab .contact-fab-trigger:focus-visible {
          box-shadow: 2px 2px 0 rgb(63 60 56 / 16%);
          transform: translate(1px, 1px) rotate(0.5deg);
        }

        .managed-contact-fab.is-open .contact-fab-trigger {
          background: var(--fab-paper);
          color: var(--fab-ink);
        }

        .managed-contact-fab .contact-fab-trigger svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.75;
        }

        .managed-contact-fab .contact-fab-close {
          margin-top: -2px;
          font-family: var(--fab-hand);
          font-size: 1.72rem;
          font-weight: 500;
          line-height: 1;
        }

        .managed-contact-fab .contact-fab-menu {
          position: relative;
          display: grid;
          width: 286px;
          overflow: visible;
          border: 1.25px solid rgb(63 60 56 / 72%);
          border-radius: 15px 18px 14px 17px;
          background-color: rgb(251 250 247 / 98%);
          background-image:
            linear-gradient(var(--fab-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--fab-grid) 1px, transparent 1px);
          background-size: 20px 20px;
          box-shadow: 5px 6px 0 rgb(63 60 56 / 12%);
          color: var(--fab-ink);
          transform: rotate(-0.25deg);
          animation: contact-fab-note-in 180ms ease-out both;
        }

        .managed-contact-fab .contact-fab-menu::before {
          position: absolute;
          top: -9px;
          left: 50%;
          width: 70px;
          height: 17px;
          background: rgb(235 218 172 / 70%);
          box-shadow: 0 1px 0 rgb(63 60 56 / 6%);
          content: "";
          transform: translateX(-50%) rotate(1.5deg);
        }

        .managed-contact-fab .contact-fab-heading {
          display: grid;
          justify-items: center;
          gap: 2px;
          padding: 16px 16px 11px;
          border-bottom: 1px solid rgb(63 60 56 / 14%);
        }

        .managed-contact-fab .contact-fab-kicker {
          color: var(--fab-teal);
          font-family: var(--fab-hand);
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 0.01em;
          transform: rotate(-1.2deg);
        }

        .managed-contact-fab .contact-fab-heading .brand-mark {
          display: inline-flex;
          gap: 7px;
          align-items: center;
          color: var(--fab-ink);
          font-family: var(--fab-hand);
        }

        .managed-contact-fab .contact-fab-heading .brand-mark > .brand-symbol:first-child {
          width: 52px !important;
          height: 34px !important;
          flex: 0 0 52px !important;
          filter: none !important;
        }

        .managed-contact-fab .contact-fab-heading .brand-mark > span:last-child strong {
          display: block;
          font-size: 0.87rem;
          font-weight: 800;
          letter-spacing: -0.045em;
          line-height: 1.05;
        }

        .managed-contact-fab .contact-fab-menu > a {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 30px;
          gap: 10px;
          align-items: center;
          min-height: 49px;
          padding: 8px 12px 8px 15px;
          border-bottom: 1px solid rgb(63 60 56 / 12%);
          color: var(--fab-ink);
          font-family: var(--fab-hand);
          font-size: 0.7rem;
          font-weight: 750;
          line-height: 1.3;
          transition:
            background 150ms ease,
            transform 150ms ease;
        }

        .managed-contact-fab .contact-fab-menu > a:hover,
        .managed-contact-fab .contact-fab-menu > a:focus-visible {
          background: rgb(8 164 156 / 6%);
          transform: translateX(-1px);
        }

        .managed-contact-fab .contact-fab-menu > a:last-of-type {
          border-bottom: 0;
        }

        .managed-contact-fab .contact-fab-channel-hidden {
          display: none !important;
        }

        .managed-contact-fab .contact-fab-action-icon {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 1px solid rgb(63 60 56 / 58%);
          border-radius: 48% 52% 46% 54%;
          background: rgb(251 250 247 / 84%);
          color: var(--fab-teal);
          box-shadow: 1px 2px 0 rgb(63 60 56 / 7%);
        }

        .managed-contact-fab .contact-fab-menu > a:nth-of-type(odd) .contact-fab-action-icon {
          transform: rotate(-1.4deg);
        }

        .managed-contact-fab .contact-fab-menu > a:nth-of-type(even) .contact-fab-action-icon {
          transform: rotate(1.4deg);
        }

        .managed-contact-fab .contact-fab-action-icon svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.65;
        }

        .managed-contact-fab .contact-fab-action-icon svg .filled {
          fill: currentColor;
          stroke: none;
        }

        @keyframes contact-fab-note-in {
          from {
            opacity: 0;
            transform: translateY(7px) scale(0.98) rotate(-0.8deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(-0.25deg);
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
            right: 13px;
            bottom: 15px;
            gap: 9px;
          }

          .managed-contact-fab .contact-fab-menu {
            width: min(264px, calc(100vw - 30px));
            border-width: 1.15px;
            border-radius: 14px 17px 13px 16px;
            background-size: 18px 18px;
            box-shadow: 4px 5px 0 rgb(63 60 56 / 11%);
            transform: rotate(-0.15deg);
          }

          .managed-contact-fab .contact-fab-menu::before {
            top: -8px;
            width: 62px;
            height: 15px;
          }

          .managed-contact-fab .contact-fab-heading {
            display: grid;
            padding: 14px 14px 10px;
          }

          .managed-contact-fab .contact-fab-heading .brand-mark > .brand-symbol:first-child {
            width: 46px !important;
            height: 30px !important;
            flex-basis: 46px !important;
          }

          .managed-contact-fab .contact-fab-heading .brand-mark > span:last-child strong {
            font-size: 0.82rem;
          }

          .managed-contact-fab .contact-fab-menu > a {
            grid-template-columns: minmax(0, 1fr) 28px;
            min-height: 45px;
            gap: 9px;
            padding: 7px 10px 7px 13px;
            font-size: 0.66rem;
          }

          .managed-contact-fab .contact-fab-label {
            max-width: none;
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
            text-align: left;
            transform: none;
          }

          .managed-contact-fab .contact-fab-action-icon {
            width: 28px;
            height: 28px;
            flex: 0 0 28px;
            border-width: 1px;
            box-shadow: 1px 1px 0 rgb(63 60 56 / 7%);
          }

          .managed-contact-fab .contact-fab-action-icon svg {
            width: 14px;
            height: 14px;
          }

          .managed-contact-fab .contact-fab-trigger {
            width: 48px;
            height: 48px;
          }

          .managed-contact-fab .contact-fab-trigger svg {
            width: 21px;
            height: 21px;
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
