import SolderingProcess from '@/components/erp/manufacturingprocess/soldering/SolderingProcess';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_app/manufacturingprocess/solding/soldingpage',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <SolderingProcess />;
}
