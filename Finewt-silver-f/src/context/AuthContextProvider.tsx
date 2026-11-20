import {ReactNode, useEffect, useState} from 'react';
import {AuthContext} from './AuthContext';
import {Token, User} from '@/types';
import {QUERY_KEYS} from '@/lib/react-query/queryKeys';
import {jwtDecode} from 'jwt-decode';

const AuthContextProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const tokenString = localStorage.getItem(QUERY_KEYS.TOKEN);

        if (!tokenString) {
          clearAuthState();
          return;
        }

        let localToken;
        try {
          localToken = JSON.parse(tokenString);
        } catch (parseError) {
          console.warn('Failed to parse token, clearing...');
          clearAuthState();
          return;
        }

        // Check if token exists and has accessToken
        if (!localToken || !localToken.accessToken) {
          clearAuthState();
          return;
        }

        const accessToken = localToken.accessToken;

        // Check if it's a demo/mock token (not a valid JWT)
        const isDemoToken =
          accessToken === 'demo-access-token-gold-erp' ||
          accessToken === 'temp-access-token-gold-erp' ||
          accessToken.includes('demo') ||
          accessToken.includes('temp') ||
          accessToken.split('.').length !== 3;

        if (isDemoToken) {
          console.log('🔧 Demo token detected, using static user data');

          // Try to get user from localStorage or use default
          let userData = localStorage.getItem('user');
          let parsedUser = null;

          if (userData) {
            try {
              parsedUser = JSON.parse(userData);
            } catch {
              parsedUser = null;
            }
          }

          // Use stored user or create default
          const demoUser: User = parsedUser || {
            id: 'demo-user-001',
            username: 'admin',
            fullname: 'Demo Admin',
            email: 'admin@sonagold.com',
            role: 'ADMIN',
            exp: Math.floor(Date.now() / 1000) + 86400,
            iat: Math.floor(Date.now() / 1000),
          };

          setToken(localToken);
          setUser(demoUser);
          setRole(demoUser.role || 'ADMIN');
          setIsSuperAdmin(
            demoUser.role === 'SuperAdmin' || demoUser.role === 'SUPERADMIN',
          );
          setIsAuthenticated(true);
          setIsLoading(false);
          console.log('✅ Demo auth initialized successfully');
          return;
        }

        // For real JWT tokens, decode and validate
        let decodedToken: User;
        try {
          decodedToken = jwtDecode(accessToken);
        } catch (decodeError) {
          console.error('Failed to decode JWT token:', decodeError);
          clearAuthState();
          return;
        }

        // Check if token is expired
        if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
          console.log('Token expired');
          localStorage.removeItem(QUERY_KEYS.TOKEN);
          clearAuthState();
          return;
        }

        // Valid JWT token
        setToken(localToken);
        setUser(decodedToken);
        setRole(decodedToken.role || null);
        setIsSuperAdmin(
          decodedToken.role === 'SuperAdmin' ||
            decodedToken.role === 'SUPERADMIN',
        );
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log('✅ Auth initialized successfully');
      } catch (error) {
        console.error('Error in AuthContextProvider:', error);
        clearAuthState();
      }
    };

    const clearAuthState = () => {
      setToken(null);
      setUser(null);
      setRole(null);
      setIsSuperAdmin(false);
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Value of the context
  const contextValue = {
    user,
    setUser,
    role,
    setRole,
    token,
    setToken,
    isAuthenticated,
    setIsAuthenticated,
    isSuperAdmin,
    setIsSuperAdmin,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContextProvider;
