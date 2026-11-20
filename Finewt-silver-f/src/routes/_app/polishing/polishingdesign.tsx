import UnifiedDesignMaster from '@/components/MasterPages/UnifiedDesignMaster';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/polishing/polishingdesign')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnifiedDesignMaster defaultTab="POLISHING" />;
}
