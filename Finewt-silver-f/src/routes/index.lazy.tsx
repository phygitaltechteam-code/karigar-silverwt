import {createLazyFileRoute} from '@tanstack/react-router';
import LandingPage from '@/components/landing/LandingPage';

export const Route = createLazyFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LandingPage />;
}
