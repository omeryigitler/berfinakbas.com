"use client";

import type { ReactNode } from "react";

export function FinanceActionPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="finance-action-overlay">
      <div className="finance-action-panel">
        <p className="section-kicker">Finans işlemi</p>
        <h2>{title}</h2>
        <p>İşlem bu pencerede tamamlanır.</p>
        {children}
      </div>
    </div>
  );
}
