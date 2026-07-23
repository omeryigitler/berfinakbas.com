import { EmptyState, type ModuleViewsProps } from './shared';
import { useAvailabilityController } from './availability-controller';
import AvailabilityRulesView from './AvailabilityRulesView';
import AvailabilityExceptionsView from './AvailabilityExceptionsView';
import AvailabilitySettingsView from './AvailabilitySettingsView';

export default function AvailabilityView(props: ModuleViewsProps) {
  const controller = useAvailabilityController(props);
  if (!props.data?.practitioner) return <EmptyState title="Aktif terapist kaydı bulunamadı" text="Çalışma saatlerini yönetmek için Berfin Akbaş hesabına bağlı aktif terapist kaydı gerekir." />;
  if (props.selectedItemId === 'calisma-saatleri') return <AvailabilityRulesView data={props.data} controller={controller} />;
  if (props.selectedItemId === 'ozel-saatler' || props.selectedItemId === 'kapali-zamanlar') return <AvailabilityExceptionsView props={props} controller={controller} />;
  return <AvailabilitySettingsView props={props} controller={controller} />;
}
