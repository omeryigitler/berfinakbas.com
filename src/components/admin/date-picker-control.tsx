"use client";

import { useMemo, useState } from "react";

const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });
const weekdayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function calendarDays(monthDate: Date): Date[] {
  const firstDay = startOfMonth(monthDate);
  const firstWeekday = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(firstDay.getUTCDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(gridStart.getUTCDate() + index);
    return day;
  });
}

export function DatePickerControl({
  disabled = false,
  name,
  onValueChange,
  placeholder = "Tarih seçin",
  required = false,
  value,
}: {
  disabled?: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  const [selectedValue, setSelectedValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(parseIsoDate(value) ?? new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))),
  );

  const selectedDate = parseIsoDate(selectedValue);
  const days = calendarDays(visibleMonth);

  function selectDate(date: Date) {
    const nextValue = toIsoDate(date);
    setSelectedValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  function clearDate() {
    setSelectedValue("");
    onValueChange?.("");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        aria-hidden="true"
        name={name}
        readOnly
        required={required}
        style={{ height: 1, left: 10, opacity: 0, position: "absolute", top: 10, width: 1 }}
        tabIndex={-1}
        value={selectedValue}
      />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        style={{
          alignItems: "center",
          background: "#fffdf9",
          border: "1px solid rgb(88 62 49 / 20%)",
          borderRadius: 11,
          color: "var(--ink)",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          font: "inherit",
          fontSize: "0.72rem",
          gap: 12,
          justifyContent: "space-between",
          minHeight: 42,
          opacity: disabled ? 0.58 : 1,
          padding: "9px 12px",
          textAlign: "left",
          width: "100%",
        }}
        type="button"
      >
        <span>{selectedDate ? dayFormatter.format(selectedDate) : placeholder}</span>
        <span aria-hidden="true" style={{ color: "var(--coral-dark)", fontSize: "0.85rem" }}>
          ▾
        </span>
      </button>
      {open ? (
        <div
          aria-label="Tarih seçimi"
          role="dialog"
          style={{
            background: "#fffaf4",
            border: "1px solid rgb(217 111 77 / 25%)",
            borderRadius: 16,
            boxShadow: "0 22px 44px rgb(83 53 35 / 14%)",
            left: 0,
            padding: 12,
            position: "absolute",
            right: 0,
            top: "calc(100% + 7px)",
            zIndex: 80,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button onClick={() => setVisibleMonth((current) => addMonths(current, -1))} type="button">
              ‹
            </button>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "1rem" }}>
              {monthFormatter.format(visibleMonth)}
            </strong>
            <button onClick={() => setVisibleMonth((current) => addMonths(current, 1))} type="button">
              ›
            </button>
          </div>
          <div
            style={{
              color: "var(--muted)",
              display: "grid",
              fontSize: "0.62rem",
              fontWeight: 800,
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
            }}
          >
            {weekdayNames.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(7, 1fr)", marginTop: 8 }}>
            {days.map((day) => {
              const isoDate = toIsoDate(day);
              const outsideMonth = day.getUTCMonth() !== visibleMonth.getUTCMonth();
              const selected = isoDate === selectedValue;
              const isToday = isoDate === todayIso;
              return (
                <button
                  key={isoDate}
                  onClick={() => selectDate(day)}
                  style={{
                    background: selected ? "var(--coral)" : isToday ? "#fff1e7" : "transparent",
                    border: selected ? "1px solid var(--coral)" : "1px solid transparent",
                    borderRadius: 10,
                    color: selected ? "white" : outsideMonth ? "#b8a89e" : "var(--ink)",
                    cursor: "pointer",
                    font: "inherit",
                    fontSize: "0.72rem",
                    fontWeight: selected ? 850 : 700,
                    minHeight: 34,
                  }}
                  type="button"
                >
                  {day.getUTCDate()}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={clearDate} type="button">
              Temizle
            </button>
            <button onClick={() => setOpen(false)} type="button">
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
