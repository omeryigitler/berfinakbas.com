"use client";

import { useState } from "react";

import { FinanceActionPanel } from "./finance-action-panel";

type ModalKey = "METHOD" | "PLAN" | "PAYMENT" | null;

const titles = {
  METHOD: "Ödeme yöntemi ekle",
  PAYMENT: "Ödeme kaydet",
  PLAN: "Danışan planı oluştur",
};

export function FinanceActionLauncher() {
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <div className="finance-modal-launcher">
      <div className="finance-operation-grid finance-operation-grid--buttons">
        <button onClick={() => setModal("METHOD")} type="button">
          Ödeme yöntemi ekle
        </button>
        <button onClick={() => setModal("PLAN")} type="button">
          Danışan planı oluştur
        </button>
        <button onClick={() => setModal("PAYMENT")} type="button">
          Ödeme kaydet
        </button>
      </div>

      {modal ? (
        <FinanceActionPanel title={titles[modal]}>
          <button onClick={() => setModal(null)} type="button">
            Kapat
          </button>
        </FinanceActionPanel>
      ) : null}
    </div>
  );
}
