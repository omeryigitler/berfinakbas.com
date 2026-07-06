"use client";

import type { FormEvent } from "react";

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
    <form
      method="get"
      onSubmit={submit}
      style={{
        alignItems: "end",
        display: "grid",
        gap: 17,
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        marginTop: 24,
      }}
    >
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
      <button className="secondary-button" style={{ minWidth: 118 }} type="submit">
        Filtrele
      </button>
    </form>
  );
}
