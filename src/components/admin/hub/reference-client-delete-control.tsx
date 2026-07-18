"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { isReferenceClientId } from "@/domain/clients/reference-clients";

import styles from "./reference-client-delete-control.module.css";

type DeleteError = Readonly<{ id: string; message: string }>;

export function ReferenceClientDeleteControl({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("kayit");
  const isClientSection = searchParams.get("bolum") === "danisanlar";
  const visible = canManage && isClientSection && isReferenceClientId(selectedId);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<DeleteError | null>(null);

  if (!visible || !selectedId) return null;

  const armed = armedId === selectedId;
  const pending = pendingId === selectedId;
  const error = deleteError?.id === selectedId ? deleteError.message : null;

  async function permanentlyDelete() {
    setPendingId(selectedId);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/clients/${encodeURIComponent(selectedId)}`, {
        headers: { accept: "application/json" },
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Danışan silinemedi.");

      setArmedId(null);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("kayit");
      const query = next.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
      router.refresh();
    } catch (errorCaught) {
      setDeleteError({
        id: selectedId,
        message: errorCaught instanceof Error ? errorCaught.message : "Danışan silinemedi.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <aside className={styles.control} aria-label="Referans danışan işlemleri">
      <span className={styles.label}>Referans danışan</span>
      {armed ? (
        <span className={styles.confirmGroup}>
          <button
            className={styles.deleteButton}
            disabled={pending}
            onClick={() => void permanentlyDelete()}
            type="button"
          >
            {pending ? "Siliniyor…" : "Kalıcı olarak sil"}
          </button>
          <button
            className={styles.cancelButton}
            disabled={pending}
            onClick={() => setArmedId(null)}
            type="button"
          >
            Vazgeç
          </button>
        </span>
      ) : (
        <button
          className={styles.armButton}
          onClick={() => {
            setArmedId(selectedId);
            setDeleteError(null);
          }}
          type="button"
        >
          Danışanı sil
        </button>
      )}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </aside>
  );
}
