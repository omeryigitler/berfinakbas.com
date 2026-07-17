"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./select-control.module.css";

export type SelectControlOption = {
  label: string;
  value: string;
};

const SEARCH_THRESHOLD = 12;

function normalizedSearch(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

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
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const searchable = options.length > SEARCH_THRESHOLD;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizedSearch(query);
    if (!normalizedQuery) return options;
    return options.filter((option) => normalizedSearch(option.label).includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function focusOption(index: number) {
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function openList() {
    if (disabled || options.length === 0) return;
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === selectedValue),
    );
    setQuery("");
    setActiveIndex(selectedIndex);
    setOpen(true);
    requestAnimationFrame(() => {
      if (searchable) searchRef.current?.focus();
      else optionRefs.current[selectedIndex]?.focus();
    });
  }

  function closeAndFocusTrigger() {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function selectValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    closeAndFocusTrigger();
  }

  function moveActive(delta: number) {
    if (filteredOptions.length === 0) return;
    const next = (activeIndex + delta + filteredOptions.length) % filteredOptions.length;
    setActiveIndex(next);
    focusOption(next);
  }

  function moveTo(index: number) {
    if (filteredOptions.length === 0) return;
    const next = Math.min(Math.max(index, 0), filteredOptions.length - 1);
    setActiveIndex(next);
    focusOption(next);
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!open) openList();
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveTo(filteredOptions.length - 1);
    } else if (event.key === "Enter" && filteredOptions[0]) {
      event.preventDefault();
      selectValue(filteredOptions[0].value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
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
      moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(filteredOptions.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectValue(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
    } else if (searchable && event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      searchRef.current?.focus();
      setQuery(event.key);
      setActiveIndex(0);
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
        onClick={() => (open ? closeAndFocusTrigger() : openList())}
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
        <div className={styles.popover}>
          {searchable ? (
            <div className={styles.searchWrap}>
              <label className={styles.searchLabel} htmlFor={searchId}>
                Seçeneklerde ara
              </label>
              <input
                aria-controls={listboxId}
                autoComplete="off"
                className={styles.searchInput}
                id={searchId}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Ad, telefon veya e-posta ara"
                ref={searchRef}
                type="search"
                value={query}
              />
            </div>
          ) : null}
          <div className={styles.listbox} id={listboxId} role="listbox">
            {filteredOptions.length === 0 ? (
              <p className={styles.noResults} role="status">
                Eşleşen seçenek bulunamadı.
              </p>
            ) : (
              filteredOptions.map((option, index) => (
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
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
