import BackupAndRestorePage from '@/components/Backup&RestorePage';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_app/backup&restore')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BackupAndRestorePage />;
}
