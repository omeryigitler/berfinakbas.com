"use client";

import { FormEvent, useRef } from "react";

import { SelectControl } from "./select-control";

export function ClientFilterForm({
  query,
  status,
  statusOptions,
  type,
  typeOptions,
}: {
  query: string;
  status: string;
  statusOptions: { label: string; value: string }[];
  type: string;
  typeOptions: { label: string; value: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();
    const nextQuery = String(data.get("q") ?? "").trim();
    const nextStatus = String(data.get("status") ?? "ALL");
    const nextType = String(data.get("type") ?? "ALL");

    if (nextQuery) params.set("q", nextQuery);
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextType !== "ALL") params.set("type", nextType);

    const queryString = params.toString();
    window.location.assign(queryString ? `/yonetim/danisanlar?${queryString}` : "/yonetim/danisanlar");
  }

  return (
    <form className="admin-filter-form" method="get" onSubmit={submit} ref={formRef}>
      <label className="booking-field">
        Arama
        <input defaultValue={query} name="q" placeholder="Ad, soyad, telefon veya e-posta" type="search" />
      </label>
      <label className="booking-field">
        Statü
        <SelectControl defaultValue={status} name="status" options={statusOptions} />
      </label>
      <label className="booking-field">
        Danışan tipi
        <SelectControl defaultValue={type} name="type" options={typeOptions} />
      </label>
      <div className="admin-filter-actions">
        <button className="secondary-button" type="submit">
          Filtrele
        </button>
      </div>
    </form>
  );
}
