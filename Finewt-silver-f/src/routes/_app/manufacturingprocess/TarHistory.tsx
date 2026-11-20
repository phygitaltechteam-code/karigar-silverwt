import TarHistory from '@/components/erp/manufacturingprocess/TarHistory';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/manufacturingprocess/TarHistory')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TarHistory />;
}
