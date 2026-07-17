"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { DateControl } from "@/components/admin/date-control";
import { SelectControl } from "@/components/admin/select-control";

import styles from "./musaitlik.module.css";

type AvailabilityExceptionType = "BLOCKED" | "CLOSED" | "CUSTOM_HOURS";
type AvailabilityExceptionStatus = "ACTIVE" | "INACTIVE";

export type AvailabilityExceptionActionState = Readonly<{
  message: string;
  status: "error" | "idle" | "success";
}>;

type ServerAction = (
  state: AvailabilityExceptionActionState,
  formData: FormData,
) => Promise<AvailabilityExceptionActionState>;

const initialActionState: AvailabilityExceptionActionState = { message: "", status: "idle" };

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
  const formRef = useRef<HTMLFormElement>(null);
  const [actionState, formAction, pending] = useActionState(action, initialActionState);
  const [type, setType] = useState<AvailabilityExceptionType>("CLOSED");
  const [status, setStatus] = useState<AvailabilityExceptionStatus>("ACTIVE");
  const [localDate, setLocalDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const timeFieldsDisabled = type === "CLOSED";
  const availableEndTimes = useMemo(
    () => timeOptions.filter((option) => option.value > startTime),
    [startTime],
  );

  useEffect(() => {
    if (timeFieldsDisabled || endTime > startTime) return;
    setEndTime(availableEndTimes[0]?.value ?? "");
  }, [availableEndTimes, endTime, startTime, timeFieldsDisabled]);

  useEffect(() => {
    if (actionState.status !== "success") return;
    formRef.current?.reset();
    setType("CLOSED");
    setStatus("ACTIVE");
    setLocalDate("");
    setStartTime("09:00");
    setEndTime("17:00");
  }, [actionState.status]);

  return (
    <form action={formAction} ref={formRef}>
      <input name="practitionerId" type="hidden" value={practitionerId} />

      <div className={styles.formGrid}>
        <label>
          İstisna tipi
          <SelectControl
            disabled={pending}
            name="type"
            onValueChange={(value) => setType(value as AvailabilityExceptionType)}
            options={typeOptions}
            value={type}
          />
          <small>Kapalı gün seçildiğinde saat alanları kullanılmaz.</small>
        </label>
        <label>
          Tarih
          <DateControl
            disabled={pending}
            name="localDate"
            onValueChange={setLocalDate}
            required
            value={localDate}
          />
          <small>Takvimden günü seçin.</small>
        </label>
        <label>
          Durum
          <SelectControl
            disabled={pending}
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
            disabled={pending || timeFieldsDisabled}
            name="localStartTime"
            onValueChange={setStartTime}
            options={timeOptions}
            placeholder="Başlangıç seçin"
            required={!timeFieldsDisabled}
            value={startTime}
          />
          <small>Bloke veya özel saat için zorunludur.</small>
        </label>
        <label>
          Bitiş saati
          <SelectControl
            disabled={pending || timeFieldsDisabled || availableEndTimes.length === 0}
            name="localEndTime"
            onValueChange={setEndTime}
            options={availableEndTimes}
            placeholder="Bitiş seçin"
            required={!timeFieldsDisabled}
            value={endTime}
          />
          <small>Bitiş saati başlangıçtan sonra olmalıdır.</small>
        </label>
      </div>

      <div className={styles.formGridTwo}>
        <label>
          Sebep kodu
          <input
            defaultValue="ADMIN_EXCEPTION"
            disabled={pending}
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
            disabled={pending}
            maxLength={500}
            name="privateNote"
            placeholder="Örn. eğitim, izin, kurum dışı çalışma"
            type="text"
          />
        </label>
      </div>

      <button disabled={pending} type="submit">
        {pending ? "Kaydediliyor..." : "İstisna ekle"}
      </button>
      {actionState.message ? (
        <p
          aria-live="polite"
          className={styles.formFeedback}
          data-status={actionState.status}
          role={actionState.status === "error" ? "alert" : "status"}
        >
          {actionState.message}
        </p>
      ) : null}
    </form>
  );
}
