"use client";

import type { ReactNode } from "react";

export function FinanceActionPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="finance-action-panel">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
