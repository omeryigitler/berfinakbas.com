import AppointmentsView from './AppointmentsView';
import AvailabilityView from './AvailabilityView';
import DemoDataControls from './DemoDataControls';
import { FinanceView, PdfView } from './FinancePdfViews';
import { OverviewView, ClientsView } from './OverviewClientsViews';
import { RequestsView, ServicesView } from './RequestsServicesViews';
import { ArchiveView, ReportsView, SettingsView, UsersView } from './SystemViews';
import { EmptyState, LoadingGrid, type ModuleViewsProps } from './shared';

export default function ModuleViews(props: ModuleViewsProps) {
  if (props.loading) return <LoadingGrid />;
  switch (props.activeMenuItem) {
    case 'ana-panel':
      return <>{props.selectedItemId === 'genel-bakis' ? <DemoDataControls {...props} /> : null}<OverviewView {...props} /></>;
    case 'danisanlar':
      return <ClientsView {...props} />;
    case 'randevular':
      return <AppointmentsView {...props} />;
    case 'takvim-uygunluk':
      return <AvailabilityView {...props} />;
    case 'talepler-iletisim':
      return <RequestsView {...props} />;
    case 'hizmetler':
      return <ServicesView {...props} />;
    case 'odeme-planlar':
      return <FinanceView {...props} />;
    case 'pdf-kaynaklar':
      return <PdfView {...props} />;
    case 'raporlar':
      return <ReportsView {...props} />;
    case 'kullanicilar-yetkiler':
      return <UsersView {...props} />;
    case 'ayarlar':
      return <SettingsView {...props} />;
    case 'arsiv':
      return <ArchiveView {...props} />;
    default:
      return <EmptyState title="Çalışma alanı bulunamadı" text="Bu modül yönetim mimarisine kayıtlı değil." />;
  }
}
