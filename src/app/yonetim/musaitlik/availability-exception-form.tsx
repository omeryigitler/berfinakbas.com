"use client";

import { useMemo, useState } from "react";

import { DateControl } from "@/components/admin/date-control";
import { SelectControl } from "@/components/admin/select-control";

import styles from "./musaitlik.module.css";

type AvailabilityExceptionType = "BLOCKED" | "CLOSED" | "CUSTOM_HOURS";
type AvailabilityExceptionStatus = "ACTIVE" | "INACTIVE";
type ServerAction = (formData: FormData) => Promise<void>;

const typeOptions = [
  { label: "Kapalı gün", value: "CLOSED" },
  { label: "Bloke saat", value: "BLOCKED" },
  { label: "Özel saat", value: "CUSTOM_HOURS" },
];

const statusOptions = [
  { label: "Aktif", value: "ACTIVE" },
  { label: "Pasif", value: "INACTIVE" },
];

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { label: value, value };
});

export function AvailabilityExceptionForm({
  action,
  practitionerId,
}: {
  action: ServerAction;
  practitionerId: string;
}) {
  const [type, setType] = useState<AvailabilityExceptionType>("CLOSED");
  const [status, setStatus] = useState<AvailabilityExceptionStatus>("ACTIVE");
  const timeFieldsDisabled = type === "CLOSED";
  const availableEndTimes = useMemo(() => timeOptions, []);

  return (
    <form action={action}>
      <input name="practitionerId" type="hidden" value={practitionerId} />

      <div className={styles.formGrid}>
        <label>
          İstisna tipi
          <SelectControl
            name="type"
            onValueChange={(value) => setType(value as AvailabilityExceptionType)}
            options={typeOptions}
            value={type}
          />
          <small>Kapalı gün seçildiğinde saat alanları kullanılmaz.</small>
        </label>
        <label>
          Tarih
          <DateControl name="localDate" required />
          <small>Takvimden günü seçin.</small>
        </label>
        <label>
          Durum
          <SelectControl
            name="status"
            onValueChange={(value) => setStatus(value as AvailabilityExceptionStatus)}
            options={statusOptions}
            value={status}
          />
          <small>Pasif kayıt planlamayı etkilemez.</small>
        </label>
      </div>

      <div className={styles.formGridTwo}>
        <label>
          Başlangıç saati
          <SelectControl
            defaultValue="09:00"
            disabled={timeFieldsDisabled}
            name="localStartTime"
            options={timeOptions}
            placeholder="Başlangıç seçin"
          />
          <small>Bloke veya özel saat için zorunludur.</small>
        </label>
        <label>
          Bitiş saati
          <SelectControl
            defaultValue="17:00"
            disabled={timeFieldsDisabled}
            name="localEndTime"
            options={availableEndTimes}
            placeholder="Bitiş seçin"
          />
          <small>Bitiş saati başlangıçtan sonra olmalıdır.</small>
        </label>
      </div>

      <div className={styles.formGridTwo}>
        <label>
          Sebep kodu
          <input
            defaultValue="ADMIN_EXCEPTION"
            maxLength={80}
            minLength={2}
            name="reasonCode"
            required
            type="text"
          />
        </label>
        <label>
          Özel not
          <input
            maxLength={500}
            name="privateNote"
            placeholder="Örn. eğitim, izin, kurum dışı çalışma"
            type="text"
          />
        </label>
      </div>

      <button type="submit">İstisna ekle</button>
    </form>
  );
}
