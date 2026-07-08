import type { Route } from "next";
import Link from "next/link";

import { getDatabase } from "@/lib/db";

import {
  AdminUrlModal,
  ModalFieldPreview,
  ModalOptionGrid,
} from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";
import { AppointmentCreateModal } from "./appointment-create-modal";
import { ClientCreateForm } from "./client-create-form";

type DashboardUrlModalsProps = {
  activeModal: string;
  canManageAppointments: boolean;
  canManageClients: boolean;
  canReadFinance: boolean;
  initialClientId?: string | null;
};

export async function DashboardUrlModals({
  activeModal,
  canManageAppointments,
  canManageClients,
  canReadFinance,
  initialClientId,
}: DashboardUrlModalsProps) {
  if (activeModal === "danisan-ekle" && canManageClients) {
    const guardians = await getDatabase().guardian.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        email: true,
        firstName: true,
        id: true,
        lastName: true,
        phone: true,
      },
      take: 250,
    });

    return (
      <AdminUrlModal
        closeHref="/yonetim"
        footer={<CloseOnly closeHref="/yonetim" />}
        title="Danisan ekle"
      >
        <div className={modalStyles.modalStack}>
          <ModalOptionGrid
            items={[
              {
                description: "Guardian linked child client record.",
                icon: "C",
                label: "Cocuk danisan",
              },
              {
                description: "Adult client record with own contact.",
                icon: "Y",
                label: "Yetiskin danisan",
              },
            ]}
          />
          <ClientCreateForm guardians={guardians} />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "not-ekle") {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/danisanlar"
            primaryLabel="Danisan sec"
            url="/yonetim?modal=not-ekle"
          />
        }
        title="Not ekle"
      >
        <div className={modalStyles.modalStack}>
          <ModalFieldPreview
            helper="Not dogrudan danisan profilinden acilir."
            label="Baglam"
            value="Once danisan secilir"
          />
          <ModalFieldPreview
            helper="Mevcut semada danisan notu tablosu yok."
            label="Kalici kayit"
            value="Not tablosu gerekir"
          />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur" && canManageAppointments) {
    return <AppointmentCreateModal closeHref="/yonetim" initialClientId={initialClientId} />;
  }

  if (activeModal === "odeme-plani" && canReadFinance) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/odemeler"
            primaryLabel="Odeme ekranina gec"
            url="/yonetim?modal=odeme-plani"
          />
        }
        title="Odeme plani"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview
            helper="8 / 12 / ozel seans sayisi."
            label="Paket"
            value="Seans plani"
          />
          <ModalFieldPreview
            helper="Bekleyen ve kismi odeme ayrilir."
            label="Tutar"
            value="Toplam ve alinan"
          />
          <ModalFieldPreview
            helper="Custom tarih secici finans akisina baglanir."
            label="Tarih"
            value="Beklenen odeme gunu"
          />
          <ModalFieldPreview
            helper="Plan client context olmadan acilmaz."
            label="Takip"
            value="Danisana bagli"
          />
        </div>
      </AdminUrlModal>
    );
  }

  return null;
}

function CloseOnly({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link
        className={modalStyles.modalButtonSecondary}
        href={closeHref}
        scroll={false}
      >
        Kapat
      </Link>
    </div>
  );
}

function ModalFooter({
  closeHref,
  primaryHref,
  primaryLabel,
  url,
}: {
  closeHref: Route;
  primaryHref: Route;
  primaryLabel: string;
  url: string;
}) {
  return (
    <>
      <span className={modalStyles.footerText}>URL: {url}</span>
      <div className={modalStyles.footerActions}>
        <Link
          className={modalStyles.modalButtonSecondary}
          href={closeHref}
          scroll={false}
        >
          Kapat
        </Link>
        <Link
          className={modalStyles.modalButton}
          href={primaryHref}
          scroll={false}
        >
          {primaryLabel}
        </Link>
      </div>
    </>
  );
}
