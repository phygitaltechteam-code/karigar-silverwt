import ItemMaster from '@/components/erp/masters/ItemMaster';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/items/itemdisplay')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ItemMaster />;
}
