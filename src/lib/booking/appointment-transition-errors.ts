export class AppointmentNotStartedError extends Error {
  readonly code = "APPOINTMENT_NOT_STARTED";

  constructor(readonly startsAt: Date) {
    super("Başlangıç zamanı gelmemiş bir randevu tamamlanamaz.");
    this.name = "AppointmentNotStartedError";
  }
}

export class AppointmentCompletionPlanRequiredError extends Error {
  readonly code = "PLAN_SELECTION_REQUIRED";

  constructor() {
    super("Seans düşülecek aktif plan seçilmelidir.");
    this.name = "AppointmentCompletionPlanRequiredError";
  }
}

export class AppointmentCompletionPlanInvalidError extends Error {
  readonly code = "INVALID_PLAN";

  constructor() {
    super("Seçilen plan danışana ait aktif ve kullanılabilir bir plan değil.");
    this.name = "AppointmentCompletionPlanInvalidError";
  }
}
