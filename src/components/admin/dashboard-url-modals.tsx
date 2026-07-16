import type { Route } from "next";
import Link from "next/link";

import { getDatabase } from "@/lib/db";

import { AdminUrlModal } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";
import { AppointmentCreateModal } from "./appointment-create-modal";
import { ClientCreateForm } from "./client-create-form";

type DashboardUrlModalsProps = {
  activeModal: string;
  canManageAppointments: boolean;
  canManageClients: boolean;
  initialClientId?: string | null;
};

export async function DashboardUrlModals({
  activeModal,
  canManageAppointments,
  canManageClients,
  initialClientId,
}: DashboardUrlModalsProps) {
  if (activeModal === "danisan-ekle" && canManageClients) {
    const guardians = await getDatabase().guardian.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { email: true, firstName: true, id: true, lastName: true, phone: true },
      take: 250,
    });
    return (
      <AdminUrlModal closeHref="/yonetim" footer={<CloseOnly closeHref="/yonetim" />} title="Danışan ekle">
        <div className={modalStyles.modalStack}>
          <p>Yetişkin veya çocuk danışan kaydı oluşturun. Çocuk danışanda veli bağlantısı zorunludur.</p>
          <ClientCreateForm guardians={guardians} />
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur" && canManageAppointments) {
    return <AppointmentCreateModal closeHref="/yonetim" initialClientId={initialClientId} />;
  }

  return null;
}

function CloseOnly({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>Kapat</Link>
    </div>
  );
}
