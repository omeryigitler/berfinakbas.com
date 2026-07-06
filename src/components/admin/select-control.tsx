"use client";

import { useState } from "react";

export type SelectControlOption = {
  label: string;
  value: string;
};

export function SelectControl({
  defaultValue = "",
  disabled = false,
  name,
  onValueChange,
  options,
  placeholder = "Seçin",
  required = false,
  value,
}: {
  defaultValue?: string;
  disabled?: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  options: SelectControlOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  function selectValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input hidden name={name} readOnly required={required} type="text" value={selectedValue} />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
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
        <span>{selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" style={{ color: "var(--coral-dark)", fontSize: "0.85rem" }}>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          style={{
            background: "#fffaf4",
            border: "1px solid rgb(217 111 77 / 25%)",
            borderRadius: 14,
            boxShadow: "0 22px 44px rgb(83 53 35 / 14%)",
            left: 0,
            overflow: "hidden",
            padding: 6,
            position: "absolute",
            right: 0,
            top: "calc(100% + 7px)",
            zIndex: 60,
          }}
        >
          {options.map((option) => (
            <button
              aria-selected={selectedValue === option.value}
              key={`${name}-${option.value}`}
              onClick={() => selectValue(option.value)}
              role="option"
              style={{
                background: selectedValue === option.value ? "#fff1e7" : "transparent",
                border: 0,
                borderRadius: 10,
                color: selectedValue === option.value ? "var(--coral-dark)" : "var(--ink)",
                cursor: "pointer",
                display: "block",
                font: "inherit",
                fontSize: "0.72rem",
                padding: "10px 11px",
                textAlign: "left",
                width: "100%",
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
