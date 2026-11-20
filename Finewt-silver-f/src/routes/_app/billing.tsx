import Billing from '@/components/erp/Billing';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/billing')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Billing />;
}
