import StockMaster from '@/components/erp/masters/StockMaster';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/Stocks/stockpage')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockMaster />;
}
