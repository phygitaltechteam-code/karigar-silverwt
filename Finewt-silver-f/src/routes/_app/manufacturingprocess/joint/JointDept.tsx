import JointDept from '@/components/erp/manufacturingprocess/joint/JointDept';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_app/manufacturingprocess/joint/JointDept',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <JointDept />;
}
