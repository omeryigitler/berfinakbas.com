"use client";

import { useMemo, useState } from "react";

type FinanceDateControlProps = {
  disabled?: boolean;
  name: string;
  onValueChange: (value: string) => void;
  value: string;
};

function isoDay(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .slice(0, 10);
}

function dateFromIsoDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function readableDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(dateFromIsoDay(value));
}

export function FinanceDateControl({
  disabled = false,
  name,
  onValueChange,
  value,
}: FinanceDateControlProps) {
  const [open, setOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() => dateFromIsoDay(value));

  const days = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [monthDate]);

  function changeMonth(delta: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function choose(date: Date) {
    onValueChange(isoDay(date));
    setOpen(false);
  }

  return (
    <div className="finance-date-picker">
      <input name={name} type="hidden" value={value} />
      <button disabled={disabled} onClick={() => setOpen((current) => !current)} type="button">
        {readableDate(value)}
      </button>
      {open ? (
        <div className="finance-calendar">
          <div className="finance-calendar-header">
            <button onClick={() => changeMonth(-1)} type="button">
              Geri
            </button>
            <strong>
              {new Intl.DateTimeFormat("tr-TR", {
                month: "long",
                year: "numeric",
              }).format(monthDate)}
            </strong>
            <button onClick={() => changeMonth(1)} type="button">
              İleri
            </button>
          </div>
          <div className="finance-calendar-weekdays">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span>Cmt</span>
            <span>Paz</span>
          </div>
          <div className="finance-calendar-grid">
            {days.map((date, index) =>
              date ? (
                <button
                  className={isoDay(date) === value ? "selected" : undefined}
                  key={isoDay(date)}
                  onClick={() => choose(date)}
                  type="button"
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`gap-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
