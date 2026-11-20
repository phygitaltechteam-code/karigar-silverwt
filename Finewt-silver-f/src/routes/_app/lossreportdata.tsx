import LossReport from '@/components/LossReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/lossreportdata')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LossReport />;
}
