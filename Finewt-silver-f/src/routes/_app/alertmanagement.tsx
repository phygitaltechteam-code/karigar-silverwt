import AlertManagement from '@/components/AlertManagement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/alertmanagement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AlertManagement />;
}
