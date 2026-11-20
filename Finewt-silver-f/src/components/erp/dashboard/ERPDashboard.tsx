import React, {useState, useEffect} from 'react';
import {
  Scale,
  Hammer,
  Gem,
  ReceiptCheck,
  Clock,
  TrendingDown,
  Percent,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Box,
  Flame,
  Link,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {erpStore} from '@/store/erpStore';
import {formatGram, formatGramWithUnit} from '@/utils/weightValidation';

// Recharts colors
const COLORS = [
  '#F59E0B',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
];

export const ERPDashboard: React.FC = () => {
  const [data, setData] = useState(erpStore.getData());
  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toLocaleTimeString(),
  );

  const handleRefresh = () => {
    setData(erpStore.getData());
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setData(erpStore.getData());
  }, []);

  // Compute Dashboard Card Stats
  const rawStockTotal = data.batches
    .filter((b) => b.stage === 'RAW_STOCK')
    .reduce((sum, b) => sum + b.currentWeight, 0);

  const totalProduction = data.batches
    .filter((b) => b.stage !== 'RAW_STOCK' && b.stage !== 'BILLED')
    .reduce((sum, b) => sum + b.currentWeight, 0);

  const finishedStockTotal = data.batches
    .filter((b) => b.stage === 'FINISHED_STOCK')
    .reduce((sum, b) => sum + b.currentWeight, 0);

  const todayBillingTotal = data.invoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0,
  );

  const pendingOrdersCount = data.batches.filter(
    (b) => b.stage !== 'BILLED' && b.stage !== 'FINISHED_STOCK',
  ).length;

  const todayLossTotal = data.batches.reduce((sum, b) => sum + b.lossWeight, 0);

  const avgWastagePercent = 0.35; // %

  const todayProfitTotal = data.invoices.reduce(
    (sum, inv) => sum + (inv.makingChargeAmount + inv.goldAmount * 0.05),
    0,
  );

  // Pipeline Counts
  const pipelineStages = [
    {
      name: 'Stock Entry',
      stage: 'RAW_STOCK',
      icon: Scale,
      count: data.batches.filter((b) => b.stage === 'RAW_STOCK').length,
    },
    {
      name: 'Box Dept',
      stage: 'BOX',
      icon: Box,
      count: data.batches.filter((b) => b.stage === 'BOX').length,
    },
    {
      name: 'Soldering',
      stage: 'SOLDERING',
      icon: Flame,
      count: data.batches.filter((b) => b.stage === 'SOLDERING').length,
    },
    {
      name: 'Joint',
      stage: 'JOINT',
      icon: Link,
      count: data.batches.filter((b) => b.stage === 'JOINT').length,
    },
    {
      name: 'Cutting',
      stage: 'CUTTING',
      icon: Scissors,
      count: data.batches.filter((b) => b.stage === 'CUTTING').length,
    },
    {
      name: 'Finished Stock',
      stage: 'FINISHED_STOCK',
      icon: Gem,
      count: data.batches.filter((b) => b.stage === 'FINISHED_STOCK').length,
    },
    {
      name: 'Billing',
      stage: 'BILLED',
      icon: ReceiptCheck,
      count: data.batches.filter((b) => b.stage === 'BILLED').length,
    },
  ];

  // Chart Data
  const dailyProductionData = [
    {day: 'Mon', weight: 110.25},
    {day: 'Tue', weight: 145.8},
    {day: 'Wed', weight: 98.4},
    {day: 'Thu', weight: 162.3},
    {day: 'Fri', weight: 130.5},
    {day: 'Sat', weight: 175.1},
    {day: 'Sun', weight: 88.6},
  ];

  const departmentWiseData = [
    {department: 'Box', inputWt: 145.2, outputWt: 145.0, loss: 0.2},
    {department: 'Soldering', inputWt: 130.0, outputWt: 130.4, loss: 0.6},
    {department: 'Joint', inputWt: 112.5, outputWt: 111.9, loss: 0.6},
    {department: 'Cutting', inputWt: 95.8, outputWt: 95.4, loss: 0.4},
  ];

  const monthlyBillingData = [
    {month: 'Mar', billing: 1250000},
    {month: 'Apr', billing: 1680000},
    {month: 'May', billing: 2100000},
    {month: 'Jun', billing: 1950000},
    {month: 'Jul', billing: 2450000},
    {month: 'Aug', billing: 2890000},
  ];

  const stockTrendData = [
    {time: '09:00 AM', stock: 520.4},
    {time: '11:00 AM', stock: 480.2},
    {time: '01:00 PM', stock: 450.6},
    {time: '03:00 PM', stock: 430.1},
    {time: '05:00 PM', stock: 410.5},
  ];

  return (
    <div className="min-h-screen space-y-8 bg-slate-950 p-4 text-slate-100 md:p-8">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/logo/logo1.jpeg"
              alt="Logo"
              className="h-9 w-9 rounded-lg object-cover border border-amber-500/30 shadow"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <h1 className="font-serif text-2xl font-bold tracking-tight text-amber-400 md:text-3xl">
              Gold Chain Manufacturing ERP
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time Gold Gram Precision Tracking (3 Decimal Places) • Updated
            at {lastRefreshed}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 shadow transition-all hover:bg-slate-800 hover:text-amber-400"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Manufacturing Flow Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
          <Hammer className="h-4 w-4" />
          Manufacturing Pipeline Status
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {pipelineStages.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div
                key={step.name}
                className="relative flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/80 p-3 transition-all hover:border-amber-500/50"
              >
                <div className="mb-2 rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <IconComp className="h-5 w-5" />
                </div>
                <span className="text-center text-[11px] font-medium text-slate-400">
                  {step.name}
                </span>
                <span className="mt-1 text-sm font-bold text-amber-300">
                  {step.count} Lots
                </span>
                {idx < pipelineStages.length - 1 && (
                  <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-amber-500/40 lg:block">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 8 Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Stock */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Stock
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {formatGramWithUnit(rawStockTotal)}
            </span>
            <p className="mt-1 text-[11px] text-amber-400/80">
              Available Raw Gold Stock
            </p>
          </div>
        </div>

        {/* Card 2: Today's Production */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Production
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Hammer className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {formatGramWithUnit(totalProduction)}
            </span>
            <p className="mt-1 text-[11px] text-blue-400/80">
              In-process Gold Output
            </p>
          </div>
        </div>

        {/* Card 3: Finished Stock */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Finished Stock
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Gem className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {formatGramWithUnit(finishedStockTotal)}
            </span>
            <p className="mt-1 text-[11px] text-emerald-400/80">
              Ready for Billing Inventory
            </p>
          </div>
        </div>

        {/* Card 4: Today's Billing */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-purple-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Billing
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <ReceiptCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              ₹
              {todayBillingTotal.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="mt-1 text-[11px] text-purple-400/80">
              Total Sales Revenue
            </p>
          </div>
        </div>

        {/* Card 5: Pending Orders */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Orders
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {pendingOrdersCount} Batches
            </span>
            <p className="mt-1 text-[11px] text-amber-400/80">
              Active Department Queues
            </p>
          </div>
        </div>

        {/* Card 6: Today's Loss */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-rose-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Loss
            </span>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-rose-400">
              {formatGramWithUnit(todayLossTotal)}
            </span>
            <p className="mt-1 text-[11px] text-rose-400/80">
              Process Metal Loss
            </p>
          </div>
        </div>

        {/* Card 7: Today's Wastage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-orange-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Wastage
            </span>
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-slate-100">
              {avgWastagePercent}%
            </span>
            <p className="mt-1 text-[11px] text-orange-400/80">
              Within Allowed Limits (0.5%)
            </p>
          </div>
        </div>

        {/* Card 8: Today's Profit */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Profit
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-emerald-400">
              ₹
              {todayProfitTotal.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="mt-1 text-[11px] text-emerald-400/80">
              Net Estimated Profit
            </p>
          </div>
        </div>
      </div>

      {/* 4 Interactive Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Daily Production */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">
              Daily Production (Grams)
            </h3>
            <span className="font-mono text-xs text-amber-400">
              7-Day Trend
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProductionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                  }}
                  formatter={(val: number) => [
                    `${val.toFixed(3)} g`,
                    'Production',
                  ]}
                />
                <Bar dataKey="weight" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Wise Production */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">
              Department Wise Production
            </h3>
            <span className="font-mono text-xs text-blue-400">
              Input vs Output
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="inputWt"
                  name="Input (g)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outputWt"
                  name="Output (g)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Billing */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">
              Monthly Billing Revenue (₹)
            </h3>
            <span className="font-mono text-xs text-purple-400">
              2026 Revenue
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyBillingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                  }}
                  formatter={(val: number) => [
                    `₹${val.toLocaleString('en-IN')}`,
                    'Revenue',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="billing"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{r: 5}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Gold Stock Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">
              Gold Stock Trend (Intraday)
            </h3>
            <span className="font-mono text-xs text-emerald-400">
              Stock Grams
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                  }}
                  formatter={(val: number) => [
                    `${val.toFixed(3)} g`,
                    'Stock Weight',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="stock"
                  stroke="#10b981"
                  fill="#10b98122"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
