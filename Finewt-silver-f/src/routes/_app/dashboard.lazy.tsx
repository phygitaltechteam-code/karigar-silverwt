import Dashboard from '@/components/erp/Dashboard';
import {createLazyFileRoute} from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_app/dashboard')({
  component: () => <Dashboard />,
});
