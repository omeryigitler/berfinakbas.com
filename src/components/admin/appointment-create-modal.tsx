import type { Route } from "next";

import { getDatabase } from "@/lib/db";

import { AdminUrlModal } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";
import { AppointmentCreateForm } from "./appointment-create-form";

export async function AppointmentCreateModal({
  closeHref,
  initialClientId,
}: {
  closeHref: Route;
  initialClientId?: string | null;
}) {
  const database = getDatabase();
  const [clients, practitioners, services] = await Promise.all([
    database.client.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        email: true,
        firstName: true,
        guardians: {
          select: {
            guardian: {
              select: {
                firstName: true,
                id: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        id: true,
        lastName: true,
        phone: true,
        type: true,
      },
      take: 250,
    }),
    database.practitioner.findMany({
      orderBy: [{ displayName: "asc" }],
      select: { displayName: true, id: true, timeZone: true },
      where: { status: "ACTIVE" },
    }),
    database.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        defaultDurationMinutes: true,
        id: true,
        locationType: true,
        name: true,
      },
      where: { status: "ACTIVE" },
    }),
  ]);

  return (
    <AdminUrlModal closeHref={closeHref} title="Randevu oluştur">
      <div className={modalStyles.modalStack}>
        <p className={modalStyles.footerText}>
          Admin tarafından oluşturulan randevu doğrudan onaylı açılır. Aynı terapistte
          çakışan saat varsa kayıt engellenir.
        </p>
        <AppointmentCreateForm
          clients={clients.map((client) => ({
            ...client,
            guardians: client.guardians.map(({ guardian }) => ({
              label: `${guardian.firstName} ${guardian.lastName} · ${guardian.phone}`,
              value: guardian.id,
            })),
          }))}
          initialClientId={initialClientId}
          practitioners={practitioners}
          services={services}
        />
      </div>
    </AdminUrlModal>
  );
}
