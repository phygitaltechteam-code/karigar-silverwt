import ClientMaster from '@/components/Client/ClientMaster';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/client/client')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ClientMaster />;
}
