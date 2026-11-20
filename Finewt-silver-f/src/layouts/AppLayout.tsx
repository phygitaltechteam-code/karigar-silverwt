import Sidebar from '@/components/Sidebar';
import {useAuthContext} from '@/context/AuthContext';
import {Outlet, useLocation, useNavigate} from '@tanstack/react-router';
import React, {useEffect, useState} from 'react';
import WorkflowGuide from '@/components/common/WorkflowGuide';
import {WeightScaleProvider} from '@/context/WeightScaleContext';
import AdminExpiryModal from '@/components/common/AdminExpiryModal';
import MobileBottomNav, { MobileBillingTabs, isBillingPath } from '@/components/common/MobileBottomNav';

const AppLayoutContent: React.FC<{children?: React.ReactNode}> = ({
  children,
}) => {
  const navigate = useNavigate();
  const {pathname} = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {isAuthenticated, isLoading, user} = useAuthContext();
  const [isReady, setIsReady] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sync sidebar state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  // Wait for auth to be ready
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  // Redirect based on user role and route access
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const currentPath = window.location.pathname;
      const userRole = user.role?.toUpperCase();
      const isSuper = userRole === 'SUPERADMIN' || userRole === 'SUPER_ADMIN';

      if (isSuper) {
        const isAllowedSuperAdminRoute =
          currentPath.startsWith('/addadmin') ||
          currentPath.startsWith('/epinrequest') ||
          currentPath.startsWith('/adminprofile') ||
          currentPath.startsWith('/pdfdesign');

        if (!isAllowedSuperAdminRoute) {
          navigate({to: '/addadmin', replace: true});
        }
      } else if (userRole === 'KARIGAR') {
        const isAllowedKarigarRoute =
          currentPath.startsWith('/karigar') ||
          currentPath.startsWith('/soldering/solderingkarigar') ||
          currentPath.startsWith('/bharni/bharnikarigar') ||
          currentPath.startsWith('/polishing/polishingkarigar') ||
          currentPath.startsWith('/cutting/cuttingkarigar') ||
          currentPath.startsWith('/manufacturingprocess');

        if (!isAllowedKarigarRoute) {
          const activeId = localStorage.getItem('active_karigar_id') || user.id;
          navigate({to: `/karigar/kairgerbyid/${activeId}`, replace: true});
        }
      } else {
        const isSuperAdminOnlyRoute =
          currentPath.startsWith('/addadmin') ||
          currentPath.startsWith('/epinrequest');

        if (isSuperAdminOnlyRoute) {
          navigate({to: '/reports/realtimegoldreport', replace: true});
        }
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: '/signin',
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Get margin based on sidebar state
  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarCollapsed ? 'ml-20' : 'ml-64';
  };

  // Show loading if still checking authentication
  if (isLoading || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B8860B] border-t-transparent"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f9f9f7] dark:bg-slate-950">
      {/* Sidebar: fixed on the left on desktop; on phones it is the "More" drawer from the right */}
      <Sidebar
        onCollapseChange={setSidebarCollapsed}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div
        className={`h-full min-w-0 overflow-y-auto transition-all duration-300 ${!isMobile ? getContentMargin() : 'ml-0'}`}
      >
        {/* Mobile header: name, and on billing pages the Bills | Add Bill tabs (menu is "More" in the footer) */}
        {isMobile && (
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#d3c4af]/20 bg-[#f9f9f7]/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
            <span className="shrink-0 font-['Playfair_Display'] text-lg font-bold text-[#B8860B]">FineWt</span>
            {isBillingPath(pathname) && String(user?.role || '').toUpperCase() === 'ADMIN' && (
              <div className="flex flex-1 justify-end">
                <MobileBillingTabs />
              </div>
            )}
          </div>
        )}

        <main className={`min-h-full min-w-0 ${isMobile ? 'pb-24' : ''}`}>
          {/* {user?.role?.toUpperCase() !== 'SUPERADMIN' && <WorkflowGuide />} */}
          <AdminExpiryModal />
          {children ?? <Outlet />}
        </main>
      </div>

      {isMobile && (
        <MobileBottomNav moreOpen={sidebarOpen} onMore={() => setSidebarOpen(!sidebarOpen)} />
      )}
    </div>
  );
};

const AppLayout: React.FC<{children?: React.ReactNode}> = ({children}) => {
  return (
    <WeightScaleProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </WeightScaleProvider>
  );
};

export default AppLayout;
