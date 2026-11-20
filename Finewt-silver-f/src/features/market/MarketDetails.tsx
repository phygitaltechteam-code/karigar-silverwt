import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import {
  MdArrowBack,
  MdMoreVert,
  MdDescription,
  MdTune,
  MdLock,
  MdTrendingUp,
  MdTrendingDown,
} from 'react-icons/md';

const MarketDetails: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen justify-center bg-[#050a04]">
      <div className="relative flex min-h-screen w-full flex-col text-white">
        {/* Header */}
        <header className="sticky top-0 flex items-center justify-between border-b border-[#37ec13]/10 bg-[#0f160d]/80 px-4 py-3 backdrop-blur">
          <button
            onClick={() => {
              navigate({ to: '/market' });
            }}
            className="text-gray-400 rounded-full p-2 hover:bg-white/10"
          >
            <MdArrowBack className="text-xl" />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-sm font-bold uppercase tracking-wider">
              Gold (AUG)
            </h1>
            <span className="text-[10px] tracking-widest text-[#37ec13]">
              MCX FUTURES
            </span>
          </div>

          <button className="rounded-full p-2 text-[#37ec13] hover:bg-white/10">
            <MdMoreVert className="text-xl" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-6 overflow-y-auto px-4 pb-20 pt-4 md:pb-20">
          {/* Price Section */}
          <section className="space-y-4">
            <div className="flex items-end justify-between px-1">
              <div>
                <div className="text-gray-500 text-[10px] uppercase">
                  Last Price
                </div>
                <div className="text-lg font-bold">351.40</div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[#37ec13]">
                  <MdTrendingUp className="text-sm" />
                  <span className="text-lg font-bold">+6.60</span>
                </div>
                <div className="text-xs font-medium text-[#37ec13]/80">
                  (+1.91%)
                </div>
              </div>
            </div>

            {/* 4 Major Data Points Above Tabs */}
            <div className="grid grid-cols-4 gap-2">
              <StatBox label="Open" value="349.50" />
              <StatBox label="High" value="351.90" />
              <StatBox label="Low" value="345.25" />
              <StatBox label="Prev Close" value="344.80" muted />
            </div>
          </section>

          {/* Price Limits Category */}
          <SpecCard title="Price Limits" icon={<MdTrendingUp />}>
            <Row label="Upper Circuit" value="358.55" highlight />
            <Row label="Lower Circuit" value="331.05" danger />
            <Row label="Bid" value="351.15" highlight />
            <Row label="Ask" value="351.40" highlight />
            <Row label="Bid Qty" value="404" />
            <Row label="Ask Qty" value="223" />
          </SpecCard>

          {/* Volume & Open Interest Category */}
          <SpecCard title="Volume & Open Interest" icon={<MdDescription />}>
          <Row label="Volume" value="2,257" highlight />
          <Row label="OI" value="3,161" />
          <Row label="ATP" value="348.55" />
          <Row label="LTP Qty" value="1" />
          <Row label="Lot Size" value="1,000" />
          <Row label="Tick Size" value="0.10" />
          <Row label="Tick Value" value="₹100" />
        </SpecCard>
        {/* Footer Buttons */}
        <footer className="border-t border-[#37ec13]/10 bg-[#050a04]/95 p-4 backdrop-blur">
          <div className="flex gap-4">
            <button
              onClick={() => navigate({ to: `/placeorder/${'buy'}` })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#37ec13] py-1.5 text-xs font-bold text-black active:scale-[0.98]"
            >
              <MdTrendingUp className="text-xs" />
              BUY
            </button>
            <button
              onClick={() => navigate({ to: `/placeorder/${'sell'}` })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff4d4d] py-3.5 text-xs font-bold text-white active:scale-[0.98]"
            >
              <MdTrendingDown className="text-xs" />
              SELL
            </button>
          </div>
        </footer>
      </main>
    </div>
    </div >
  );
};

export default MarketDetails;

/* ──────────────────────────────────────────────── */
/*                   Components                    */
/* ──────────────────────────────────────────────── */

const StatBox = ({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex flex-col items-center rounded-lg border border-[#37ec13]/10 bg-[#0f160d] p-1 text-center">
    <span className="text-gray-400 mb-1 text-[9px] uppercase tracking-tight">
      {label}
    </span>
    <span
      className={`text-xs font-bold ${muted ? 'text-gray-400' : highlight ? 'text-[#37ec13]' : 'text-white'
        }`}
    >
      {value}
    </span>
  </div>
);

const SpecCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-[#37ec13]/10 bg-[#0f160d]">
    <div className="flex items-center gap-2 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#37ec13]">
      {icon}
      {title}
    </div>
    {children}
  </div>
);

const Row = ({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) => (
  <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
    <span className="text-gray-400 text-xs font-semibold">{label}</span>
    <span
      className={`text-xs font-medium ${highlight ? 'text-[#37ec13]' : danger ? 'text-[#ff4d4d]' : 'text-white'
        }`}
    >
      {value}
    </span>
  </div>
);
