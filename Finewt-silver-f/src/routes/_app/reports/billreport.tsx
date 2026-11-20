import BillReport from '@/components/reports/BillReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/billreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BillReport />;
}
