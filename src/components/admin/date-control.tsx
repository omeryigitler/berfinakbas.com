"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./date-control.module.css";

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
}

function formatValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayValue(value: string): string {
  if (!value) return "Tarih seçin";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(parseDate(value));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DateControl({
  defaultValue = "",
  disabled = false,
  name,
  onValueChange,
  required = false,
  value,
}: {
  defaultValue?: string;
  disabled?: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}) {
  const calendarId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const [open, setOpen] = useState(false);
  const initialDate = selectedValue ? parseDate(selectedValue) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialDate));
  const [focusedValue, setFocusedValue] = useState(() => formatValue(initialDate));

  const days = useMemo(() => {
    const firstWeekday = (visibleMonth.getDay() + 6) % 7;
    const count = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: count }, (_, index) => {
        const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
        return { day: index + 1, value: formatValue(date) };
      }),
    ];
  }, [visibleMonth]);

  useEffect(() => {
    if (!open) return;
    dayRefs.current.get(focusedValue)?.focus();
  }, [focusedValue, open, visibleMonth]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openCalendar() {
    if (disabled) return;
    const initial = selectedValue ? parseDate(selectedValue) : new Date();
    setFocusedValue(formatValue(initial));
    setVisibleMonth(startOfMonth(initial));
    setOpen(true);
  }

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    closeAndFocusTrigger();
  }

  function moveFocus(daysToAdd: number) {
    const current = parseDate(focusedValue);
    current.setDate(current.getDate() + daysToAdd);
    const nextValue = formatValue(current);
    setFocusedValue(nextValue);
    setVisibleMonth(startOfMonth(current));
  }

  function moveToWeekEdge(end: boolean) {
    const current = parseDate(focusedValue);
    const mondayIndex = (current.getDay() + 6) % 7;
    current.setDate(current.getDate() + (end ? 6 - mondayIndex : -mondayIndex));
    setFocusedValue(formatValue(current));
    setVisibleMonth(startOfMonth(current));
  }

  function moveMonth(delta: number) {
    const current = parseDate(focusedValue);
    const originalDay = current.getDate();
    const target = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(originalDay, lastDay));
    setFocusedValue(formatValue(target));
    setVisibleMonth(startOfMonth(target));
  }

  function onDayKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(-7);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(7);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveToWeekEdge(false);
    } else if (event.key === "End") {
      event.preventDefault();
      moveToWeekEdge(true);
    } else if (event.key === "PageUp") {
      event.preventDefault();
      moveMonth(-1);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      moveMonth(1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <input name={name} required={required} type="hidden" value={selectedValue} />
      <button
        aria-controls={calendarId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-required={required}
        className={styles.trigger}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openCalendar())}
        onKeyDown={(event) => {
          if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open) {
            event.preventDefault();
            openCalendar();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span>{displayValue(selectedValue)}</span>
        <span aria-hidden="true">▦</span>
      </button>
      {open ? (
        <div aria-label="Tarih seçici" className={styles.popover} id={calendarId} role="dialog">
          <div className={styles.header}>
            <button aria-label="Önceki ay" onClick={() => moveMonth(-1)} type="button">
              ‹
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
                visibleMonth,
              )}
            </strong>
            <button aria-label="Sonraki ay" onClick={() => moveMonth(1)} type="button">
              ›
            </button>
          </div>
          <div className={styles.weekdays} aria-hidden="true">
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.days} role="grid">
            {days.map((entry, index) =>
              entry ? (
                <button
                  aria-label={displayValue(entry.value)}
                  aria-pressed={selectedValue === entry.value}
                  key={entry.value}
                  onClick={() => selectValue(entry.value)}
                  onFocus={() => setFocusedValue(entry.value)}
                  onKeyDown={onDayKeyDown}
                  ref={(element) => {
                    if (element) dayRefs.current.set(entry.value, element);
                    else dayRefs.current.delete(entry.value);
                  }}
                  role="gridcell"
                  tabIndex={focusedValue === entry.value ? 0 : -1}
                  type="button"
                >
                  {entry.day}
                </button>
              ) : (
                <span aria-hidden="true" key={`empty-${index}`} />
              ),
            )}
          </div>
          <button
            className={styles.today}
            onClick={() => {
              const now = new Date();
              setVisibleMonth(startOfMonth(now));
              setFocusedValue(formatValue(now));
              selectValue(formatValue(now));
            }}
            type="button"
          >
            Bugün
          </button>
        </div>
      ) : null}
    </div>
  );
}
