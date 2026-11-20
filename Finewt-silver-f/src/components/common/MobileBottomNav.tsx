import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Receipt,
  Factory,
  Boxes,
  Menu,
  List,
  FilePlus2,
  Users,
  UserCircle,
  UserPlus,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface Tab {
  label: string;
  to: string;
  icon: React.ReactNode;
  /** Paths that also mark this tab active */
  match: string[];
}

const BILLING_PATHS = ['/billing', '/receipt/addreciept', '/billiupdate'];

const tabsForRole = (role: string, userId?: string): Tab[] => {
  const r = role.toUpperCase();
  if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN') {
    return [
      { label: 'Admins', to: '/addadmin', icon: <UserPlus className="h-5 w-5" />, match: ['/addadmin'] },
      { label: 'Profile', to: '/adminprofile', icon: <UserCircle className="h-5 w-5" />, match: ['/adminprofile'] },
    ];
  }
  if (r === 'KARIGAR') {
    const id = userId || (typeof window !== 'undefined' ? localStorage.getItem('active_karigar_id') : '') || '';
    return [
      { label: 'My Jobs', to: `/karigar/kairgerbyid/${id}`, icon: <UserCircle className="h-5 w-5" />, match: ['/karigar/kairgerbyid'] },
      { label: 'Karigar', to: '/soldering/solderingkarigar', icon: <Users className="h-5 w-5" />, match: ['/soldering/solderingkarigar'] },
      { label: 'Process', to: '/manufacturingprocess/process', icon: <Factory className="h-5 w-5" />, match: ['/manufacturingprocess'] },
    ];
  }
  return [
    { label: 'Dashboard', to: '/reports/realtimegoldreport', icon: <LayoutDashboard className="h-5 w-5" />, match: ['/reports/realtimegoldreport'] },
    { label: 'Billing', to: '/billing', icon: <Receipt className="h-5 w-5" />, match: BILLING_PATHS },
    { label: 'Process', to: '/manufacturingprocess/process', icon: <Factory className="h-5 w-5" />, match: ['/manufacturingprocess'] },
    { label: 'Stocks', to: '/Stocks/stockpage', icon: <Boxes className="h-5 w-5" />, match: ['/Stocks', '/stock'] },
  ];
};

/**
 * Phone / small-tablet footer: main pages as tabs, Billing gets its own
 * "Bills | Add Bill" tabs, and "More" opens the full menu from the right.
 */
const MobileBottomNav: React.FC<{ onMore: () => void; moreOpen?: boolean }> = ({ onMore, moreOpen }) => {
  const { pathname } = useLocation();
  const { user } = useAuthContext();
  const role = String(user?.role || '');
  const tabs = tabsForRole(role, user?.id);
  const isOn = (paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));

  const baseTab =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d3c4af]/40 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch">
        {tabs.map((t) => {
          const active = isOn(t.match);
          return (
            <Link
              key={t.label}
              to={t.to as any}
              className={`${baseTab} ${
                active ? 'text-[#785600] dark:text-amber-400' : 'text-[#817563] dark:text-slate-400'
              }`}
            >
              <span className={`rounded-full px-3 py-0.5 ${active ? 'bg-[#785600]/10 dark:bg-amber-400/10' : ''}`}>
                {t.icon}
              </span>
              <span className="truncate">{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className={`${baseTab} ${moreOpen ? 'text-[#785600] dark:text-amber-400' : 'text-[#817563] dark:text-slate-400'}`}
          aria-label="Open menu"
        >
          <span className={`rounded-full px-3 py-0.5 ${moreOpen ? 'bg-[#785600]/10' : ''}`}>
            <Menu className="h-5 w-5" />
          </span>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
};

/** Phone header on billing pages: switch between the bill list and a new bill */
export const MobileBillingTabs: React.FC = () => {
  const { pathname } = useLocation();
  const onAddBill = pathname.startsWith('/receipt/addreciept') || pathname.startsWith('/billiupdate');
  const tab = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-colors ${
      active ? 'bg-[#785600] text-white shadow-sm' : 'text-[#785600] dark:text-amber-400'
    }`;
  return (
    <div className="flex w-full max-w-xs gap-1 rounded-lg bg-[#f4f0e5] p-1 dark:bg-slate-800">
      <Link to="/billing" className={tab(!onAddBill)}>
        <List className="h-4 w-4" /> Bills
      </Link>
      <Link to="/receipt/addreciept" className={tab(pathname.startsWith('/receipt/addreciept'))}>
        <FilePlus2 className="h-4 w-4" /> {pathname.startsWith('/billiupdate') ? 'Edit Bill' : 'Add Bill'}
      </Link>
    </div>
  );
};

export const isBillingPath = (pathname: string) => BILLING_PATHS.some((p) => pathname.startsWith(p));

export default MobileBottomNav;
