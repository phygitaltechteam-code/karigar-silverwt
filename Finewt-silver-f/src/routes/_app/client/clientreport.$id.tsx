import ClientReport from '@/components/Client/ClientReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/client/clientreport/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ClientReport />;
}
