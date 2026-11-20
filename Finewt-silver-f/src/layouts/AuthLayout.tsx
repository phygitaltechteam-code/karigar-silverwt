import {useAuthContext} from '@/context/AuthContext';
import {Outlet, useNavigate} from '@tanstack/react-router';
import {useEffect} from 'react';

const AuthLayout = () => {
  const {isAuthenticated} = useAuthContext();
  const navigate = useNavigate();
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate({to: '/dashboard'});
  //   }
  // }, [isAuthenticated]);

  return <Outlet />;
};

export default AuthLayout;
