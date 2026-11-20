import BoxDept from '@/components/erp/manufacturingprocess/boxdept/BoxDept';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/manufacturingprocess/box/boxdept')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BoxDept />;
}
