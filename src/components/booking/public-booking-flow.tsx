"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ConsentDocument = {
  content: string;
  id: string;
  title: string;
  type: string;
  version: string;
};
type BookingBootstrap = {
  consentDocuments: ConsentDocument[];
  practitioner: { displayName: string; id: string; timeZone: string };
  services: {
    description: string | null;
    durationMinutes: number;
    id: string;
    locationType: "IN_PERSON" | "ONLINE" | "HYBRID";
    name: string;
  }[];
};
type Slot = { endsAt: string; startsAt: string };
type Hold = Slot & { expiresAt: string; holdId: string; holderToken: string };
type BookingResult = { appointmentId: string; publicReference: string; status: "REQUESTED" };
type ApiResponse<T> = { code?: string; data?: T; error?: string };

const locationLabels = {
  HYBRID: "Yüz yüze veya çevrim içi",
  IN_PERSON: "Yüz yüze",
  ONLINE: "Çevrim içi",
} as const;

function todayForDateInput(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { error: "Beklenmeyen bir yanıt alındı. Lütfen yeniden deneyin." };
  }
}

function formatSlot(isoDate: string, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(isoDate));
}

function formatDateTime(isoDate: string, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(new Date(isoDate));
}

function DisabledBookingPreview() {
  return (
    <section className="booking-flow booking-flow--disabled" aria-labelledby="booking-flow-title">
      <div className="booking-flow-intro">
        <p className="section-kicker">Randevu talebi</p>
        <h1 id="booking-flow-title">Talep ekranı hazır, yayın kapısı henüz kapalı.</h1>
        <p>
          Uygun saat, minimum iletişim bilgisi ve gerekli bilgilendirme metinleri tek akışta
          tamamlanacak. Hukuki ve operasyonel yayın onayı verilene kadar form kişisel bilgi kabul
          etmez.
        </p>
        <div className="booking-readiness" role="status">
          <i aria-hidden="true" />
          <span>Yeni randevu talebi şu anda kapalı</span>
        </div>
      </div>
      <ol className="booking-preview-steps" aria-label="Randevu talebi adımları">
        <li>
          <span>1</span>
          <div>
            <strong>Hizmet ve uzman</strong>
            <small>Görüşme biçimi ve süre</small>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Uygun saat</strong>
            <small>Canlı takvim ve çakışma kontrolü</small>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Minimum bilgi</strong>
            <small>Klinik öykü veya dosya yükleme yok</small>
          </div>
        </li>
        <li>
          <span>4</span>
          <div>
            <strong>Bilgilendirme ve talep</strong>
            <small>Talep, kontrol sonrası kesinleşir</small>
          </div>
        </li>
      </ol>
    </section>
  );
}

export function PublicBookingFlow({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [bootstrap, setBootstrap] = useState<BookingBootstrap | null>(null);
  const [bootstrapState, setBootstrapState] = useState<"loading" | "ready" | "disabled" | "error">(
    initiallyEnabled ? "loading" : "disabled",
  );
  const [serviceId, setServiceId] = useState("");
  const [localDate, setLocalDate] = useState(todayForDateInput);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStartsAt, setSelectedStartsAt] = useState("");
  const [hold, setHold] = useState<Hold | null>(null);
  const [subjectType, setSubjectType] = useState<"ADULT" | "CHILD">("ADULT");
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<"slots" | "hold" | "submit" | null>(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (!initiallyEnabled) return;

    const controller = new AbortController();
    void fetch("/api/public/appointments/bootstrap", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await readApiResponse<BookingBootstrap>(response);
        if (response.status === 404) {
          setBootstrapState("disabled");
          return;
        }
        if (!response.ok || !payload.data) {
          setMessage(payload.error ?? "Randevu bilgileri şu anda yüklenemiyor.");
          setBootstrapState("error");
          return;
        }
        setBootstrap(payload.data);
        setServiceId(payload.data.services[0]?.id ?? "");
        setBootstrapState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage("Randevu bilgileri şu anda yüklenemiyor. Lütfen daha sonra yeniden deneyin.");
        setBootstrapState("error");
      });
    return () => controller.abort();
  }, [initiallyEnabled]);

  const selectedService = useMemo(
    () => bootstrap?.services.find((service) => service.id === serviceId) ?? null,
    [bootstrap, serviceId],
  );

  if (bootstrapState === "loading") {
    return (
      <section className="booking-flow booking-flow--loading" aria-busy="true" aria-live="polite">
        <p className="section-kicker">Randevu talebi</p>
        <h1>Randevu seçenekleri hazırlanıyor…</h1>
      </section>
    );
  }
  if (bootstrapState === "disabled") return <DisabledBookingPreview />;
  if (bootstrapState === "error" || !bootstrap) {
    return (
      <section className="booking-flow booking-flow--disabled" role="alert">
        <p className="section-kicker">Randevu talebi</p>
        <h1>Bu alan şu anda kullanılamıyor.</h1>
        <p>{message}</p>
      </section>
    );
  }

  async function loadSlots(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bootstrap || !serviceId || !localDate) return;
    setBusyAction("slots");
    setMessage("");
    setSlots([]);
    setSelectedStartsAt("");
    setHold(null);
    const query = new URLSearchParams({
      localDate,
      practitionerId: bootstrap.practitioner.id,
      serviceId,
    });
    try {
      const response = await fetch(`/api/public/appointments/slots?${query}`, {
        cache: "no-store",
      });
      const payload = await readApiResponse<Slot[]>(response);
      if (!response.ok || !payload.data) throw new Error(payload.error);
      setSlots(payload.data);
      if (payload.data.length === 0) setMessage("Bu tarih için uygun saat bulunamadı.");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Saatler yüklenemedi.");
    } finally {
      setBusyAction(null);
    }
  }

  async function reserveSelectedSlot() {
    if (!bootstrap || !selectedStartsAt || !serviceId) return;
    setBusyAction("hold");
    setMessage("");
    try {
      const response = await fetch("/api/public/appointments/holds", {
        body: JSON.stringify({
          practitionerId: bootstrap.practitioner.id,
          serviceId,
          startsAt: selectedStartsAt,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await readApiResponse<Hold>(response);
      if (!response.ok || !payload.data) throw new Error(payload.error);
      setHold(payload.data);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Saat ayrılamadı.");
    } finally {
      setBusyAction(null);
    }
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hold || !bootstrap) return;
    if (acknowledgedIds.length !== bootstrap.consentDocuments.length) {
      setMessage("Devam etmek için gerekli metinlerin her birini okuyup ayrı ayrı onaylayın.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const commonSubject = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
    };
    const subject =
      subjectType === "ADULT"
        ? {
            ...commonSubject,
            email: String(form.get("email") ?? ""),
            phone: String(form.get("phone") ?? ""),
            type: "ADULT" as const,
          }
        : {
            ...commonSubject,
            guardian: {
              email: String(form.get("guardianEmail") ?? ""),
              firstName: String(form.get("guardianFirstName") ?? ""),
              lastName: String(form.get("guardianLastName") ?? ""),
              phone: String(form.get("guardianPhone") ?? ""),
              relationship: String(form.get("guardianRelationship") ?? "PARENT_DECLARED"),
            },
            type: "CHILD" as const,
          };
    setBusyAction("submit");
    setMessage("");
    try {
      const response = await fetch("/api/public/appointments/requests", {
        body: JSON.stringify({
          acknowledgedDocumentIds: acknowledgedIds,
          holdId: hold.holdId,
          holderToken: hold.holderToken,
          subject,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await readApiResponse<BookingResult>(response);
      if (!response.ok || !payload.data) throw new Error(payload.error);
      setResult(payload.data);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Talep gönderilemedi.");
    } finally {
      setBusyAction(null);
    }
  }

  if (result) {
    return (
      <section className="booking-flow booking-success" aria-labelledby="booking-success-title">
        <p className="section-kicker">Talebiniz alındı</p>
        <h1 id="booking-success-title">Randevu talebiniz incelemeye hazır.</h1>
        <p>
          Bu bir kesin randevu değildir. Kontrol tamamlandığında sizinle iletişime geçilecektir.
        </p>
        <div className="booking-reference">
          <span>Talep numarası</span>
          <strong>{result.publicReference}</strong>
        </div>
        <p className="booking-privacy-note">Takip için bu numarayı not edebilirsiniz.</p>
      </section>
    );
  }

  return (
    <section className="booking-flow" aria-labelledby="booking-flow-title">
      <header className="booking-flow-intro">
        <p className="section-kicker">Randevu talebi</p>
        <h1 id="booking-flow-title">Size uygun zamanı birlikte bulalım.</h1>
        <p>
          Bu form yalnızca talep oluşturur; randevu, uzman değerlendirmesi ve iletişim sonrasında
          kesinleşir. Klinik öykü veya belge yüklemeniz istenmez.
        </p>
      </header>
      <div className="booking-flow-grid">
        <div className="booking-flow-main">
          <form className="booking-step" onSubmit={loadSlots}>
            <div className="booking-step-heading">
              <span>1</span>
              <div>
                <h2>Hizmet ve tarih</h2>
                <p>Uzmanı, görüşme biçimini ve günü seçin.</p>
              </div>
            </div>
            <div className="booking-field-grid">
              <label className="booking-field">
                <span>Uzman</span>
                <select value={bootstrap.practitioner.id} disabled>
                  <option>{bootstrap.practitioner.displayName}</option>
                </select>
              </label>
              <label className="booking-field">
                <span>Hizmet</span>
                <select
                  value={serviceId}
                  onChange={(event) => {
                    setServiceId(event.target.value);
                    setSlots([]);
                    setHold(null);
                  }}
                  required
                >
                  {bootstrap.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="booking-field">
                <span>Tarih</span>
                <input
                  min={todayForDateInput()}
                  name="localDate"
                  onChange={(event) => {
                    setLocalDate(event.target.value);
                    setSlots([]);
                    setHold(null);
                  }}
                  required
                  type="date"
                  value={localDate}
                />
              </label>
            </div>
            {selectedService && (
              <p className="booking-service-detail">
                <strong>{selectedService.durationMinutes} dakika</strong>
                <span>{locationLabels[selectedService.locationType]}</span>
                {selectedService.description && <span>{selectedService.description}</span>}
              </p>
            )}
            <button
              className="primary-button booking-button"
              disabled={busyAction !== null}
              type="submit"
            >
              {busyAction === "slots" ? "Saatler aranıyor…" : "Uygun saatleri göster"}
            </button>
          </form>
          {slots.length > 0 && !hold && (
            <div className="booking-step">
              <div className="booking-step-heading">
                <span>2</span>
                <div>
                  <h2>Uygun saat</h2>
                  <p>Seçtiğiniz saat kısa süreliğine sizin için ayrılır.</p>
                </div>
              </div>
              <fieldset className="booking-slot-fieldset">
                <legend className="sr-only">Uygun saatler</legend>
                <div className="booking-slots">
                  {slots.map((slot) => (
                    <label
                      className={
                        selectedStartsAt === slot.startsAt
                          ? "booking-slot booking-slot--selected"
                          : "booking-slot"
                      }
                      key={slot.startsAt}
                    >
                      <input
                        checked={selectedStartsAt === slot.startsAt}
                        name="slot"
                        onChange={() => setSelectedStartsAt(slot.startsAt)}
                        type="radio"
                        value={slot.startsAt}
                      />
                      <span>{formatSlot(slot.startsAt, bootstrap.practitioner.timeZone)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                className="primary-button booking-button"
                disabled={!selectedStartsAt || busyAction !== null}
                onClick={reserveSelectedSlot}
                type="button"
              >
                {busyAction === "hold" ? "Saat ayrılıyor…" : "Bu saati ayır ve devam et"}
              </button>
            </div>
          )}
          {hold && (
            <form className="booking-step booking-details-form" onSubmit={submitBooking}>
              <div className="booking-hold-summary" role="status">
                <strong>{formatDateTime(hold.startsAt, bootstrap.practitioner.timeZone)}</strong>
                <span>
                  Bu saat {formatSlot(hold.expiresAt, bootstrap.practitioner.timeZone)}’e kadar
                  ayrıldı.
                </span>
              </div>
              <div className="booking-step-heading">
                <span>3</span>
                <div>
                  <h2>Minimum iletişim bilgisi</h2>
                  <p>
                    Yalnızca talebi değerlendirmek ve sizinle iletişim kurmak için gereken alanlar.
                  </p>
                </div>
              </div>
              <fieldset className="booking-subject-type">
                <legend>Randevu kimin için?</legend>
                <label>
                  <input
                    checked={subjectType === "ADULT"}
                    name="subjectType"
                    onChange={() => setSubjectType("ADULT")}
                    type="radio"
                  />
                  <span>Yetişkin</span>
                </label>
                <label>
                  <input
                    checked={subjectType === "CHILD"}
                    name="subjectType"
                    onChange={() => setSubjectType("CHILD")}
                    type="radio"
                  />
                  <span>Çocuk / ergen</span>
                </label>
              </fieldset>
              <div className="booking-field-grid">
                <label className="booking-field">
                  <span>{subjectType === "ADULT" ? "Adınız" : "Çocuğun adı"}</span>
                  <input autoComplete="given-name" maxLength={120} name="firstName" required />
                </label>
                <label className="booking-field">
                  <span>{subjectType === "ADULT" ? "Soyadınız" : "Çocuğun soyadı"}</span>
                  <input autoComplete="family-name" maxLength={120} name="lastName" required />
                </label>
                {subjectType === "ADULT" && (
                  <>
                    <label className="booking-field">
                      <span>Telefon</span>
                      <input
                        autoComplete="tel"
                        maxLength={40}
                        minLength={7}
                        name="phone"
                        required
                        type="tel"
                      />
                    </label>
                    <label className="booking-field">
                      <span>
                        E-posta <small>(isteğe bağlı)</small>
                      </span>
                      <input autoComplete="email" maxLength={320} name="email" type="email" />
                    </label>
                  </>
                )}
              </div>
              {subjectType === "CHILD" && (
                <fieldset className="booking-guardian-fields">
                  <legend>Veli / yasal temsilci</legend>
                  <p>
                    Bu aşamada ilişki beyan olarak kaydedilir; kesin randevudan önce yetki kontrol
                    edilir.
                  </p>
                  <div className="booking-field-grid">
                    <label className="booking-field">
                      <span>Veli adı</span>
                      <input
                        autoComplete="given-name"
                        maxLength={120}
                        name="guardianFirstName"
                        required
                      />
                    </label>
                    <label className="booking-field">
                      <span>Veli soyadı</span>
                      <input
                        autoComplete="family-name"
                        maxLength={120}
                        name="guardianLastName"
                        required
                      />
                    </label>
                    <label className="booking-field">
                      <span>Telefon</span>
                      <input
                        autoComplete="tel"
                        maxLength={40}
                        minLength={7}
                        name="guardianPhone"
                        required
                        type="tel"
                      />
                    </label>
                    <label className="booking-field">
                      <span>
                        E-posta <small>(isteğe bağlı)</small>
                      </span>
                      <input
                        autoComplete="email"
                        maxLength={320}
                        name="guardianEmail"
                        type="email"
                      />
                    </label>
                    <label className="booking-field">
                      <span>Yakınlık / temsil ilişkisi</span>
                      <select name="guardianRelationship" required>
                        <option value="PARENT_DECLARED">Anne / baba</option>
                        <option value="LEGAL_REPRESENTATIVE_DECLARED">Yasal temsilci</option>
                        <option value="OTHER_DECLARED">Diğer</option>
                      </select>
                    </label>
                  </div>
                </fieldset>
              )}
              <div className="booking-step-heading booking-consent-heading">
                <span>4</span>
                <div>
                  <h2>Bilgilendirme ve koşullar</h2>
                  <p>Her metni ayrı okuyup onaylayın.</p>
                </div>
              </div>
              <div className="booking-consents">
                {bootstrap.consentDocuments.map((document) => (
                  <article className="booking-consent" key={document.id}>
                    <header>
                      <h3>{document.title}</h3>
                      <small>Sürüm {document.version}</small>
                    </header>
                    <div className="booking-consent-content" tabIndex={0}>
                      {document.content}
                    </div>
                    <label>
                      <input
                        checked={acknowledgedIds.includes(document.id)}
                        onChange={(event) =>
                          setAcknowledgedIds((current) =>
                            event.target.checked
                              ? [...current, document.id]
                              : current.filter((id) => id !== document.id),
                          )
                        }
                        required
                        type="checkbox"
                      />
                      <span>
                        {document.type === "PRIVACY_NOTICE" || document.type === "BOOKING_TERMS"
                          ? "Bu metni okudum ve anladım."
                          : "Bu açık rıza metnini okudum ve rıza gösteriyorum."}
                      </span>
                    </label>
                  </article>
                ))}
              </div>
              <p className="booking-privacy-note">
                Formda sağlık öyküsü veya hassas belge paylaşmayın. Saat ayırma anahtarı tarayıcı
                depolamasına yazılmaz.
              </p>
              <button
                className="primary-button booking-button"
                disabled={busyAction !== null}
                type="submit"
              >
                {busyAction === "submit" ? "Talep gönderiliyor…" : "Randevu talebini gönder"}
              </button>
            </form>
          )}
        </div>
        <aside className="booking-flow-aside" aria-label="Talep özeti">
          <p className="section-kicker">Talep özeti</p>
          <dl>
            <div>
              <dt>Uzman</dt>
              <dd>{bootstrap.practitioner.displayName}</dd>
            </div>
            <div>
              <dt>Hizmet</dt>
              <dd>{selectedService?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Görüşme</dt>
              <dd>{selectedService ? locationLabels[selectedService.locationType] : "—"}</dd>
            </div>
            <div>
              <dt>Zaman</dt>
              <dd>
                {hold
                  ? formatDateTime(hold.startsAt, bootstrap.practitioner.timeZone)
                  : "Henüz seçilmedi"}
              </dd>
            </div>
          </dl>
          <p>
            Gönderimden sonra talebiniz incelenir. Bu ekran tek başına kesin randevu oluşturmaz.
          </p>
        </aside>
      </div>
      <p className="booking-live-message" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
