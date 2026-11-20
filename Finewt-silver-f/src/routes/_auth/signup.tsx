import Signup from '@/features/register/Signup';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/signup')({
  component: Signup,
});
