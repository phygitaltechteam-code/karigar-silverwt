import Process from '@/components/erp/manufacturingprocess/Process';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/manufacturingprocess/process')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Process />;
}
