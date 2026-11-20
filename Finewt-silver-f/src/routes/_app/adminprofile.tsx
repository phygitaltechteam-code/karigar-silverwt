import AdminProfile from '@/components/AdminProfile';
import {Settings} from '@/components/setting';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/adminprofile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Settings />;
}
