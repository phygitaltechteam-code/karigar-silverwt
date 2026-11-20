import ItemMaster from '@/components/erp/masters/ItemMaster';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/master/additems')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ItemMaster />;
}
