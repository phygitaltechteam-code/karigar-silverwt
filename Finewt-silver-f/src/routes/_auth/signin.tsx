import SignIn from '@/features/auth/SignIn';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/signin')({
  component: SignIn,
});
