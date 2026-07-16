"use client";

import Link from "next/link";

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
  return (
    <form
      action="/yonetim/danisanlar"
      method="get"
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
        <input
          defaultValue={query}
          name="q"
          placeholder="Ad, soyad, telefon veya e-posta"
          type="search"
        />
      </label>
      <label className="booking-field">
        Statü
        <SelectControl defaultValue={status} name="status" options={statusOptions} />
      </label>
      <label className="booking-field">
        Danışan tipi
        <SelectControl defaultValue={type} name="type" options={typeOptions} />
      </label>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        <button className="secondary-button" style={{ minWidth: 118 }} type="submit">
          Filtrele
        </button>
        {query || status !== "ALL" || type !== "ALL" ? (
          <Link className="admin-back-link" href="/yonetim/danisanlar">
            Temizle
          </Link>
        ) : null}
      </div>
    </form>
  );
}
