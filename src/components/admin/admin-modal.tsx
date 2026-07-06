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
    <div className="admin-modal-backdrop" role="presentation">
      <div aria-labelledby="admin-modal-title" aria-modal="true" className="admin-modal" role="dialog">
        <div className="admin-modal-heading">
          <p className="section-kicker">İşlem onayı</p>
          <h2 id="admin-modal-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {children}
        <button aria-label="Modalı kapat" className="admin-modal-close" onClick={onClose} type="button">
          Kapat
        </button>
      </div>
    </div>
  );
}
