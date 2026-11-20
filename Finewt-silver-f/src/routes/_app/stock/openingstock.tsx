import OpeningStock from '@/components/Stock/OpeningStock';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/stock/openingstock')({
  component: RouteComponent,
});

function RouteComponent() {
  return <OpeningStock />;
}
