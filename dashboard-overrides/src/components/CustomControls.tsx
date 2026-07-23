import { useEffect, useMemo, useRef, useState } from 'react';

export interface CustomOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export function CustomSelect({
  disabled,
  onChange,
  options,
  placeholder = 'Seçiniz',
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  options: CustomOption[];
  placeholder?: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-[10px] font-bold text-gray-800 outline-none transition focus:border-black/30 disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span aria-hidden="true" className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-[240] mt-1 max-h-64 overflow-auto rounded-xl border border-black/10 bg-white p-1.5 shadow-2xl" role="listbox">
          {options.map((option) => (
            <button
              aria-selected={value === option.value}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold transition hover:bg-[#eff9b0] disabled:cursor-not-allowed disabled:opacity-40 ${
                value === option.value ? 'bg-black text-[#eafda8]' : 'text-gray-700'
              }`}
              disabled={option.disabled}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span className="truncate">{option.label}</span>
              {value === option.value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseIsoDay = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();

export function CustomDatePicker({
  disabled,
  max,
  min,
  onChange,
  value,
}: {
  disabled?: boolean;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = parseIsoDay(value);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const next = parseIsoDay(value);
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const leading = (first.getDay() + 6) % 7;
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array.from({ length: leading }, () => null), ...Array.from({ length: total }, (_, index) => index + 1)];
  }, [month]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-left text-[10px] font-bold text-gray-800 outline-none transition focus:border-black/30 disabled:opacity-45"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{value ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(parseIsoDay(value)) : 'Tarih seçiniz'}</span>
        <span aria-hidden="true">▣</span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-[240] mt-1 rounded-xl border border-black/10 bg-white p-3 shadow-2xl" role="dialog">
          <div className="mb-3 flex items-center justify-between">
            <button className="grid h-8 w-8 place-items-center rounded-full border border-black/10" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} type="button">‹</button>
            <strong className="text-[10px] font-black capitalize">{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(month)}</strong>
            <button className="grid h-8 w-8 place-items-center rounded-full border border-black/10" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} type="button">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((label) => <span className="py-1 text-[7px] font-black text-gray-400" key={label}>{label}</span>)}
            {days.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} />;
              const candidate = toIsoDay(new Date(month.getFullYear(), month.getMonth(), day));
              const blocked = Boolean((min && candidate < min) || (max && candidate > max));
              return (
                <button
                  className={`aspect-square rounded-lg text-[9px] font-bold transition disabled:text-gray-300 ${candidate === value ? 'bg-black text-[#eafda8]' : 'hover:bg-[#eff9b0]'}`}
                  disabled={blocked}
                  key={candidate}
                  onClick={() => {
                    onChange(candidate);
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
      ) : null}
    </div>
  );
}
