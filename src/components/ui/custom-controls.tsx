"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

type CustomSelectProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function Check() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="none">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 2.8v3.4M13.5 2.8v3.4M3.5 8h13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d={direction === "left" ? "m12.5 4.5-5 5.5 5 5.5" : "m7.5 4.5 5 5.5-5 5.5"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CustomSelect({
  className = "",
  defaultValue = "",
  disabled,
  name,
  onChange,
  options,
  placeholder = "Seçiniz",
  required,
  value,
}: CustomSelectProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentValue = controlled ? value : internalValue;
  const selected = options.find((option) => option.value === currentValue);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function choose(nextValue: string) {
    if (!controlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={`custom-control custom-select relative w-full ${className}`}>
      {name ? <input name={name} type="hidden" value={currentValue} /> : null}
      {required ? (
        <input
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
          onChange={() => undefined}
          required
          tabIndex={-1}
          value={currentValue}
        />
      ) : null}
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="custom-control-trigger flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-[10px] font-bold text-gray-800 outline-none transition focus:border-black/30 disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div
          className="custom-control-popover absolute left-0 right-0 z-[220] mt-1 max-h-64 overflow-auto rounded-xl border border-black/10 bg-white p-1.5 shadow-2xl"
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={currentValue === option.value}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold transition hover:bg-[#eff9b0] disabled:cursor-not-allowed disabled:opacity-40 ${
                currentValue === option.value ? "bg-black text-[#eafda8]" : "text-gray-700"
              }`}
              disabled={option.disabled}
              key={option.value}
              onClick={() => choose(option.value)}
              role="option"
              type="button"
            >
              <span className="truncate">{option.label}</span>
              {currentValue === option.value ? <Check /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CustomDatePickerProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  max?: string;
  min?: string;
  name?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  value?: string;
};

const pad = (value: number) => String(value).padStart(2, "0");
const toIsoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseIsoDay = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();

export function CustomDatePicker({
  className = "",
  defaultValue = "",
  disabled,
  max,
  min,
  name,
  onChange,
  required,
  value,
}: CustomDatePickerProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const currentValue = controlled ? value : internalValue;
  const [month, setMonth] = useState(() => {
    const initial = parseIsoDay(currentValue || defaultValue);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (!currentValue) return;
    const next = parseIsoDay(currentValue);
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [currentValue]);

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const leadingEmpty = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [month]);

  function choose(day: number) {
    const nextValue = toIsoDay(new Date(month.getFullYear(), month.getMonth(), day));
    if ((min && nextValue < min) || (max && nextValue > max)) return;
    if (!controlled) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const display = currentValue
    ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(
        parseIsoDay(currentValue),
      )
    : "Tarih seçiniz";

  return (
    <div ref={rootRef} className={`custom-control custom-date-picker relative w-full ${className}`}>
      {name ? <input name={name} type="hidden" value={currentValue} /> : null}
      {required ? (
        <input
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
          onChange={() => undefined}
          required
          tabIndex={-1}
          value={currentValue}
        />
      ) : null}
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="custom-control-trigger flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-[10px] font-bold text-gray-800 outline-none transition focus:border-black/30 disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{display}</span>
        <CalendarIcon />
      </button>
      {open ? (
        <div
          aria-label="Tarih seçici"
          className="custom-control-popover absolute left-0 right-0 z-[220] mt-1 rounded-xl border border-black/10 bg-white p-3 shadow-2xl"
          role="dialog"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              aria-label="Önceki ay"
              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              type="button"
            >
              <Arrow direction="left" />
            </button>
            <strong className="text-center text-[10px] font-black capitalize text-gray-900">
              {new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(month)}
            </strong>
            <button
              aria-label="Sonraki ay"
              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              type="button"
            >
              <Arrow direction="right" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((label) => (
              <span className="py-1 text-[7px] font-black text-gray-400" key={label}>
                {label}
              </span>
            ))}
            {days.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} />;
              const candidate = toIsoDay(new Date(month.getFullYear(), month.getMonth(), day));
              const blocked = Boolean((min && candidate < min) || (max && candidate > max));
              return (
                <button
                  aria-current={candidate === currentValue ? "date" : undefined}
                  className={`aspect-square rounded-lg text-[9px] font-bold transition disabled:cursor-not-allowed disabled:text-gray-300 ${
                    candidate === currentValue ? "bg-black text-[#eafda8]" : "text-gray-800 hover:bg-[#eff9b0]"
                  }`}
                  disabled={blocked}
                  key={candidate}
                  onClick={() => choose(day)}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
