import UnifiedKarigarMaster from '@/components/MasterPages/UnifiedKarigarMaster';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/soldering/solderingkarigar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnifiedKarigarMaster defaultTab="Soldering" />;
}
