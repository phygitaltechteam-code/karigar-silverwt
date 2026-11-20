import SizeMaster from '@/components/erp/masters/SizeMaster';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/master/size')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SizeMaster />;
}
