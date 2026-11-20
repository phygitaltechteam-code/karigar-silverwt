import UnifiedKarigarMaster from '@/components/MasterPages/UnifiedKarigarMaster';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/cutting/cuttingkarigar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnifiedKarigarMaster defaultTab="Cutting" />;
}
