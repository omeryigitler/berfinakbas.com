import type { Route } from "next";
import Link from "next/link";

import {
  AdminUrlModal,
  ModalFieldPreview,
  ModalOptionGrid,
} from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";

type DashboardUrlModalsProps = {
  activeModal: string;
  canManageClients: boolean;
  canReadAppointments: boolean;
  canReadFinance: boolean;
};

export function DashboardUrlModals({
  activeModal,
  canManageClients,
  canReadAppointments,
  canReadFinance,
}: DashboardUrlModalsProps) {
  if (activeModal === "danisan-ekle" && canManageClients) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        description="Danışan ekleme akışı local component state ile değil, URL parametresiyle açılır. Arka dashboard sabit kalır."
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/danisanlar/yeni"
            primaryLabel="Forma geç"
            url="/yonetim?modal=danisan-ekle"
          />
        }
        title="Danışan ekle"
      >
        <div className={modalStyles.modalStack}>
          <ModalOptionGrid
            items={[
              { description: "Veli/sorumlu bilgisiyle açılan danışan kaydı.", icon: "Ç", label: "Çocuk danışan" },
              { description: "Kendi iletişim bilgileriyle açılan danışan kaydı.", icon: "Y", label: "Yetişkin danışan" },
            ]}
          />
          <div className={modalStyles.modalGrid}>
            <ModalFieldPreview label="1" value="Danışan tipi" helper="Liste, filtre ve profil ikonları buna göre ayrılır." />
            <ModalFieldPreview label="2" value="İletişim" helper="Telefon, e-posta ve sorumlu bilgisi girilir." />
            <ModalFieldPreview label="3" value="Hizmet" helper="Varsayılan süre ve terapi alanı randevuya bağlanır." />
            <ModalFieldPreview label="4" value="Plan" helper="Ödeme planı danışan profilinden açılır." />
          </div>
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "not-ekle") {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        description="Not ekleme işlemi önce danışan bağlamına alınır. Böylece genel dashboard işlem ekranına dönüşmez."
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/danisanlar"
            primaryLabel="Danışan seç"
            url="/yonetim?modal=not-ekle"
          />
        }
        title="Not ekle"
      >
        <div className={modalStyles.modalStack}>
          <ModalFieldPreview label="Bağlam" value="Önce danışan seçilir" helper="Not, seçilen danışanın profil sayfasına bağlanır." />
          <ModalFieldPreview label="Not tipi" value="Admin / seans / ödeme" helper="Takip amacıyla kategorili not akışı kurulur." />
          <ModalFieldPreview label="Kapanış" value="Query parametresi kalkar" helper="Geri/ileri butonu doğal şekilde çalışır." />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur" && canReadAppointments) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        description="Randevu oluşturma işlemi takvim ekranında da aynı URL mantığıyla açılacak şekilde hazırlanır."
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/randevular?modal=randevu-olustur"
            primaryLabel="Takvimde aç"
            url="/yonetim?modal=randevu-olustur"
          />
        }
        title="Randevu oluştur"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Takvim" value="Haftalık ekip görünümü" helper="Terapist kolonları ve uygun saat alanları." />
          <ModalFieldPreview label="Süre" value="15 / 30 / 45 / özel" helper="Varsayılan ve custom süre desteklenir." />
          <ModalFieldPreview label="Çakışma" value="Transaction kontrolü" helper="Aynı saate ikinci kayıt düşmez." />
          <ModalFieldPreview label="Bağlantı" value="Danışan + plan" helper="Randevu danışan profiline geri akar." />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "odeme-plani" && canReadFinance) {
    return (
      <AdminUrlModal
        closeHref="/yonetim"
        description="Ödeme ve plan işlemi tek başına değil, danışan bağlamıyla açılacak şekilde yönlendirilir."
        footer={
          <ModalFooter
            closeHref="/yonetim"
            primaryHref="/yonetim/odemeler"
            primaryLabel="Ödeme ekranına geç"
            url="/yonetim?modal=odeme-plani"
          />
        }
        title="Ödeme planı"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview label="Paket" value="Seans planı" helper="8 / 12 / özel seans sayısı." />
          <ModalFieldPreview label="Tutar" value="Toplam ve alınan" helper="Bekleyen ve kısmi ödeme ayrılır." />
          <ModalFieldPreview label="Tarih" value="Beklenen ödeme günü" helper="Custom tarih seçici modal içinde kullanılır." />
          <ModalFieldPreview label="Takip" value="Danışana bağlı" helper="Plan client context olmadan açılmaz." />
        </div>
      </AdminUrlModal>
    );
  }

  return null;
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
