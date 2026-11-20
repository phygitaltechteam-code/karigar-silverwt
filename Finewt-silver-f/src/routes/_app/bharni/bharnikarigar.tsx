import UnifiedKarigarMaster from '@/components/MasterPages/UnifiedKarigarMaster';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/bharni/bharnikarigar')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnifiedKarigarMaster defaultTab="Bharni" />;
}
