import type { ReactNode } from 'react';

export type SalesHubIconName =
  | 'archive'
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'card'
  | 'check'
  | 'clock'
  | 'credit-card'
  | 'document'
  | 'edit'
  | 'file-down'
  | 'filter'
  | 'grid'
  | 'help'
  | 'history'
  | 'home'
  | 'insight'
  | 'lock'
  | 'mail'
  | 'message'
  | 'more'
  | 'phone'
  | 'plus'
  | 'refresh'
  | 'report'
  | 'search'
  | 'settings'
  | 'shield'
  | 'sort'
  | 'support'
  | 'trash'
  | 'user-plus'
  | 'users'
  | 'waffle'
  | 'workflow'
  | 'x';

export function SalesHubIcon({ name, size = 17 }: { name: SalesHubIconName; size?: number }) {
  const common = {
    fill: 'none',
    height: size,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
    viewBox: '0 0 24 24',
    width: size,
  };

  const paths: Record<SalesHubIconName, ReactNode> = {
    archive: (
      <>
        <path d="M4 7h16v13H4z" />
        <path d="M3 4h18v3H3zM9 11h6" />
      </>
    ),
    'arrow-left': (
      <>
        <path d="M15 18l-6-6 6-6" />
        <path d="M9 12h10" />
      </>
    ),
    'arrow-right': (
      <>
        <path d="M9 18l6-6-6-6" />
        <path d="M5 12h10" />
      </>
    ),
    calendar: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="5" />
        <path d="M8 3v4m8-4v4M3 10h18" />
      </>
    ),
    card: (
      <>
        <rect height="15" rx="2" width="19" x="2.5" y="5" />
        <path d="M2.5 10h19M6 15h4" />
      </>
    ),
    check: <path d="M5 12l4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    'credit-card': (
      <>
        <rect height="15" rx="2" width="19" x="2.5" y="5" />
        <path d="M2.5 10h19M6 15h4" />
      </>
    ),
    document: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6m-6 4h6" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
      </>
    ),
    'file-down': (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M12 11v7m-3-3l3 3 3-3" />
      </>
    ),
    filter: <path d="M3 5h18l-7 8v5l-4 2v-7z" />,
    grid: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <rect height="7" rx="1" width="7" x="14" y="14" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 114.2 1.6c-.9.8-1.9 1.2-1.9 2.7M12 17h.01" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 109-9 9.5 9.5 0 00-6.7 2.8L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    home: (
      <>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    insight: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M8.5 14.5A6 6 0 1115.5 14.5c-.9.8-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.7-1.5-2.5z" />
      </>
    ),
    lock: (
      <>
        <rect height="10" rx="2" width="14" x="5" y="11" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </>
    ),
    mail: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
    message: <path d="M4 5h16v12H8l-4 4z" />,
    more: (
      <>
        <circle cx="5" cy="12" fill="currentColor" r="1" stroke="none" />
        <circle cx="12" cy="12" fill="currentColor" r="1" stroke="none" />
        <circle cx="19" cy="12" fill="currentColor" r="1" stroke="none" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0122 16.9z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 10-2 5" />
      </>
    ),
    report: <path d="M4 20V10m5 10V4m5 16v-7m5 7V7" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.2h-4V21a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H2.8v-4H3a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3V2.8h4V3a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1h.2v4H21a1.7 1.7 0 00-1.6 1z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    sort: <path d="M8 6h10M8 12h7M8 18h4M4 4v16m0 0l-2-2m2 2l2-2" />,
    support: (
      <>
        <path d="M4 14v-2a8 8 0 0116 0v2" />
        <path d="M4 14h3v6H5a2 2 0 01-2-2v-2a2 2 0 012-2zm16 0h-3v6h2a2 2 0 002-2v-2a2 2 0 00-2-2z" />
      </>
    ),
    trash: <path d="M3 6h18M8 6V4h8v2m-9 0l1 15h8l1-15M10 10v7m4-7v7" />,
    'user-plus': (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c0-4 3-7 7-7 2.2 0 4.2 1 5.5 2.5M18 8v6m-3-3h6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c0-4 3-7 7-7s7 3 7 7M16 5a4 4 0 010 7m2 3c2.4.7 4 2.8 4 6" />
      </>
    ),
    waffle: (
      <>
        {[4, 10, 16].flatMap((x) =>
          [4, 10, 16].map((y) => (
            <rect
              fill="currentColor"
              height="3"
              key={`${x}-${y}`}
              rx=".5"
              stroke="none"
              width="3"
              x={x}
              y={y}
            />
          )),
        )}
      </>
    ),
    workflow: (
      <>
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M8 6h8M7 8l4 8m6-8l-4 8" />
      </>
    ),
    x: <path d="M6 6l12 12M18 6L6 18" />,
  };

  return (
    <svg aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
