import ReceiptAdd from '@/components/reciept/ReceiptAdd';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/receipt/addreciept')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReceiptAdd />;
}
