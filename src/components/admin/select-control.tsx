"use client";

import { useEffect, useId, useRef, useState } from "react";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

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

  function openAt(index: number) {
    if (disabled || options.length === 0) return;
    setActiveIndex(Math.min(Math.max(index, 0), options.length - 1));
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

  function moveActive(delta: number) {
    if (options.length === 0) return;
    setActiveIndex((current) => (current + delta + options.length) % options.length);
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openAt(open ? activeIndex + 1 : selectedIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(open ? activeIndex - 1 : selectedIndex);
    } else if (event.key === "Home") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      openAt(options.length - 1);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  function onOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    option: SelectControlOption,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectValue(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <input hidden name={name} readOnly required={required} type="text" value={selectedValue} />
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
        className={styles.trigger}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={onTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>
      {open ? (
        <div className={styles.listbox} id={listboxId} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={selectedValue === option.value}
              className={styles.option}
              id={`${listboxId}-option-${index}`}
              key={`${name}-${option.value}`}
              onClick={() => selectValue(option.value)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => onOptionKeyDown(event, option)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="option"
              tabIndex={index === activeIndex ? 0 : -1}
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
