import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `import { ClientDetails, Appointment, Plan, DocumentRecord, PaymentRecord, PaymentInstallment } from '../types';`,
    `import { ClientDetails, Appointment, Plan, DocumentRecord, PaymentRecord, PaymentInstallment } from '../types';
import { createCorrelationId } from '../lib/correlation-id';`,
    "Client hub correlation id import",
  );
  source = source.replaceAll("crypto.randomUUID()", "createCorrelationId()");
  source = replaceRequired(
    source,
    `const docCategoryOptions = [`,
    `const toLocalDateInput = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};
const monthsFromNowInput = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return toLocalDateInput(date);
};

const docCategoryOptions = [`,
    "Current local date helper",
  );
  source = replaceRequired(
    source,
    `    date: '2026-07-25',`,
    `    date: toLocalDateInput(),`,
    "Dynamic appointment date",
  );
  source = replaceRequired(
    source,
    `  const [docForm, setDocForm] = useState({
    name: 'Gelişim Gözlem Formu.pdf',
    type: 'Yüklenen Belge' as 'Bilgi Formu' | 'Onam Formu' | 'Yüklenen Belge' | 'Paylaşılan PDF',
  });`,
    `  const [docForm, setDocForm] = useState({
    name: 'Gelişim Gözlem Formu.pdf',
    type: 'Yüklenen Belge' as 'Bilgi Formu' | 'Onam Formu' | 'Yüklenen Belge' | 'Paylaşılan PDF',
    file: null as File | null,
  });`,
    "Real document file state",
  );
  source = replaceRequired(
    source,
    `  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };`,
    `  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const requireSuccess = async (response: Response) => {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      throw new Error(payload?.error || 'İşlem kaydedilemedi.');
    }
    return payload;
  };`,
    "API response validation helper",
  );

  return source;
});
