import StockLedgerReport from '@/components/reports/StockLedgerReport';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/reports/stockreport')({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockLedgerReport />;
}
