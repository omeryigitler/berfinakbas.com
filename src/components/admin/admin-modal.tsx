"use client";

import type { ReactNode } from "react";

export function AdminModal({
  children,
  description,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      role="presentation"
      style={{
        alignItems: "center",
        background: "rgb(55 38 31 / 42%)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: 18,
        position: "fixed",
        zIndex: 100,
      }}
    >
      <div
        aria-labelledby="admin-modal-title"
        aria-modal="true"
        role="dialog"
        style={{
          background: "#fffaf4",
          border: "1px solid rgb(217 111 77 / 25%)",
          borderRadius: 24,
          boxShadow: "0 35px 80px rgb(60 38 28 / 28%)",
          maxWidth: 560,
          padding: 28,
          position: "relative",
          width: "min(100%, 560px)",
        }}
      >
        <div>
          <p className="section-kicker">İşlem onayı</p>
          <h2
            id="admin-modal-title"
            style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", margin: 0 }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.7 }}>{description}</p>
          ) : null}
        </div>
        {children}
        <button
          aria-label="Modalı kapat"
          onClick={onClose}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 999,
            background: "#fff1e7",
            color: "var(--coral-dark)",
            cursor: "pointer",
            font: "inherit",
            fontSize: "0.68rem",
            fontWeight: 800,
            padding: "7px 11px",
            position: "absolute",
            right: 18,
            top: 18,
          }}
          type="button"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
