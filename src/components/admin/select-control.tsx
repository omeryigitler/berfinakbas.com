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
    <div className="admin-select-control">
      <input hidden name={name} readOnly required={required} type="text" value={selectedValue} />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="admin-select-control-trigger"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" className="admin-select-control-icon">
          ▾
        </span>
      </button>
      {open ? (
        <div className="admin-select-control-menu" role="listbox">
          {options.map((option) => (
            <button
              aria-selected={selectedValue === option.value}
              className="admin-select-control-option"
              key={`${name}-${option.value}`}
              onClick={() => selectValue(option.value)}
              role="option"
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
