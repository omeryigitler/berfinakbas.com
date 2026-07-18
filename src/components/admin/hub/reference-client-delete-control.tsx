"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isReferenceClientId } from "@/domain/clients/reference-clients";

import styles from "./reference-client-delete-control.module.css";

export function ReferenceClientDeleteControl({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("kayit");
  const isClientSection = searchParams.get("bolum") === "danisanlar";
  const visible = canManage && isClientSection && isReferenceClientId(selectedId);
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setArmed(false);
    setError(null);
  }, [selectedId]);

  if (!visible || !selectedId) return null;

  async function permanentlyDelete() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/clients/${encodeURIComponent(selectedId)}`, {
        headers: { accept: "application/json" },
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Danışan silinemedi.");

      const next = new URLSearchParams(searchParams.toString());
      next.delete("kayit");
      const query = next.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Danışan silinemedi.");
    } finally {
      setPending(false);
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
            onClick={() => setArmed(false)}
            type="button"
          >
            Vazgeç
          </button>
        </span>
      ) : (
        <button className={styles.armButton} onClick={() => setArmed(true)} type="button">
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
