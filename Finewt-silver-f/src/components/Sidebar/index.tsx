// components/Sidebar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  MdInventory2,
  MdPrecisionManufacturing,
  MdAssessment,
  MdLogout,
  MdMenu,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdGroups,
  MdAccountBalance,
  MdReceipt,
  MdBackup,
  MdAdd,
  MdPersonAdd,
  MdDesignServices,
  MdAccountCircle,
  MdPictureAsPdf,
  MdAutoGraph,
  MdAddAlert,
} from 'react-icons/md';
import { useAuthContext } from '@/context/AuthContext';
import { EPinIcon } from '@/icons';
import { TrendingDown, Calculator } from 'lucide-react';
import logoImg from '@/assets/logo/logo1.png';
import { confirmAction } from '@/utils/confirmAction';
import {
  MANUFACTURING_PATH,
  PROCESS_TABS,
} from '@/components/erp/manufacturingprocess/processTabs';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  roles: string[];
  subroutes?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  path: string;
  roles: string[];
  icon?: React.ReactNode;
  /** Manufacturing stage tab to open (passed as router state) */
  tab?: string;
}

const Sidebar = ({
  onCollapseChange,
  isMobile: propIsMobile,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;
  const { user, isAuthenticated } = useAuthContext();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const role = useMemo(() => {
    if (user?.role) return user.role;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.role || null;
      }
    } catch {
      // ignore
    }
    return null;
  }, [user]);

  const isMobileDevice = propIsMobile !== undefined ? propIsMobile : isMobile;

  // ============================================================
  // ALL MENU ITEMS
  // ============================================================
  const allMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      path: '/reports/realtimegoldreport',
      icon: <MdAutoGraph size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Billing',
      path: '/billing',
      icon: <MdReceipt size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Manufacturing',
      path: MANUFACTURING_PATH,
      icon: <MdPrecisionManufacturing size={22} />,
      roles: ['ADMIN'],
      // One entry per stage, opening that stage's tab on the Manufacturing page
      subroutes: PROCESS_TABS.map((tab) => ({
        label: tab.name,
        path: MANUFACTURING_PATH,
        tab: tab.id,
        roles: ['ADMIN', 'KARIGAR'],
        icon: <tab.Icon size={16} />,
      })),
    },
    {
      label: 'Stocks',
      path: '/Stocks/stockpage',
      icon: <MdInventory2 size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'My Jobs & Ledger',
      path: `/karigar/kairgerbyid/${user?.id || (typeof window !== 'undefined' ? localStorage.getItem('active_karigar_id') : '') || ''}`,
      icon: <MdAccountCircle size={22} />,
      roles: ['KARIGAR'],
    },
    {
      label: 'Karigar Master',
      path: '/soldering/solderingkarigar',
      icon: <MdGroups size={22} />,
      roles: ['ADMIN', 'KARIGAR'],
    },
    {
      label: 'Design Master',
      path: '/bharni/bharnidesign',
      icon: <MdDesignServices size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Client & Settlement',
      path: '/setlment/settlement',
      icon: <MdGroups size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Manufacturing Report',
      path: '/reports/manufacturingreport',
      icon: <MdAssessment size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Loss Report',
      path: '/lossreportdata',
      icon: <TrendingDown size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Business 360 Report',
      path: '/reports/stockreport',
      icon: <MdAssessment size={22} />,
      roles: ['ADMIN'],
    },
    {
      path: '/reports/todayreport',
      label: 'Daily Report',
      icon: <MdAssessment size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Alert Management',
      path: '/alertmanagement',
      roles: ['ADMIN'],
      icon: <MdAddAlert size={22} />,
    },
    {
      label: 'Purity Management',
      path: '/puritymanagement',
      icon: <Calculator size={22} />,
      roles: ['ADMIN'],
    },
    {
      label: 'Add Admin',
      path: '/addadmin',
      icon: <MdPersonAdd size={22} />,
      roles: ['SUPERADMIN'],
    },
    {
      label: 'Admin Profile',
      path: '/adminprofile',
      icon: <MdAccountCircle size={22} />,
      roles: ['ADMIN'],
    },
  ];

  // Filter menu items based on user role - use useMemo for performance
  const menuItems = useMemo(() => {
    if (!role) return [];
    const upperRole = role.toUpperCase();

    const roleFiltered = allMenuItems.filter((item) => {
      return item.roles.some((r) => r.toUpperCase() === upperRole);
    });
    // Additional UI restriction
    let finalFiltered = roleFiltered;
    if (upperRole === 'SUPERADMIN' || upperRole === 'SUPER_ADMIN') {
      finalFiltered = roleFiltered.filter((item) =>
        [
          'Add Admin',
          'E-PIN Request',
          'PDF Header Design',
          'Admin Profile',
        ].includes(item.label),
      );
    } else if (upperRole === 'KARIGAR') {
      finalFiltered = roleFiltered.filter((item) =>
        ['My Jobs & Ledger', 'Karigar Master', 'Manufacturing'].includes(item.label),
      );
    } else {
      finalFiltered = roleFiltered.filter(
        (item) => item.label !== 'Add Admin' && item.label !== 'E-PIN Request' && item.label !== 'My Jobs & Ledger',
      );
    }

    return finalFiltered;
  }, [role]);

  // Auto-expand menu if subroute is active
  useEffect(() => {
    if (!menuItems.length) return;

    menuItems.forEach((item) => {
      if (item.subroutes) {
        const isSubrouteActive = item.subroutes.some(
          (subroute) => subroute.path && pathname.startsWith(subroute.path),
        );
        if (isSubrouteActive && !isCollapsed && !isMobileDevice) {
          setExpandedMenus((prev) => new Set(prev).add(item.label));
        }
      }
    });
  }, [menuItems, pathname, isCollapsed, isMobileDevice]);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);

      if (width >= 640 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        if (setSidebarOpen) setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Tablets (768-1279px): start with the icon-only sidebar so pages get enough width
  useEffect(() => {
    let wasTablet: boolean | null = null;
    const sync = () => {
      const w = window.innerWidth;
      const tablet = w >= 768 && w < 1280;
      if (tablet !== wasTablet) {
        wasTablet = tablet;
        if (tablet) setIsCollapsed(true);
      }
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    if (isMobileDevice) {
      setIsMobileMenuOpen(false);
      if (setSidebarOpen) setSidebarOpen(false);
    }
  }, [pathname, isMobileDevice]);

  useEffect(() => {
    if (sidebarOpen !== undefined) {
      setIsMobileMenuOpen(sidebarOpen);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const toggleSubmenu = (label: string) => {
    if (isCollapsed) return;
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return pathname === itemPath;
    }
    if (itemPath !== '/') {
      return pathname.startsWith(itemPath);
    }
    return pathname === itemPath;
  };

  const isSubrouteActive = (subroutePath: string, tab?: string) => {
    const onPath = pathname === subroutePath || pathname.startsWith(subroutePath + '/');
    if (!onPath || !tab) return onPath;
    // Tab entries share one path: the open tab is in router state (first tab by default)
    const openTab = (location.state as { selectedTab?: string } | undefined)?.selectedTab;
    return openTab ? openTab === tab : tab === PROCESS_TABS[0]?.id;
  };

  const handleLogout = async () => {
    const ok = await confirmAction('Logout', 'Are you sure you want to log out?');
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    window.location.href = '/signin';
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('sidebar-collapsed', String(next));
    } catch {
      // ignore
    }
    if (onCollapseChange) {
      onCollapseChange(next);
    }
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (setSidebarOpen) setSidebarOpen(newState);
  };

  const getPortalName = () => {
    return 'FineWt';
  };

  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-lg bg-[#1a1a2e] p-2.5 text-white shadow-lg transition-all hover:bg-[#2a2a3e] active:scale-95 md:hidden"
      aria-label="Toggle menu"
    >
      {isMobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
    </button>
  );

  const MobileOverlay = () => (
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      onClick={toggleMobileMenu}
    />
  );

  // Render menu item with subroutes support
  const renderMenuItem = (item: MenuItem) => {
    const hasSubroutes = item.subroutes && item.subroutes.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const isItemActive = item.path ? isActive(item.path) : false;
    const isAnySubrouteActive =
      hasSubroutes &&
      item.subroutes?.some((subroute) => isSubrouteActive(subroute.path, subroute.tab));

    const isActuallyCollapsed = isCollapsed && !isMobileDevice;

    // Collapsed sidebar cannot show a dropdown: a menu with its own page links straight to it
    if (hasSubroutes && !(isActuallyCollapsed && item.path)) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => {
              if (!isActuallyCollapsed) {
                toggleSubmenu(item.label);
              }
            }}
            className={`group flex w-full items-center justify-between rounded-lg transition-all duration-200 ${isItemActive || isAnySubrouteActive
                ? 'bg-[#B8860B]/10 text-[#B8860B]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${isActuallyCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
            title={isActuallyCollapsed ? item.label : ''}
          >
            <div
              className={`flex items-center ${isActuallyCollapsed ? 'w-full justify-center' : ''}`}
            >
              <span className={`shrink-0 ${isActuallyCollapsed ? '' : 'mr-3'}`}>
                {item.icon}
              </span>
              {!isActuallyCollapsed && (
                <span className="whitespace-nowrap text-sm font-medium">
                  {item.label}
                </span>
              )}
            </div>
            {!isActuallyCollapsed && (
              <MdExpandMore
                className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                  }`}
                size={18}
              />
            )}
          </button>

          {!isActuallyCollapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
              {item.subroutes!
                .filter(
                  (subroute) =>
                    !role || subroute.roles.some((r) => r.toUpperCase() === String(role).toUpperCase()),
                )
                .map((subroute) => {
                  const isSubActive = isSubrouteActive(subroute.path, subroute.tab);
                  return (
                    <Link
                      key={subroute.label}
                      to={subroute.path}
                      {...(subroute.tab ? { state: { selectedTab: subroute.tab } as any } : {})}
                      onClick={() => {
                        if (isMobileDevice) toggleMobileMenu();
                      }}
                      className={`flex items-center gap-2 rounded-lg py-2 pl-4 pr-3 text-sm transition-all duration-200 ${isSubActive
                          ? 'bg-[#B8860B]/10 text-[#B8860B]'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="shrink-0">{subroute.icon}</span>
                      <span>{subroute.label}</span>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      );
    }

    // For items without subroutes
    return (
      <div key={item.label}>
        <Link
          to={item.path!}
          onClick={() => {
            if (isMobileDevice) toggleMobileMenu();
          }}
          className={`group flex items-center rounded-lg transition-all duration-200 ${isActive(item.path!)
              ? 'bg-[#B8860B]/10 text-[#B8860B]'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
            } ${isActuallyCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'}`}
          title={isActuallyCollapsed ? item.label : ''}
        >
          <span className={`shrink-0 ${isActuallyCollapsed ? '' : 'mr-3'}`}>
            {item.icon}
          </span>
          {!isActuallyCollapsed && (
            <span className="whitespace-nowrap text-sm font-medium">
              {item.label}
            </span>
          )}
          {isActive(item.path!) && (
            <span className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-[#B8860B]"></span>
          )}
          {isCollapsed && !isMobileDevice && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
              {item.label}
            </div>
          )}
        </Link>
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      <div
        onClick={toggleCollapse}
        className={`mb-6 mt-6 cursor-pointer select-none transition-all duration-300 ${isMobileDevice ? 'px-4' : isCollapsed ? 'px-2' : 'px-4'
          }`}
        title={
          isCollapsed ? 'Click to expand sidebar' : 'Click to collapse sidebar'
        }
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCollapse();
          }
        }}
      >
        {isCollapsed && !isMobileDevice ? (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-black/30 transition-transform duration-200 hover:scale-105">
              <img
                src={logoImg}
                alt="FineWt Logo"
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-black/30">
              <img
                src={logoImg}
                alt="FineWt Logo"
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
            <div className="min-w-0 text-left">
              <h1 className="truncate font-['Playfair_Display'] text-lg font-bold text-[#B8860B] md:text-xl">
                {getPortalName()}
              </h1>
              <p className="font-['DM_Sans'] text-[8px] uppercase tracking-[0.15em] text-slate-400 md:text-[9px]">
                Gold Manufacturing ERP
              </p>
            </div>
          </div>
        )}
      </div>

      <nav
        className={`no-scrollbar flex-1 space-y-1 overflow-y-auto ${isCollapsed && !isMobileDevice ? 'px-1' : 'px-2'
          }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {menuItems.length > 0 ? (
          menuItems.map((item) => renderMenuItem(item))
        ) : (
          <div className="py-4 text-center text-sm text-slate-500">
            No menu items available
          </div>
        )}
      </nav>

      <div className="border-t border-white/5 px-2 py-3">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg transition-all duration-200 ${isCollapsed && !isMobileDevice
              ? 'justify-center px-2 py-3'
              : 'px-3 py-2.5 md:px-4 md:py-3'
            } text-slate-400 hover:bg-white/5 hover:text-white`}
          title={isCollapsed && !isMobileDevice ? 'Logout' : ''}
        >
          <MdLogout
            size={20}
            className={`shrink-0 ${isCollapsed && !isMobileDevice ? '' : 'mr-3'}`}
          />
          {(!isCollapsed || isMobileDevice) && (
            <span className="text-xs font-medium tracking-wide md:text-sm">
              Logout
            </span>
          )}
        </button>
      </div>
    </>
  );

  const getSidebarWidth = () => {
    if (isMobileDevice) return 'w-72';
    // Tablet and desktop follow the collapse toggle, matching the content margin in AppLayout
    return isCollapsed ? 'w-20' : 'w-64';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <MobileOverlay />

      <aside
        className={`fixed top-0 z-50 flex h-full flex-col bg-[#1a1a2e] shadow-2xl transition-all duration-300 ease-in-out ${getSidebarWidth()} ${isMobileDevice
            ? `right-0 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`
            : "left-0 translate-x-0"
          } ${isCollapsed && !isMobileDevice ? 'overflow-hidden' : ''}`}
      >
        <SidebarContent />
        {isMobileDevice && (
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <MdClose size={22} />
          </button>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
