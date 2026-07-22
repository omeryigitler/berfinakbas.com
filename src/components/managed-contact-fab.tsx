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
  if (id === "whatsapp") return settings.whatsappUrl;
  if (id === "instagram") return settings.instagramUrl;
  if (id === "phone") {
    if (!settings.phone) return "";
    return settings.phone.startsWith("tel:")
      ? settings.phone
      : `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  }
  if (!settings.email) return "";
  return settings.email.startsWith("mailto:") ? settings.email : `mailto:${settings.email}`;
}

const channelIcons = {
  whatsapp: <WhatsAppIcon />,
  instagram: <InstagramIcon />,
  phone: <PhoneIcon />,
  email: <MailIcon />,
} satisfies Record<ChannelId, ReactNode>;

export default function ManagedContactFab() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteContactSettings>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const orderIndex = useMemo(
    () => Object.fromEntries(settings.order.map((id, index) => [id, index + 1])) as Record<ChannelId, number>,
    [settings.order],
  );

  const availableChannels = channelIds.filter(
    (id) => settings.enabled[id] && Boolean(channelHref(settings, id)),
  );

  if (
    !loaded ||
    pathname.startsWith("/yonetim") ||
    pathname.startsWith("/giris") ||
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
                <strong>Berfin Akbaş</strong>
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
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9000;
          display: grid;
          justify-items: end;
          gap: 12px;
        }

        .managed-contact-fab .contact-fab-trigger {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border: 1px solid rgb(255 255 255 / 58%);
          border-radius: 50%;
          background: var(--coral);
          color: white;
          box-shadow: 0 16px 36px rgb(116 51 32 / 30%);
          cursor: pointer;
        }

        .managed-contact-fab .contact-fab-trigger svg {
          width: 27px;
          height: 27px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.8;
        }

        .managed-contact-fab .contact-fab-close {
          font-family: Arial, sans-serif;
          font-size: 2rem;
          font-weight: 300;
          line-height: 1;
        }

        .managed-contact-fab .contact-fab-menu {
          display: grid;
          width: 286px;
          overflow: hidden;
          border: 1px solid rgb(88 62 49 / 13%);
          border-radius: 24px;
          background: rgb(255 250 244 / 96%);
          box-shadow: 0 22px 60px rgb(54 37 28 / 22%);
          backdrop-filter: blur(22px);
        }

        .managed-contact-fab .contact-fab-heading {
          display: flex;
          justify-content: center;
          padding: 17px 18px 13px;
          border-bottom: 1px solid rgb(88 62 49 / 10%);
        }

        .managed-contact-fab .contact-fab-mini-brand {
          display: inline-flex;
          gap: 9px;
          align-items: center;
          font-family: var(--serif);
        }

        .managed-contact-fab .contact-fab-mini-brand .brand-symbol {
          width: 36px;
          height: 36px;
        }

        .managed-contact-fab .contact-fab-menu > a {
          display: grid;
          grid-template-columns: 1fr 36px;
          gap: 12px;
          align-items: center;
          padding: 11px 14px 11px 17px;
          border-bottom: 1px solid rgb(88 62 49 / 9%);
          color: var(--ink);
          font-size: 0.76rem;
          font-weight: 650;
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
          border-radius: 50%;
          background: rgb(217 111 77 / 13%);
          color: var(--coral-dark);
        }

        .managed-contact-fab .contact-fab-action-icon svg {
          width: 19px;
          height: 19px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.7;
        }

        .managed-contact-fab .contact-fab-action-icon svg .filled {
          fill: currentColor;
          stroke: none;
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
            right: 16px;
            bottom: 18px;
          }

          .managed-contact-fab .contact-fab-menu {
            width: auto;
            overflow: visible;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
          }

          .managed-contact-fab .contact-fab-heading {
            display: none;
          }

          .managed-contact-fab .contact-fab-menu > a {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 4px 0;
            border: 0;
          }

          .managed-contact-fab .contact-fab-label {
            max-width: 190px;
            border: 1px solid rgb(88 62 49 / 11%);
            border-radius: 10px;
            background: rgb(255 250 244 / 96%);
            padding: 8px 10px;
            box-shadow: 0 8px 22px rgb(54 37 28 / 16%);
            color: var(--ink);
            font-size: 0.68rem;
            text-align: right;
          }

          .managed-contact-fab .contact-fab-action-icon {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            background: var(--coral);
            color: white;
            box-shadow: 0 10px 24px rgb(116 51 32 / 25%);
          }

          .managed-contact-fab .contact-fab-trigger {
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </>
  );
}
