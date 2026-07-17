"use client";

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";

import { SelectControl } from "./select-control";

type GuardianOption = {
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  issues?: { message?: string; path: string }[];
};

type ClientType = "ADULT" | "CHILD";
type GuardianMode = "EXISTING" | "NEW";

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { error: "Beklenmeyen bir sunucu yanıtı alındı." };
  }
}

function optionalValue(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function issueMessage(payload: ApiResponse<unknown>): string {
  const firstIssue = payload.issues?.find((issue) => issue.message)?.message;
  return firstIssue ?? payload.error ?? "Danışan kaydedilemedi.";
}

export function ClientCreateForm({ guardians }: { guardians: GuardianOption[] }) {
  const requestIdRef = useRef<string | null>(null);
  const [clientType, setClientType] = useState<ClientType>("ADULT");
  const [guardianMode, setGuardianMode] = useState<GuardianMode>("EXISTING");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const guardianOptions = useMemo(
    () =>
      guardians.map((guardian) => ({
        label: `${guardian.firstName} ${guardian.lastName} · ${guardian.phone}`,
        value: guardian.id,
      })),
    [guardians],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (
      clientType === "CHILD" &&
      guardianMode === "EXISTING" &&
      !optionalValue(formData, "guardianId")
    ) {
      setMessage("Çocuk danışan için mevcut veli seçmelisiniz veya yeni veli oluşturmalısınız.");
      return;
    }

    if (clientType === "CHILD" && !optionalValue(formData, "relationship")) {
      setMessage("Çocuk danışan için veli yakınlığı zorunludur.");
      return;
    }

    if (clientType === "CHILD" && guardianMode === "NEW") {
      const requiredGuardianFields = ["guardianFirstName", "guardianLastName", "guardianPhone"];
      if (requiredGuardianFields.some((field) => !optionalValue(formData, field))) {
        setMessage("Yeni veli oluşturmak için veli adı, soyadı ve telefonu zorunludur.");
        return;
      }
    }

    const requestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = requestId;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/clients", {
        body: JSON.stringify({
          birthYear: optionalValue(formData, "birthYear"),
          email: optionalValue(formData, "email"),
          firstName: optionalValue(formData, "firstName"),
          guardianEmail: optionalValue(formData, "guardianEmail"),
          guardianFirstName: optionalValue(formData, "guardianFirstName"),
          guardianId: optionalValue(formData, "guardianId"),
          guardianLastName: optionalValue(formData, "guardianLastName"),
          guardianMode: clientType === "CHILD" ? guardianMode : null,
          guardianPhone: optionalValue(formData, "guardianPhone"),
          lastName: optionalValue(formData, "lastName"),
          phone: optionalValue(formData, "phone"),
          preferredName: optionalValue(formData, "preferredName"),
          relationship: optionalValue(formData, "relationship"),
          requestId,
          status: optionalValue(formData, "status") ?? "PROSPECTIVE",
          type: clientType,
        }),
        headers: {
          "content-type": "application/json",
          "x-correlation-id": requestId,
        },
        method: "POST",
      });
      const payload = await readResponse<{ id: string }>(response);
      if (!response.ok || !payload.data) throw new Error(issueMessage(payload));
      window.location.assign(`/yonetim/danisan-profili?clientId=${payload.data.id}`);
    } catch (error) {
      setMessage(
        error instanceof Error && error.message ? error.message : "Danışan kaydedilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="booking-field-grid">
        <label className="booking-field">
          Danışan tipi
          <SelectControl
            disabled={busy}
            name="type"
            onValueChange={(value) => setClientType(value as ClientType)}
            options={[
              { label: "Yetişkin", value: "ADULT" },
              { label: "Çocuk", value: "CHILD" },
            ]}
            value={clientType}
          />
        </label>
        <label className="booking-field">
          Statü
          <SelectControl
            defaultValue="PROSPECTIVE"
            disabled={busy}
            name="status"
            options={[
              { label: "Ön görüşme", value: "PROSPECTIVE" },
              { label: "Aktif", value: "ACTIVE" },
              { label: "Pasif", value: "INACTIVE" },
            ]}
          />
        </label>
        <label className="booking-field">
          Ad
          <input
            autoComplete="given-name"
            disabled={busy}
            maxLength={120}
            name="firstName"
            required
          />
        </label>
        <label className="booking-field">
          Soyad
          <input
            autoComplete="family-name"
            disabled={busy}
            maxLength={120}
            name="lastName"
            required
          />
        </label>
        <label className="booking-field">
          Tercih edilen ad
          <input disabled={busy} maxLength={120} name="preferredName" />
        </label>
        <label className="booking-field">
          Doğum yılı
          <input disabled={busy} inputMode="numeric" maxLength={4} name="birthYear" />
        </label>
        <label className="booking-field">
          Telefon
          <input autoComplete="tel" disabled={busy} maxLength={40} name="phone" />
        </label>
        <label className="booking-field">
          E-posta
          <input autoComplete="email" disabled={busy} maxLength={320} name="email" type="email" />
        </label>
      </div>

      {clientType === "CHILD" ? (
        <fieldset className="booking-guardian-fields">
          <legend>Veli bilgileri</legend>
          <p>Çocuk danışan veli kaydı olmadan oluşturulamaz.</p>

          <div className="booking-subject-type">
            <label>
              <input
                checked={guardianMode === "EXISTING"}
                disabled={busy}
                name="guardianModeOption"
                onChange={() => setGuardianMode("EXISTING")}
                type="radio"
              />
              Mevcut veli seç
            </label>
            <label>
              <input
                checked={guardianMode === "NEW"}
                disabled={busy}
                name="guardianModeOption"
                onChange={() => setGuardianMode("NEW")}
                type="radio"
              />
              Yeni veli oluştur
            </label>
          </div>

          <div className="booking-field-grid">
            {guardianMode === "EXISTING" ? (
              <label className="booking-field">
                Mevcut veli
                <SelectControl
                  disabled={busy || guardianOptions.length === 0}
                  name="guardianId"
                  options={guardianOptions}
                  placeholder={guardianOptions.length === 0 ? "Kayıtlı veli yok" : "Veli seçin"}
                />
                {guardianOptions.length === 0 ? (
                  <small>Henüz kayıtlı veli yoksa yeni veli oluştur seçeneğini kullanın.</small>
                ) : null}
              </label>
            ) : (
              <>
                <label className="booking-field">
                  Veli adı
                  <input disabled={busy} maxLength={120} name="guardianFirstName" required />
                </label>
                <label className="booking-field">
                  Veli soyadı
                  <input disabled={busy} maxLength={120} name="guardianLastName" required />
                </label>
                <label className="booking-field">
                  Veli telefonu
                  <input disabled={busy} maxLength={40} name="guardianPhone" required />
                </label>
                <label className="booking-field">
                  Veli e-postası
                  <input disabled={busy} maxLength={320} name="guardianEmail" type="email" />
                </label>
              </>
            )}
            <label className="booking-field">
              Yakınlık
              <input
                disabled={busy}
                maxLength={80}
                name="relationship"
                placeholder="Anne, baba, bakım veren..."
                required
              />
            </label>
          </div>
        </fieldset>
      ) : null}

      <button className="primary-button booking-button" disabled={busy} type="submit">
        {busy ? "Kaydediliyor..." : "Danışan oluştur"}
      </button>
      {message ? <p className="admin-inline-error">{message}</p> : null}
    </form>
  );
}
