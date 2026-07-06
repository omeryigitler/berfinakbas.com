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
    <div className="admin-date-picker">
      <input
        aria-hidden="true"
        name={name}
        readOnly
        required={required}
        tabIndex={-1}
        value={selectedValue}
      />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="admin-date-picker-trigger"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedDate ? dayFormatter.format(selectedDate) : placeholder}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div aria-label="Tarih seçimi" className="admin-date-picker-popover" role="dialog">
          <div className="admin-date-picker-header">
            <button onClick={() => setVisibleMonth((current) => addMonths(current, -1))} type="button">
              ‹
            </button>
            <strong>{monthFormatter.format(visibleMonth)}</strong>
            <button onClick={() => setVisibleMonth((current) => addMonths(current, 1))} type="button">
              ›
            </button>
          </div>
          <div className="admin-date-picker-weekdays">
            {weekdayNames.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="admin-date-picker-grid">
            {days.map((day) => {
              const isoDate = toIsoDate(day);
              const outsideMonth = day.getUTCMonth() !== visibleMonth.getUTCMonth();
              const selected = isoDate === selectedValue;
              return (
                <button
                  className={`${outsideMonth ? "is-outside" : ""}${selected ? " is-selected" : ""}${isoDate === todayIso ? " is-today" : ""}`}
                  key={isoDate}
                  onClick={() => selectDate(day)}
                  type="button"
                >
                  {day.getUTCDate()}
                </button>
              );
            })}
          </div>
          <div className="admin-date-picker-actions">
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
