import KarigarByIdPage from '@/components/MasterPages/KarigarByIdPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/karigar/kairgerbyid/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  return <KarigarByIdPage />;
}
