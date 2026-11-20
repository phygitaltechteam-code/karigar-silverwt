import ProductInfoPage from '@/components/erp/masters/ProductInfoPage';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/product/$code')({
  component: RouteComponent,
});

function RouteComponent() {
  const {code} = Route.useParams();
  return <ProductInfoPage code={code} />;
}
