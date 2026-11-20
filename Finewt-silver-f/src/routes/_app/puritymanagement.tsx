import PurityManagement from '@/components/erp/PurityManagement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/puritymanagement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <PurityManagement />;
}
