import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `  const [payForm, setPayForm] = useState({
    amount: 0,
    date: toLocalDateInput(),
    planId: '',
    note: '',
  });`,
    `  const [payForm, setPayForm] = useState({
    amount: 0,
    date: toLocalDateInput(),
    planId: '',
    note: '',
    requestId: createCorrelationId(),
  });
  const [paymentSaving, setPaymentSaving] = useState(false);`,
    "Stable payment request id and saving state",
  );
  source = replaceRequired(
    source,
    `        setPayForm({
          amount: 0,
          date: toLocalDateInput(),
          planId: options.length === 1 ? options[0].id : '',
          note: '',
        });`,
    `        setPayForm({
          amount: 0,
          date: toLocalDateInput(),
          planId: options.length === 1 ? options[0].id : '',
          note: '',
          requestId: createCorrelationId(),
        });`,
    "Renew payment request id when form opens",
  );
  source = replaceRequired(
    source,
    `    try {
      const response = await fetch('/api/admin/payments', {`,
    `    setPaymentSaving(true);
    try {
      const response = await fetch('/api/admin/payments', {`,
    "Payment submission busy state",
  );
  source = replaceRequired(
    source,
    `'x-correlation-id': createCorrelationId(),
        },
        body: JSON.stringify({
          amountMinor: String(Math.round(amount * 100)),`,
    `'x-correlation-id': payForm.requestId,
        },
        body: JSON.stringify({
          amountMinor: String(Math.round(amount * 100)),`,
    "Stable payment idempotency key",
  );
  source = replaceRequired(
    source,
    `    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.', 'error');
    }
  };

  // Add a document`,
    `    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.', 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  // Add a document`,
    "Payment submission busy state cleanup",
  );
  source = replaceRequired(
    source,
    `<button type="submit" className="px-5 py-2 bg-black text-[#eafda8] rounded-xl font-black shadow-md hover:bg-gray-900 transition-all">Ödemeyi İşle</button>`,
    `<button type="submit" disabled={paymentSaving} className="px-5 py-2 bg-black text-[#eafda8] rounded-xl font-black shadow-md hover:bg-gray-900 transition-all disabled:opacity-50">{paymentSaving ? 'Kaydediliyor...' : 'Ödemeyi İşle'}</button>`,
    "Disable duplicate payment submissions",
  );
  return source;
});
