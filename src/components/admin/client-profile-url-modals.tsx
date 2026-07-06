import type { Route } from "next";
import Link from "next/link";

import { AdminUrlModal, ModalFieldPreview } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";

type Props = {
  activeModal: string;
  clientId: string;
  clientName: string;
  canReadAppointments: boolean;
  canReadFinance: boolean;
};

export function ClientProfileUrlModals({
  activeModal,
  clientId,
  clientName,
  canReadAppointments,
  canReadFinance,
}: Props) {
  const closeHref = `/yonetim/danisan-profili?clientId=${clientId}` as Route;

  if (activeModal === "not-ekle") {
    return (
      <AdminUrlModal closeHref={closeHref} title="Not ekle">
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Danisan" value={clientName} helper="Not bu profile baglanir." />
          <ModalFieldPreview label="Kategori" value="Admin / seans / odeme" helper="Takip notu olarak acilir." />
        </div>
        <ModalFooter closeHref={closeHref} />
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur" && canReadAppointments) {
    return (
      <AdminUrlModal closeHref={closeHref} title="Randevu olustur">
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Danisan" value={clientName} helper="Randevu bu profile baglanir." />
          <ModalFieldPreview label="Takvim" value="Ekip ve saat secimi" helper="Takvim ekranina tasinir." />
        </div>
        <ModalFooter closeHref={closeHref} />
      </AdminUrlModal>
    );
  }

  if (activeModal === "odeme-plani" && canReadFinance) {
    return (
      <AdminUrlModal closeHref={closeHref} title="Odeme plani">
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Danisan" value={clientName} helper="Plan bu profile baglanir." />
          <ModalFieldPreview label="Takip" value="Seans ve odeme" helper="Finans ekranina filtreli gider." />
        </div>
        <ModalFooter closeHref={closeHref} />
      </AdminUrlModal>
    );
  }

  return null;
}

function ModalFooter({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>
        Kapat
      </Link>
    </div>
  );
}
