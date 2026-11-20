import {useNavigate, useLocation} from '@tanstack/react-router';
import React from 'react';
import {
  MdCandlestickChart,
  MdReceiptLong,
  MdAccountBalanceWallet,
  MdPerson,
  MdShowChart,
} from 'react-icons/md';
import {TbReport} from 'react-icons/tb';

interface FooterProps {
  activeTab?: string;
}

const Footer: React.FC<FooterProps> = ({activeTab}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, tabName?: string) => {
    // If activeTab prop is provided, use it
    if (activeTab && tabName) {
      return activeTab === tabName;
    }
    // Otherwise check the path
    return location.pathname.includes(path);
  };

  const getClass = (path: string, tabName?: string) =>
    `flex h-full w-16 flex-col items-center justify-center text-xs transition-colors ${
      isActive(path, tabName)
        ? 'text-[#0df20d]'
        : 'text-gray-400 hover:text-gray-300'
    }`;

  return (
    <nav className="sticky bottom-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/5 bg-[#000000]/95 pb-2 backdrop-blur-lg">
      <button
        onClick={() => navigate({to: '/dashboard'})}
        className={getClass('/dashboard', 'market')}
      >
        <MdCandlestickChart className="text-2xl" />
        <span className="mt-1">Markets</span>
      </button>

      <button
        onClick={() => navigate({to: '/order'})}
        className={getClass('/order', 'orders')}
      >
        <MdReceiptLong className="text-2xl" />
        <span className="mt-1">Orders</span>
      </button>

      <button
        onClick={() => navigate({to: '/wallet'})}
        className={getClass('/wallet', 'wallet')}
      >
        <MdAccountBalanceWallet className="text-2xl" />
        <span className="mt-1">Wallet</span>
      </button>

      <button
        onClick={() => navigate({to: '/portfolio'})}
        className={getClass('/portfolio', 'portfolio')}
      >
        <MdShowChart className="text-2xl" />
        <span className="mt-1">Portfolio</span>
      </button>

      <button
        className={getClass('/report', 'report')}
        onClick={() => navigate({to: '/report'})}
      >
        <TbReport className="text-2xl" />
        <span className="mt-1">Report</span>
      </button>
    </nav>
  );
};

export default Footer;
