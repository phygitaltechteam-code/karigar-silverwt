import ManufacturingReport from '@/components/reports/ManufcaturingReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/manufacturingreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ManufacturingReport />;
}
