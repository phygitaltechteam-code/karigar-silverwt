import BillEdit from '@/components/erp/BillEdit';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/billiupdate/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BillEdit />;
}
