"use client";

import { useMemo, useState } from "react";

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
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selectedValue ? parseDate(selectedValue) : new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const days = useMemo(() => {
    const firstWeekday = (visibleMonth.getDay() + 6) % 7;
    const count = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  function selectDay(day: number) {
    const nextValue = formatValue(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
    );
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={styles.root}>
      <input name={name} required={required} type="hidden" value={selectedValue} />
      <button
        aria-expanded={open}
        className={styles.trigger}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{displayValue(selectedValue)}</span>
        <span aria-hidden="true">▦</span>
      </button>
      {open ? (
        <div className={styles.popover}>
          <div className={styles.header}>
            <button
              aria-label="Önceki ay"
              onClick={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              type="button"
            >
              ‹
            </button>
            <strong>
              {new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(
                visibleMonth,
              )}
            </strong>
            <button
              aria-label="Sonraki ay"
              onClick={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              type="button"
            >
              ›
            </button>
          </div>
          <div className={styles.weekdays}>
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.days}>
            {days.map((day, index) =>
              day ? (
                <button
                  aria-pressed={
                    selectedValue ===
                    formatValue(
                      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
                    )
                  }
                  key={day}
                  onClick={() => selectDay(day)}
                  type="button"
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
          <button
            className={styles.today}
            onClick={() => {
              const now = new Date();
              setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              selectDay(now.getDate());
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
