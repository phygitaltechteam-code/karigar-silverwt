import AdminCreate from '@/components/erp/AdminCreate';
import AppLayout from '@/layouts/AppLayout';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_superadmin/addadmin')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppLayout>
      <AdminCreate />
    </AppLayout>
  );
}
