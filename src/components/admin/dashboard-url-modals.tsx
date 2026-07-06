import type { Route } from "next";
import Link from "next/link";

import { getDatabase } from "@/lib/db";

import { AdminUrlModal, ModalFieldPreview, ModalOptionGrid } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";
import { ClientCreateForm } from "./client-create-form";

type DashboardUrlModalsProps = {
  activeModal: string;
  canManageClients: boolean;
  canReadAppointments: boolean;
  canReadFinance: boolean;
};

export async function DashboardUrlModals({
  activeModal,
  canManageClients,
  canReadAppointments,
  canReadFinance,
}: DashboardUrlModalsProps) {
  if (activeModal === "danisan-ekle" && canManageClients) {
    const guardians = await getDatabase().guardian.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { email: true, firstName: true, id: true, lastName: true, phone: true },
      take: 250,
    });

    return (
      <AdminUrlModal closeHref="/yonetim" footer={<CloseOnly closeHref="/yonetim" />} title="Danisan ekle">
        <div className={modalStyles.modalStack}>
          <ModalOptionGrid
            items={[
              { description: "Guardian linked child client record.", icon: "C", label: "Cocuk danisan" },
              { description: "Adult client record with own contact.", icon: "Y", label: "Yetiskin danisan" },
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
        footer={<ModalFooter closeHref="/yonetim" primaryHref="/yonetim/danisanlar" primaryLabel="Danisan sec" url="/yonetim?modal=not-ekle" />}
        title="Not ekle"
      >
        <div className={modalStyles.modalStack}>
          <ModalFieldPreview label="Baglam" value="Once danisan secilir" helper="Not dogrudan danisan profilinden acilir." />
          <ModalFieldPreview label="Kalici kayit" value="Not tablosu gerekir" helper="Mevcut semada danisan notu tablosu yok." />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur" && canReadAppointments) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        footer={<ModalFooter closeHref="/yonetim" primaryHref="/yonetim/randevular?modal=randevu-olustur" primaryLabel="Takvimde ac" url="/yonetim?modal=randevu-olustur" />}
        title="Randevu olustur"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Takvim" value="Haftalik ekip gorunumu" helper="Terapist kolonlari ve uygun saatler." />
          <ModalFieldPreview label="Sure" value="15 / 30 / 45 / ozel" helper="Varsayilan ve custom sure." />
          <ModalFieldPreview label="Cakisma" value="Transaction kontrolu" helper="Ayni saate ikinci kayit dusmez." />
          <ModalFieldPreview label="Baglanti" value="Danisan ve plan" helper="Randevu profile geri akar." />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "odeme-plani" && canReadFinance) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        footer={<ModalFooter closeHref="/yonetim" primaryHref="/yonetim/odemeler" primaryLabel="Odeme ekranina gec" url="/yonetim?modal=odeme-plani" />}
        title="Odeme plani"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Paket" value="Seans plani" helper="8 / 12 / ozel seans sayisi." />
          <ModalFieldPreview label="Tutar" value="Toplam ve alinan" helper="Bekleyen ve kismi odeme ayrilir." />
          <ModalFieldPreview label="Tarih" value="Beklenen odeme gunu" helper="Custom tarih secici finans akisina baglanir." />
          <ModalFieldPreview label="Takip" value="Danisana bagli" helper="Plan client context olmadan acilmaz." />
        </div>
      </AdminUrlModal>
    );
  }

  return null;
}

function CloseOnly({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>
        Kapat
      </Link>
    </div>
  );
}

function ModalFooter({ closeHref, primaryHref, primaryLabel, url }: { closeHref: Route; primaryHref: Route; primaryLabel: string; url: string }) {
  return (
    <>
      <span className={modalStyles.footerText}>URL: {url}</span>
      <div className={modalStyles.footerActions}>
        <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>
          Kapat
        </Link>
        <Link className={modalStyles.modalButton} href={primaryHref} scroll={false}>
          {primaryLabel}
        </Link>
      </div>
    </>
  );
}
