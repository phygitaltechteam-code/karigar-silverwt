import StockManagment from '@/components/Stock/StockManagment';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/Stocks/stockmanagement')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockManagment />;
}
