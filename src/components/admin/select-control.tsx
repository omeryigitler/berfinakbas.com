"use client";

import { useId, useState } from "react";

import styles from "./select-control.module.css";

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
  const listboxId = useId();
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
    <div className={styles.root}>
      <input hidden name={name} readOnly required={required} type="text" value={selectedValue} />
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.trigger}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>
      {open ? (
        <div className={styles.listbox} id={listboxId} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={selectedValue === option.value}
              className={styles.option}
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
