import UnifiedDesignMaster from '@/components/MasterPages/UnifiedDesignMaster';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/bharni/bharnidesign')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnifiedDesignMaster defaultTab="BHARNI" />;
}
