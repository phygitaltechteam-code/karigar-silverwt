import SKundaDept from '@/components/erp/manufacturingprocess/skunda/SKundaDept';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/manufacturingprocess/skunda')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SKundaDept />;
}
