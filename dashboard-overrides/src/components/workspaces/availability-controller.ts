import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { postAction, type ModuleViewsProps } from './shared';

export const weekdayLabels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export function useAvailabilityController(props: ModuleViewsProps) {
  const { data, selectedItemId, refresh, notify } = props;
  const [saving, setSaving] = useState(false);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [settingsValue, setSettingsValue] = useState<Record<string, any>>({});

  useEffect(() => {
    const current = data?.rules ?? [];
    setRules(
      weekdayLabels.map((_, index) => {
        const row = current.find((item: any) => item.weekday === index + 1 && item.status === 'ACTIVE');
        return {
          weekday: index + 1,
          active: Boolean(row),
          start: row?.localStartTime ?? '09:00',
          end: row?.localEndTime ?? '17:00',
          slotIncrementMinutes: row?.slotIncrementMinutes ?? 15,
        };
      }),
    );
    const key = selectedItemId === 'ilk-gorusme' ? 'FIRST_MEETING_SETTINGS' : 'BOOKING_RULES';
    setSettingsValue(data?.settings?.[key]?.value ?? {});
  }, [data, selectedItemId]);

  async function saveRules() {
    setSaving(true);
    try {
      await postAction({ action: 'SAVE_AVAILABILITY_RULES', rules });
      notify({ kind: 'success', title: 'Çalışma saatleri kaydedildi', message: 'Haftalık uygunluk kuralları güncellendi.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Çalışma saatleri kaydedilemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    } finally {
      setSaving(false);
    }
  }

  async function createException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = selectedItemId === 'ozel-saatler' ? 'CUSTOM_HOURS' : String(form.get('type') ?? 'CLOSED');
    setSaving(true);
    try {
      await postAction({
        action: 'CREATE_AVAILABILITY_EXCEPTION',
        type,
        date: String(form.get('date') ?? ''),
        start: type === 'CLOSED' ? null : String(form.get('start') ?? ''),
        end: type === 'CLOSED' ? null : String(form.get('end') ?? ''),
        reasonCode: String(form.get('reasonCode') ?? 'MANUAL'),
        privateNote: String(form.get('privateNote') ?? '').trim() || null,
      });
      setExceptionOpen(false);
      notify({ kind: 'success', title: type === 'CUSTOM_HOURS' ? 'Özel saat eklendi' : 'Kapalı zaman eklendi', message: 'Takvim istisnası kaydedildi.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Takvim istisnası eklenemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleException(item: any) {
    try {
      await postAction({ action: 'SET_AVAILABILITY_EXCEPTION_STATUS', id: item.id, status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      notify({ kind: 'success', title: 'Kayıt durumu güncellendi', message: 'Takvim istisnası kaydedildi.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Durum güncellenemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    }
  }

  async function saveSetting(key: 'BOOKING_RULES' | 'FIRST_MEETING_SETTINGS') {
    setSaving(true);
    try {
      await postAction({
        action: 'SAVE_SETTING',
        key,
        value: settingsValue,
        reason: key === 'FIRST_MEETING_SETTINGS' ? 'İlk görüşme ayarları yönetim panelinden güncellendi.' : 'Randevu kuralları yönetim panelinden güncellendi.',
      });
      notify({ kind: 'success', title: key === 'FIRST_MEETING_SETTINGS' ? 'İlk görüşme ayarları kaydedildi' : 'Randevu kuralları kaydedildi', message: 'Değişiklikler ayar geçmişinde saklandı.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Ayarlar kaydedilemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    exceptionOpen,
    setExceptionOpen,
    rules,
    setRules,
    settingsValue,
    setSettingsValue,
    saveRules,
    createException,
    toggleException,
    saveSetting,
  };
}
