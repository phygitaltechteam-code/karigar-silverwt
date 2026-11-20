import Settlement from '@/components/setllement/Settlement';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/setlment/settlement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Settlement />;
}
