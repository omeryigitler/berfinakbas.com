"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { DateControl } from "./date-control";
import { SelectControl } from "./select-control";

type DurationSettings = { adultMinutes: number; childMinutes: number; firstMeetingMinutes: number };

type ClientOption = {
  appointmentCount: number;
  email: string | null;
  firstName: string;
  guardians: { label: string; value: string }[];
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

const appointmentTimeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { label: value, value };
});

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

function durationOptions(defaultDuration: number, contextualDuration: number, contextualLabel: string): { label: string; value: string }[] {
  const durations = Array.from(new Set([defaultDuration, contextualDuration, 15, 30, 45, 50, 60])).sort((a, b) => a - b);
  return [
    { label: `${contextualLabel} (${contextualDuration} dk)`, value: "CONTEXT_DEFAULT" },
    { label: `Hizmet varsayılanı (${defaultDuration} dk)`, value: "SERVICE_DEFAULT" },
    ...durations.map((duration) => ({ label: `${duration} dk`, value: String(duration) })),
    { label: "Özel süre", value: "CUSTOM" },
  ];
}

export function AppointmentCreateForm({
  clients,
  durationSettings,
  initialClientId,
  practitioners,
  services,
}: {
  clients: ClientOption[];
  durationSettings: DurationSettings;
  initialClientId?: string | null;
  practitioners: PractitionerOption[];
  services: ServiceOption[];
}) {
  const initialClient = clients.some((client) => client.id === initialClientId)
    ? (initialClientId ?? "")
    : "";
  const [busy, setBusy] = useState(false);
  const [clientId, setClientId] = useState(initialClient);
  const [customDuration, setCustomDuration] = useState("52");
  const [durationMode, setDurationMode] = useState("CONTEXT_DEFAULT");
  const [message, setMessage] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [setupBusy, setSetupBusy] = useState(false);
  const initialDateTime = useMemo(() => defaultDateTimeLocal(), []);
  const [appointmentDate, setAppointmentDate] = useState(initialDateTime.slice(0, 10));
  const [appointmentTime, setAppointmentTime] = useState(initialDateTime.slice(11, 16));

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const contextualDuration = selectedClient?.appointmentCount === 0
    ? durationSettings.firstMeetingMinutes
    : selectedClient?.type === "CHILD"
      ? durationSettings.childMinutes
      : durationSettings.adultMinutes;
  const contextualDurationLabel = selectedClient?.appointmentCount === 0
    ? "İlk görüşme varsayılanı"
    : selectedClient?.type === "CHILD"
      ? "Çocuk görüşmesi varsayılanı"
      : "Yetişkin görüşmesi varsayılanı";
  const selectedDuration =
    durationMode === "CONTEXT_DEFAULT"
      ? contextualDuration
      : durationMode === "SERVICE_DEFAULT"
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
    () =>
      practitioners.map((practitioner) => ({
        label: practitioner.displayName,
        value: practitioner.id,
      })),
    [practitioners],
  );
  const selectedServiceDurationOptions = useMemo(
    () => durationOptions(selectedService?.defaultDurationMinutes ?? 15, contextualDuration, contextualDurationLabel),
    [contextualDuration, contextualDurationLabel, selectedService?.defaultDurationMinutes],
  );

  async function setupPrerequisites() {
    setSetupBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/appointment-prerequisites", {
        headers: { accept: "application/json" },
        method: "POST",
      });
      const payload = await readResponse<{ practitionerCreated: boolean; serviceCreated: boolean }>(response);
      if (!response.ok || !payload.data) throw new Error(issueMessage(payload));
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Randevu altyapısı tamamlanamadı.");
    } finally {
      setSetupBusy(false);
    }
  }

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
    const startsAtDate = new Date(`${appointmentDate}T${appointmentTime}`);
    if (!appointmentDate || !appointmentTime || Number.isNaN(startsAtDate.getTime())) {
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
    const missingItems = [
      clients.length === 0 ? "danışan" : null,
      services.length === 0 ? "aktif hizmet" : null,
      practitioners.length === 0 ? "aktif terapist" : null,
    ].filter(Boolean);
    const canAutoSetup = services.length === 0 || practitioners.length === 0;

    return (
      <div className="admin-empty-state" role="status">
        <strong>Randevu oluşturma hazır değil</strong>
        <span>Eksik kayıt: {missingItems.join(", ")}.</span>
        {clients.length === 0 ? (
          <a className="primary-button" href="/yonetim?modal=danisan-ekle">
            Önce danışan oluştur
          </a>
        ) : null}
        {canAutoSetup ? (
          <button className="primary-button" disabled={setupBusy} onClick={setupPrerequisites} type="button">
            {setupBusy ? "Tamamlanıyor..." : "Hizmet ve terapisti tamamla"}
          </button>
        ) : null}
        {message ? <span>{message}</span> : null}
      </div>
    );
  }

  return (
    <form className="appointment-create-form" onSubmit={submit}>
      <section className="appointment-form-section" aria-labelledby="appointment-client-section">
        <div className="appointment-form-section-header">
          <span>1</span>
          <div>
            <h3 id="appointment-client-section">Danışan bilgisi</h3>
            <p>Randevu hangi danışana açılacak? Çocuk danışanda veli seçimi zorunludur.</p>
          </div>
        </div>
        <div className="booking-field-grid">
          <label className="booking-field">
            Danışan
            <SelectControl
              disabled={busy}
              name="clientId"
              onValueChange={(value) => { setClientId(value); setDurationMode("CONTEXT_DEFAULT"); }}
              options={clientOptions}
              placeholder="Danışan seçin"
              required
              value={clientId}
            />
          </label>
          {selectedClient?.type === "CHILD" ? (
            <label className="booking-field appointment-guardian-field">
              Veli
              <SelectControl
                disabled={busy || selectedClient.guardians.length === 0}
                name="guardianId"
                options={selectedClient.guardians}
                placeholder={selectedClient.guardians.length === 0 ? "Veli kaydı yok" : "Veli seçin"}
                required
              />
              {selectedClient.guardians.length === 0 ? (
                <small className="appointment-warning-text">Önce danışan profiline veli bağlayın.</small>
              ) : (
                <small>Seçilen veli bu çocuk danışanın randevusuna bağlanır.</small>
              )}
            </label>
          ) : (
            <div className="appointment-inline-note" role="status">
              <strong>Yetişkin danışan</strong>
              <span>Veli seçimi gerekmiyor.</span>
            </div>
          )}
        </div>
      </section>

      <section className="appointment-form-section" aria-labelledby="appointment-service-section">
        <div className="appointment-form-section-header">
          <span>2</span>
          <div>
            <h3 id="appointment-service-section">Hizmet ve terapist</h3>
            <p>İlk görüşme, çocuk ve yetişkin süreleri yönetim ayarlarından gelir; gerektiğinde hizmet veya özel süre seçilebilir.</p>
          </div>
        </div>
        <div className="booking-field-grid">
          <label className="booking-field">
            Hizmet
            <SelectControl
              disabled={busy}
              name="serviceId"
              onValueChange={(value) => {
                setServiceId(value);
                setDurationMode("CONTEXT_DEFAULT");
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
        </div>
      </section>

      <section className="appointment-form-section" aria-labelledby="appointment-time-section">
        <div className="appointment-form-section-header">
          <span>3</span>
          <div>
            <h3 id="appointment-time-section">Tarih, saat ve süre</h3>
            <p>Seçilen saat doğrudan onaylı randevu olarak açılır; aynı terapistte çakışma engellenir.</p>
          </div>
        </div>
        <div className="booking-field-grid appointment-time-grid">
          <label className="booking-field appointment-date-field">
            Tarih
            <DateControl
              disabled={busy}
              name="appointmentDate"
              onValueChange={setAppointmentDate}
              required
              value={appointmentDate}
            />
            <small>Randevu tarihini custom takvimden seçin.</small>
          </label>
          <label className="booking-field">
            Saat
            <SelectControl
              disabled={busy}
              name="appointmentTime"
              onValueChange={setAppointmentTime}
              options={appointmentTimeOptions}
              required
              value={appointmentTime}
            />
            <small>Saatler 15 dakikalık aralıklarla gösterilir.</small>
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
        </div>
      </section>

      <section className="appointment-form-section" aria-labelledby="appointment-location-section">
        <div className="appointment-form-section-header">
          <span>4</span>
          <div>
            <h3 id="appointment-location-section">Görüşme tipi ve not</h3>
            <p>Operasyon notu klinik not değildir; sadece randevu takibi için kullanılır.</p>
          </div>
        </div>
        <div className="booking-field-grid appointment-final-grid">
          <label className="booking-field">
            Görüşme tipi
            <SelectControl
              defaultValue="SERVICE_DEFAULT"
              disabled={busy}
              name="locationType"
              options={locationOptions}
            />
          </label>
          <label className="booking-field appointment-note-field">
            Kısa operasyon notu
            <textarea
              disabled={busy}
              maxLength={500}
              name="requestNote"
              placeholder="Örn. İlk görüşme öncesi telefonla teyit edildi."
              rows={5}
            />
            <small>Bu alan klinik not için değil, operasyon notu içindir.</small>
          </label>
        </div>
      </section>

      <div className="appointment-form-actions">
        <button className="primary-button booking-button" disabled={busy} type="submit">
          {busy ? "Oluşturuluyor..." : "Randevu oluştur"}
        </button>
        {message ? <p className="admin-inline-error">{message}</p> : null}
      </div>
    </form>
  );
}
