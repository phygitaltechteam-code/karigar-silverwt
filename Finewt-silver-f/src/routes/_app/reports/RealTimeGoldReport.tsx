import RealTimeGoldReport from '@/components/reports/RealTImeGoldReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/RealTimeGoldReport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RealTimeGoldReport />;
}
