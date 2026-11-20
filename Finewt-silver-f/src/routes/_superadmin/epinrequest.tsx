import EPinRequest from '@/components/erp/EPinRequest';
import AppLayout from '@/layouts/AppLayout';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_superadmin/epinrequest')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppLayout>
      <EPinRequest />
    </AppLayout>
  );
}
