import {useNavigate} from '@tanstack/react-router';
import React from 'react';
import {
  MdMenu,
  MdNotifications,
  MdBolt,
  MdPieChart,
  MdArrowDownward,
  MdArrowUpward,
  MdAccountBalance,
  MdCandlestickChart,
  MdAccountBalanceWallet,
  MdReceipt,
  MdAnalytics,
  MdSettings,
} from 'react-icons/md';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen justify-center bg-[#000000] font-[Inter] text-white">
      {/* Mobile Container */}
      <div className="relative flex min-h-screen w-full flex-col">
        {/* Header */}
        <header className="fixed top-0 z-40 w-full max-w-md border-b border-white/5 bg-[#000000]/85 px-6 pb-4 pt-12 backdrop-blur-md">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">Wallet</h1>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 space-y-8 px-6 pb-28 pt-20">
          {/* Equity Section */}
          <section>
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#000000] p-6 shadow-xl">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#000000]/5 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <span className="mb-1 text-sm text-white/60">
                  Total Equity Value
                </span>

                <h2 className="mb-6 text-xl font-extrabold tracking-tight">
                  $124,592.00
                </h2>

                {/* Ring Chart */}
                <div className="relative mb-6 flex h-48 w-48 items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#253820"
                      strokeWidth="8"
                      fill="transparent"
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#37ec13"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset="75"
                      fill="transparent"
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="white"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="200"
                      className="opacity-20"
                      fill="transparent"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-white/50">
                      Available
                    </span>
                    <span className="text-2xl font-bold text-[#37ec13]">
                      $84,320
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex gap-6 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#37ec13]" />
                    <span className="text-white/80">Cash Balance</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="text-white/80">Margin Used</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<MdBolt className="text-[#37ec13]" />}
              label="Buying Power"
              value="$96,320"
              change="+2.4% today"
            />

            <div className="flex h-20 flex-col justify-between rounded-3xl border border-white/5 bg-[#000000] p-1">
              <div className="mb-1 flex items-center gap-2">
                <MdPieChart className="text-xs text-white/40" />
                <span className="text-xs uppercase text-white/60">
                  Margin Used
                </span>
              </div>

              <div>
                <span className="text-xs font-bold">$12,000</span>

                <div className="mt-3 h-1 w-full rounded-full bg-white/10">
                  <div className="h-full w-[24%] bg-white/40" />
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="flex gap-4">
            <button
              onClick={() => {
                navigate({
                  to: '/deposite',
                });
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#37ec13] py-3 text-xs font-bold text-black shadow-[0_0_20px_rgba(55,236,19,0.3)]"
            >
              <MdArrowDownward />
              Deposit
            </button>

            <button
              onClick={() => {
                navigate({
                  to: '/withdraw',
                });
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-xs text-white"
            >
              <MdArrowUpward />
              Withdraw
            </button>
          </section>

          {/* Transactions */}
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <button className="text-sm text-[#37ec13]">View All</button>
            </div>

            <div className="space-y-3">
              <TransactionItem
                icon={<MdAccountBalance />}
                title="ACH Deposit"
                subtitle="Today, 10:23 AM • ID: #9923"
                amount="+$5,000.00"
                positive
                status="Cleared"
              />

              <TransactionItem
                icon={<MdCandlestickChart />}
                title="Buy Gold Spot (XAU)"
                subtitle="Yesterday, 4:15 PM"
                amount="-$2,100.00"
              />

              <TransactionItem
                icon={<MdAccountBalanceWallet />}
                title="Wire Withdrawal"
                subtitle="Oct 24, 9:00 AM"
                amount="-$10,000.00"
                status="Processing"
              />

              <TransactionItem
                icon={<MdReceipt />}
                title="Management Fee"
                subtitle="Oct 01, 12:00 AM"
                amount="-$25.00"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Wallet;

/* ---------- Stat Card ---------- */

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}> = ({icon, label, value, change}) => (
  <div className="flex h-20 flex-col justify-between rounded-3xl border border-white/5 bg-[#000000] p-1">
    <div className="mb-1 flex items-center gap-2">
      {icon}
      <span className="text-xs uppercase text-white/60">{label}</span>
    </div>

    <div>
      <span className="text-xs font-bold">{value}</span>
      <span className="mt-1 block text-xs text-[#37ec13]">{change}</span>
    </div>
  </div>
);

/* ---------- Transaction Item ---------- */

const TransactionItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: string;
  status?: string;
  positive?: boolean;
}> = ({icon, title, subtitle, amount, status, positive}) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#000000] p-4 hover:bg-[#233b1e]">
    <div className="flex items-center gap-4">
      <div>
        <h4 className="text-xs">{title}</h4>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>

    <div className="text-right">
      <span
        className={`block text-xs ${
          positive ? 'text-[#37ec13]' : 'text-white'
        }`}
      >
        {amount}
      </span>

      {status && (
        <span className="mt-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
          {status}
        </span>
      )}
    </div>
  </div>
);
