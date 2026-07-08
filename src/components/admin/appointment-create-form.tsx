"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { SelectControl } from "./select-control";

type ClientOption = {
  email: string | null;
  firstName: string;
  guardians: { id: string; label: string }[];
  id: string;
  lastName: string;
  phone: string | null;
  type: "ADULT" | "CHILD";
};

type PractitionerOption = {
  displayName: string;
  id: string;
  timeZone: string;
};

type ServiceOption = {
  defaultDurationMinutes: number;
  id: string;
  locationType: "HYBRID" | "IN_PERSON" | "ONLINE";
  name: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  issues?: { message?: string; path: string }[];
};

const locationOptions = [
  { label: "Hizmet varsayılanı", value: "SERVICE_DEFAULT" },
  { label: "Yüz yüze", value: "IN_PERSON" },
  { label: "Çevrim içi", value: "ONLINE" },
  { label: "Yüz yüze / çevrim içi", value: "HYBRID" },
];

function optionLabel(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

function readOptional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { error: "Beklenmeyen bir sunucu yanıtı alındı." };
  }
}

function issueMessage(payload: ApiResponse<unknown>): string {
  const firstIssue = payload.issues?.find((issue) => issue.message)?.message;
  return firstIssue ?? payload.error ?? "Randevu oluşturulamadı.";
}

function defaultDateTimeLocal(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function durationOptions(defaultDuration: number): { label: string; value: string }[] {
  const durations = Array.from(new Set([defaultDuration, 15, 30, 45])).sort((a, b) => a - b);
  return [
    ...durations.map((duration) => ({ label: `${duration} dk`, value: String(duration) })),
    { label: "Özel süre", value: "CUSTOM" },
  ];
}

export function AppointmentCreateForm({
  clients,
  initialClientId,
  practitioners,
  services,
}: {
  clients: ClientOption[];
  initialClientId?: string | null;
  practitioners: PractitionerOption[];
  services: ServiceOption[];
}) {
  const initialClient = clients.some((client) => client.id === initialClientId) ? initialClientId ?? "" : "";
  const [busy, setBusy] = useState(false);
  const [clientId, setClientId] = useState(initialClient);
  const [customDuration, setCustomDuration] = useState("52");
  const [durationMode, setDurationMode] = useState("SERVICE_DEFAULT");
  const [message, setMessage] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(defaultDateTimeLocal);

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const selectedDuration =
    durationMode === "SERVICE_DEFAULT"
      ? (selectedService?.defaultDurationMinutes ?? 15)
      : durationMode === "CUSTOM"
        ? Number(customDuration)
        : Number(durationMode);

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        label: optionLabel([
          `${client.firstName} ${client.lastName}`,
          client.type === "CHILD" ? "Çocuk" : "Yetişkin",
          client.phone,
        ]),
        value: client.id,
      })),
    [clients],
  );
  const serviceOptions = useMemo(
    () => services.map((service) => ({ label: service.name, value: service.id })),
    [services],
  );
  const practitionerOptions = useMemo(
    () => practitioners.map((practitioner) => ({ label: practitioner.displayName, value: practitioner.id })),
    [practitioners],
  );
  const selectedServiceDurationOptions = useMemo(
    () => durationOptions(selectedService?.defaultDurationMinutes ?? 15),
    [selectedService?.defaultDurationMinutes],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!selectedClient) {
      setMessage("Randevu için danışan seçmelisiniz.");
      return;
    }
    if (selectedClient.type === "CHILD" && selectedClient.guardians.length === 0) {
      setMessage("Çocuk danışan için önce veli kaydı bağlanmalı.");
      return;
    }
    if (selectedClient.type === "CHILD" && !readOptional(formData, "guardianId")) {
      setMessage("Çocuk danışan için veli seçmelisiniz.");
      return;
    }
    if (!selectedService) {
      setMessage("Randevu için hizmet seçmelisiniz.");
      return;
    }
    if (!readOptional(formData, "practitionerId")) {
      setMessage("Randevu için terapist seçmelisiniz.");
      return;
    }
    if (!Number.isFinite(selectedDuration) || selectedDuration < 5 || selectedDuration > 240) {
      setMessage("Süre 5 ile 240 dakika arasında olmalıdır.");
      return;
    }
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
      setMessage("Geçerli bir tarih ve saat seçmelisiniz.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/appointments", {
        body: JSON.stringify({
          clientId: selectedClient.id,
          durationMinutes: selectedDuration,
          guardianId: readOptional(formData, "guardianId"),
          locationType: readOptional(formData, "locationType"),
          practitionerId: readOptional(formData, "practitionerId"),
          requestNote: readOptional(formData, "requestNote"),
          serviceId: selectedService.id,
          startsAt: startsAtDate.toISOString(),
        }),
        headers: { accept: "application/json", "content-type": "application/json" },
        method: "POST",
      });
      const payload = await readResponse<{ id: string }>(response);
      if (!response.ok || !payload.data) throw new Error(issueMessage(payload));
      window.location.assign(`/yonetim/danisan-profili?clientId=${selectedClient.id}`);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Randevu oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  if (clients.length === 0 || services.length === 0 || practitioners.length === 0) {
    return (
      <div className="admin-empty-state" role="status">
        <strong>Randevu oluşturma hazır değil</strong>
        <span>Danışan, aktif hizmet ve aktif terapist kaydı olmadan randevu oluşturulamaz.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="booking-field-grid">
        <label className="booking-field">
          Danışan
          <SelectControl
            disabled={busy}
            name="clientId"
            onValueChange={setClientId}
            options={clientOptions}
            placeholder="Danışan seçin"
            required
            value={clientId}
          />
        </label>
        {selectedClient?.type === "CHILD" ? (
          <label className="booking-field">
            Veli
            <SelectControl
              disabled={busy || selectedClient.guardians.length === 0}
              name="guardianId"
              options={selectedClient.guardians}
              placeholder={selectedClient.guardians.length === 0 ? "Veli kaydı yok" : "Veli seçin"}
              required
            />
            {selectedClient.guardians.length === 0 ? <small>Önce danışan profiline veli bağlayın.</small> : null}
          </label>
        ) : null}
        <label className="booking-field">
          Hizmet
          <SelectControl
            disabled={busy}
            name="serviceId"
            onValueChange={(value) => {
              setServiceId(value);
              setDurationMode("SERVICE_DEFAULT");
            }}
            options={serviceOptions}
            required
            value={serviceId}
          />
        </label>
        <label className="booking-field">
          Terapist
          <SelectControl
            defaultValue={practitioners[0]?.id ?? ""}
            disabled={busy}
            name="practitionerId"
            options={practitionerOptions}
            required
          />
        </label>
        <label className="booking-field">
          Tarih ve saat
          <input
            disabled={busy}
            name="startsAt"
            onChange={(event) => setStartsAt(event.currentTarget.value)}
            required
            type="datetime-local"
            value={startsAt}
          />
        </label>
        <label className="booking-field">
          Süre
          <SelectControl
            disabled={busy}
            name="durationMode"
            onValueChange={setDurationMode}
            options={selectedServiceDurationOptions}
            value={durationMode}
          />
        </label>
        {durationMode === "CUSTOM" ? (
          <label className="booking-field">
            Özel süre / dakika
            <input
              disabled={busy}
              inputMode="numeric"
              max="240"
              min="5"
              name="customDuration"
              onChange={(event) => setCustomDuration(event.currentTarget.value)}
              required
              type="number"
              value={customDuration}
            />
          </label>
        ) : null}
        <label className="booking-field">
          Görüşme tipi
          <SelectControl
            defaultValue="SERVICE_DEFAULT"
            disabled={busy}
            name="locationType"
            options={locationOptions}
          />
        </label>
      </div>

      <label className="booking-field" style={{ marginTop: 14 }}>
        Kısa not
        <textarea disabled={busy} maxLength={500} name="requestNote" rows={3} />
        <small>Bu alan klinik not için değil, operasyon notu içindir.</small>
      </label>

      <button className="primary-button booking-button" disabled={busy} type="submit">
        {busy ? "Oluşturuluyor..." : "Randevu oluştur"}
      </button>
      {message ? <p className="admin-inline-error">{message}</p> : null}
    </form>
  );
}
