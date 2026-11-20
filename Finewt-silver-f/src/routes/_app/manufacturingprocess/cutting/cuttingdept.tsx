import CuttingProcess from '@/components/erp/manufacturingprocess/cutting/CuttingProcess';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_app/manufacturingprocess/cutting/cuttingdept',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <CuttingProcess />;
}
