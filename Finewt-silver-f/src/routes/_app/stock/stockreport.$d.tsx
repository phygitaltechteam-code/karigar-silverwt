import StockReport from '@/components/erp/masters/StockReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/stock/stockreport/$d')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockReport />;
}
