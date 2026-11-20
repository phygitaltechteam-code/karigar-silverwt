import {useNavigate} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdNotifications,
  MdTrendingUp,
  MdGridView,
  MdMonetizationOn,
  MdRectangle,
  MdCloudDone,
  MdCandlestickChart,
  MdInfoOutline,
  MdArrowDropDown,
  MdArrowDropUp,
} from 'react-icons/md';

// ==================== TYPES ====================
interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  investAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  icon?: React.ReactNode;
  assetType: 'gold' | 'silver' | 'digital' | 'coin';
}

interface Position {
  id: string;
  symbol: string;
  name: string;
  type: 'long' | 'short';
  quantity: number;
  avgPrice: number;
  ltp: number;
  investAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  icon?: React.ReactNode;
  expiry?: string;
  margin?: number;
}

interface PortfolioProps {
  holdings?: Holding[];
  positions?: Position[];
}

// ==================== MAIN PORTFOLIO COMPONENT ====================
const Portfolio: React.FC<PortfolioProps> = ({
  holdings: initialHoldings = [],
  positions: initialPositions = [],
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'holdings' | 'positions'>(
    'holdings',
  );
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Use passed data or fallback to sample data
  const holdings =
    initialHoldings.length > 0 ? initialHoldings : getSampleHoldings();
  const positions =
    initialPositions.length > 0 ? initialPositions : getSamplePositions();

  // Portfolio Summary Calculations
  const totalInvestment = holdings.reduce((sum, h) => sum + h.investAmount, 0);
  const totalCurrentValue = holdings.reduce(
    (sum, h) => sum + h.currentValue,
    0,
  );
  const totalPnl = totalCurrentValue - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#050505] font-[Inter] text-white">
      <div className="flex min-h-screen w-full flex-col pb-20">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-[#050505]/95 px-4 py-4 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuALMEFtMehGTMuFR0C1YfXbXXBXS10aKLFq8XXT0n7hLsEHy1cSZQiOxi9jn5oIRor0PE99LbjudkqLv7xCvD0-lVREEkW1cPTa5bGzd_D3gxIkIIv235f-Wpf4b8YO6tE-ljvLtPPn2E_K5H7PdaLbluU2fE6vW2tNMeLuJeUKqQn6lnrEmFZPmzpdui-pLNhibcgQTYSKf83V9C92VR02ADusIJQXOj-mu_5xc87GPVHWY7g_S2Qxh5GXBPC_z3Ew6RN9eaTdwlgv"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Portfolio</h1>
          </div>

          <button className="relative rounded-full bg-[#1f221e] p-2 hover:bg-white/10 active:bg-white/20">
            <MdNotifications className="text-xl text-white/80" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#37ec13]" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 px-2">
          {/* Portfolio Summary Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#131313] shadow-[0_0_15px_rgba(55,236,19,0.15)]">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#37ec13]/10 blur-[60px]" />
            <div className="relative flex flex-col gap-4 p-4">
              <div>
                <p className="mb-1 text-xs text-white/60">
                  Total Portfolio Value
                </p>
                <h2 className="text-2xl font-bold">
                  ${totalCurrentValue.toFixed(2)}
                </h2>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xs text-white/40">Investment</p>
                    <p className="text-sm font-semibold">
                      ${totalInvestment.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xs text-white/40">Overall P&L</p>
                    <p
                      className={`text-sm font-semibold ${totalPnl >= 0 ? 'text-[#37ec13]' : 'text-red-500'}`}
                    >
                      {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`flex items-center rounded-lg ${
                      totalPnl >= 0
                        ? 'bg-[#37ec13]/10 text-[#37ec13]'
                        : 'bg-red-500/10 text-red-500'
                    } px-2 py-1 text-xs font-semibold`}
                  >
                    {totalPnl >= 0 ? (
                      <MdTrendingUp className="mr-1" />
                    ) : (
                      <MdTrendingUp className="mr-1 rotate-180" />
                    )}
                    {totalPnlPercent.toFixed(2)}%
                  </span>
                  <span className="text-xs text-white/40">Overall return</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-full bg-[#1f221e] p-1">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                activeTab === 'holdings'
                  ? 'bg-[#37ec13] text-black'
                  : 'text-white/50'
              }`}
            >
              Holdings ({holdings.length})
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                activeTab === 'positions'
                  ? 'bg-[#37ec13] text-black'
                  : 'text-white/50'
              }`}
            >
              Positions ({positions.length})
            </button>
          </div>

          {/* Summary Bar */}
          <div className="sticky top-[72px] z-10 flex items-center justify-between bg-[#050505]/95 px-2 py-2 text-xs text-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <span>Asset</span>
              <MdInfoOutline className="text-white/20" />
            </div>
            <div className="flex gap-3">
              <span className="w-14 text-right">Qty</span>
              <span className="w-16 text-right">LTP</span>
              <span className="w-20 text-right">P&L</span>
            </div>
          </div>

          {/* Assets / Positions List */}
          <div className="flex flex-col gap-2 pb-4">
            {activeTab === 'holdings' &&
              holdings.map((holding) => (
                <HoldingItem
                  key={holding.id}
                  holding={holding}
                  isExpanded={expandedRows.includes(holding.id)}
                  onToggle={() => toggleRow(holding.id)}
                />
              ))}

            {activeTab === 'positions' &&
              positions.map((position) => (
                <PositionItem
                  key={position.id}
                  position={position}
                  isExpanded={expandedRows.includes(position.id)}
                  onToggle={() => toggleRow(position.id)}
                />
              ))}
          </div>
        </main>

        {/* Bottom Safe Area */}
        <div className="h-4" />
      </div>
    </div>
  );
};

// ==================== SAMPLE DATA ====================
const getSampleHoldings = (): Holding[] => [
  {
    id: '1',
    symbol: 'XAU/USD',
    name: 'Spot Gold',
    quantity: 150,
    avgPrice: 62.87,
    ltp: 64.2,
    investAmount: 9430.5,
    currentValue: 9630.0,
    pnl: 199.5,
    pnlPercent: 2.12,
    dayChange: 15.2,
    dayChangePercent: 0.24,
    icon: <MdGridView />,
    assetType: 'gold',
  },
  {
    id: '2',
    symbol: 'KRUGER',
    name: 'Krugerrand',
    quantity: 5,
    avgPrice: 1995.0,
    ltp: 2015.0,
    investAmount: 9975.0,
    currentValue: 10075.0,
    pnl: 100.0,
    pnlPercent: 1.0,
    dayChange: 8.5,
    dayChangePercent: 0.42,
    icon: <MdMonetizationOn />,
    assetType: 'coin',
  },
  {
    id: '3',
    symbol: 'XAG/USD',
    name: 'Silver Bar',
    quantity: 5000,
    avgPrice: 0.87,
    ltp: 0.86,
    investAmount: 4350.0,
    currentValue: 4300.0,
    pnl: -50.0,
    pnlPercent: -1.15,
    dayChange: -12.3,
    dayChangePercent: -1.41,
    icon: <MdRectangle />,
    assetType: 'silver',
  },
  {
    id: '4',
    symbol: 'DGLD',
    name: 'Digital Gold',
    quantity: 938,
    avgPrice: 64.5,
    ltp: 64.18,
    investAmount: 60471.0,
    currentValue: 60200.84,
    pnl: -270.16,
    pnlPercent: -0.45,
    dayChange: -5.2,
    dayChangePercent: -0.08,
    icon: <MdCloudDone />,
    assetType: 'digital',
  },
];

const getSamplePositions = (): Position[] => [
  {
    id: 'p1',
    symbol: 'GOLDFUT',
    name: 'Gold Futures',
    type: 'long',
    quantity: 2,
    avgPrice: 2415.0,
    ltp: 2430.0,
    investAmount: 4830.0,
    currentValue: 4860.0,
    pnl: 30.0,
    pnlPercent: 0.62,
    dayChange: 15.0,
    dayChangePercent: 0.62,
    icon: <MdCandlestickChart />,
    expiry: 'Dec 2024',
    margin: 1200.0,
  },
  {
    id: 'p2',
    symbol: 'SILVFUT',
    name: 'Silver Futures',
    type: 'short',
    quantity: 1,
    avgPrice: 1215.0,
    ltp: 1208.0,
    investAmount: 1215.0,
    currentValue: 1208.0,
    pnl: 7.0,
    pnlPercent: 0.58,
    dayChange: -4.5,
    dayChangePercent: -0.37,
    icon: <MdCandlestickChart />,
    expiry: 'Dec 2024',
    margin: 800.0,
  },
];

// ==================== HOLDING ITEM COMPONENT ====================
interface HoldingItemProps {
  holding: Holding;
  isExpanded: boolean;
  onToggle: () => void;
}

const HoldingItem: React.FC<HoldingItemProps> = ({
  holding,
  isExpanded,
  onToggle,
}) => {
  const pnlPositive = holding.pnl >= 0;

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#131313] transition-colors active:bg-white/5">
      {/* Main Row */}
      <div
        className="flex min-h-[64px] cursor-pointer items-center justify-between p-3"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-white">
              {holding.name}
            </h4>
            <span className="font-mono text-xs text-white/40">
              {holding.symbol}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-medium">{holding.quantity}</div>
            <div className="text-xs text-white/40">Qty</div>
          </div>
          <div className="w-16 text-right">
            <div className="text-xs">${holding.ltp.toFixed(2)}</div>
            <div className="text-xs text-white/40">LTP</div>
          </div>
          <div className="w-16 text-right">
            <div
              className={`text-sm font-semibold ${pnlPositive ? 'text-[#37ec13]' : 'text-red-500'}`}
            >
              {pnlPositive ? '+' : ''}
              {holding.pnlPercent.toFixed(2)}%
            </div>
            <div
              className={`text-xs ${pnlPositive ? 'text-[#37ec13]' : 'text-red-500'}`}
            >
              ${Math.abs(holding.pnl).toFixed(2)}
            </div>
          </div>
          <div className="ml-1 text-white/40">
            {isExpanded ? (
              <MdArrowDropUp className="text-xl" />
            ) : (
              <MdArrowDropDown className="text-xl" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/5 bg-black/20 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="mb-2 text-xs text-white/40">Investment Details</p>
              <div className="space-y-2">
                <DetailRow
                  label="Invested"
                  value={`$${holding.investAmount.toFixed(2)}`}
                />
                <DetailRow
                  label="Avg Price"
                  value={`$${holding.avgPrice.toFixed(2)}`}
                />
                <DetailRow
                  label="Day Change"
                  value={`${holding.dayChange >= 0 ? '+' : '-'}${Math.abs(holding.dayChangePercent).toFixed(2)}%`}
                  valueClass={
                    holding.dayChange >= 0 ? 'text-[#37ec13]' : 'text-red-500'
                  }
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-white/40">Asset Details</p>
              <div className="space-y-2">
                <DetailRow label="Type" value={holding.assetType} capitalize />
                <DetailRow
                  label="Current Val"
                  value={`$${holding.currentValue.toFixed(2)}`}
                />
                <DetailRow
                  label="Total Qty"
                  value={`${holding.quantity}${holding.assetType === 'digital' ? 'g' : holding.assetType === 'coin' ? ' oz' : 'g'}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== POSITION ITEM COMPONENT ====================
interface PositionItemProps {
  position: Position;
  isExpanded: boolean;
  onToggle: () => void;
}

const PositionItem: React.FC<PositionItemProps> = ({
  position,
  isExpanded,
  onToggle,
}) => {
  const pnlPositive = position.pnl >= 0;

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#131313] transition-colors active:bg-white/5">
      {/* Main Row */}
      <div
        className="flex min-h-[64px] cursor-pointer items-center justify-between p-3"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="truncate text-xs font-bold text-white">
                {position.name}
              </h4>
            </div>
            <span className="font-mono text-xs text-white/40">
              {position.symbol}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-medium">{position.quantity}</div>
            <div className="text-xs text-white/40">Qty</div>
          </div>
          <div className="w-16 text-right">
            <div className="text-xs">${position.ltp.toFixed(2)}</div>
            <div className="text-xs text-white/40">LTP</div>
          </div>
          <div className="w-16 text-right">
            <div
              className={`text-xs font-semibold ${pnlPositive ? 'text-[#37ec13]' : 'text-red-500'}`}
            >
              {pnlPositive ? '+' : ''}
              {position.pnlPercent.toFixed(2)}%
            </div>
            <div
              className={`text-xs ${pnlPositive ? 'text-[#37ec13]' : 'text-red-500'}`}
            >
              ${Math.abs(position.pnl).toFixed(2)}
            </div>
          </div>
          <div className="ml-1 text-white/40">
            {isExpanded ? (
              <MdArrowDropUp className="text-xl" />
            ) : (
              <MdArrowDropDown className="text-xl" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/5 bg-black/20 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="mb-2 text-xs text-white/40">Position Details</p>
              <div className="space-y-2">
                <DetailRow
                  label="Margin"
                  value={`$${position.margin?.toFixed(2) || '0.00'}`}
                />
                <DetailRow
                  label="Avg Price"
                  value={`$${position.avgPrice.toFixed(2)}`}
                />
                <DetailRow label="Expiry" value={position.expiry || '-'} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-white/40">P&L Breakdown</p>
              <div className="space-y-2">
                <DetailRow
                  label="Invested"
                  value={`$${position.investAmount.toFixed(2)}`}
                />
                <DetailRow
                  label="Current"
                  value={`$${position.currentValue.toFixed(2)}`}
                />
                <DetailRow
                  label="Day Change"
                  value={`${position.dayChange >= 0 ? '+' : '-'}${Math.abs(position.dayChangePercent).toFixed(2)}%`}
                  valueClass={
                    position.dayChange >= 0 ? 'text-[#37ec13]' : 'text-red-500'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== DETAIL ROW HELPER ====================
interface DetailRowProps {
  label: string;
  value: string;
  valueClass?: string;
  capitalize?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  valueClass = 'text-white',
  capitalize = false,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-white/60">{label}</span>
    <span
      className={`font-mono text-xs ${valueClass} ${capitalize ? 'capitalize' : ''}`}
    >
      {value}
    </span>
  </div>
);

export default Portfolio;
