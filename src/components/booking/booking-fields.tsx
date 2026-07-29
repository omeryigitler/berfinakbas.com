"use client";

import { useEffect, useId, useRef, useState } from "react";

export type BookingSelectOption = { label: string; value: string };

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

// Monday-first weekday headers, matching the native picker order the site used before.
const WEEKDAY_HEADERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function useDismiss(open: boolean, close: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return containerRef;
}

function CaretIcon() {
  return (
    <svg aria-hidden="true" className="booking-control-caret" viewBox="0 0 24 24">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

/**
 * Themed replacement for a native `<select>`: the closed field keeps the exact
 * `.booking-field` look, and the option list is rendered in the site's palette
 * instead of the browser's OS popup. When `name` is set it mirrors the value into
 * a hidden input so uncontrolled `FormData` submits keep working unchanged.
 */
export function BookingSelect({
  disabled = false,
  label,
  name,
  onChange,
  options,
  placeholder = "Seçin",
  required = false,
  value,
}: {
  disabled?: boolean;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  options: BookingSelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const containerRef = useDismiss(open, () => setOpen(false));
  const selected = options.find((option) => option.value === value) ?? null;

  function pick(next: string) {
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className="booking-control" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="booking-control-trigger"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        <span className={selected ? "" : "booking-control-placeholder"}>
          {selected?.label ?? placeholder}
        </span>
        {!disabled && <CaretIcon />}
      </button>

      {open && !disabled && (
        <ul className="booking-control-menu" id={listId} role="listbox" aria-label={label}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  aria-selected={active}
                  className={active ? "booking-option booking-option--active" : "booking-option"}
                  onClick={() => pick(option.value)}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {active && (
                    <svg aria-hidden="true" className="booking-option-check" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {name && <input name={name} required={required} type="hidden" value={value} />}
    </div>
  );
}

function toParts(iso: string): { day: number; month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { day: Number(match[3]), month: Number(match[2]) - 1, year: Number(match[1]) };
}

function toIso(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatDisplay(iso: string): string {
  const parts = toParts(iso);
  if (!parts) return "";
  return `${parts.day} ${MONTH_NAMES[parts.month]} ${parts.year}`;
}

// Monday-first index (0 = Monday … 6 = Sunday) for the 1st of the given month.
function firstWeekdayOffset(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

/**
 * Themed replacement for `<input type="date">`: the closed field keeps the exact
 * `.booking-field` look, and the calendar is rendered in the site's palette rather
 * than the OS popup. Emits and stores values as `YYYY-MM-DD`, so the surrounding
 * booking flow (min date, "load slots") keeps its existing contract.
 */
export function BookingDatePicker({
  label,
  min,
  name,
  onChange,
  required = false,
  value,
}: {
  label: string;
  min?: string;
  name?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useDismiss(open, () => setOpen(false));

  const today = toParts(value) ?? toParts(min ?? "") ?? { day: 1, month: 0, year: 2026 };
  const [view, setView] = useState({ month: today.month, year: today.year });

  function openCalendar() {
    const anchor = toParts(value) ?? toParts(min ?? "");
    if (anchor) setView({ month: anchor.month, year: anchor.year });
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { month: next.getMonth(), year: next.getFullYear() };
    });
  }

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leading = firstWeekdayOffset(view.year, view.month);
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_unused, index) => index + 1),
  ];

  return (
    <div className="booking-control" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className="booking-control-trigger"
        onClick={() => (open ? setOpen(false) : openCalendar())}
        type="button"
      >
        <span className={value ? "" : "booking-control-placeholder"}>
          {value ? formatDisplay(value) : "Tarih seçin"}
        </span>
        <svg aria-hidden="true" className="booking-control-caret" viewBox="0 0 24 24">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        </svg>
      </button>

      {open && (
        <div className="booking-calendar" role="dialog" aria-label={label}>
          <div className="booking-calendar-head">
            <button
              aria-label="Önceki ay"
              className="booking-calendar-nav"
              onClick={() => shiftMonth(-1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m14 7-5 5 5 5" />
              </svg>
            </button>
            <strong>
              {MONTH_NAMES[view.month]} {view.year}
            </strong>
            <button
              aria-label="Sonraki ay"
              className="booking-calendar-nav"
              onClick={() => shiftMonth(1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m10 7 5 5-5 5" />
              </svg>
            </button>
          </div>

          <div className="booking-calendar-weekdays" aria-hidden="true">
            {WEEKDAY_HEADERS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="booking-calendar-grid">
            {cells.map((day, index) => {
              if (day === null) return <span key={`pad-${index}`} />;
              const iso = toIso(view.year, view.month, day);
              const disabled = min ? iso < min : false;
              const selected = iso === value;
              return (
                <button
                  aria-label={formatDisplay(iso)}
                  aria-pressed={selected}
                  className={selected ? "booking-day booking-day--selected" : "booking-day"}
                  disabled={disabled}
                  key={iso}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {name && <input name={name} required={required} type="hidden" value={value} />}
    </div>
  );
}
