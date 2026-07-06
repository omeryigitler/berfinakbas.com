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
  const closeHref = ("/yonetim/danisan-profili?clientId=" + clientId) as Route;

  if (activeModal === "randevu-olustur" && !canReadAppointments) return null;
  if (activeModal === "odeme-plani" && !canReadFinance) return null;
  if (!["not-ekle", "randevu-olustur", "odeme-plani"].includes(activeModal)) return null;

  const titleMap: Record<string, string> = {
    "not-ekle": "Not ekle",
    "odeme-plani": "Odeme plani",
    "randevu-olustur": "Randevu olustur",
  };

  const contextMap: Record<string, string> = {
    "not-ekle": "Profil notu",
    "odeme-plani": "Odeme ve plan",
    "randevu-olustur": "Randevu akisi",
  };

  return (
    <AdminUrlModal closeHref={closeHref} footer={<ModalFooter closeHref={closeHref} />} title={titleMap[activeModal]}>
      <div className={modalStyles.modalGrid}>
        <ModalFieldPreview label="Danisan" value={clientName} helper="Islem bu profile baglanir." />
        <ModalFieldPreview label="Islem" value={contextMap[activeModal]} helper="Arka profil ekrani sabit kalir." />
      </div>
    </AdminUrlModal>
  );
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
