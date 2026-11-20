import DayReport from '@/components/reports/DayReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/todayreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DayReport />;
}
