import {useNavigate, useRouter} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBack,
  MdMoreHoriz,
  MdTrendingDown, // changed from MdTrendingUp
  MdExpandMore,
  MdRemove,
  MdAdd,
  MdArrowForward,
} from 'react-icons/md';

const Sell: React.FC = () => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('SELL');
  const [quantity, setQuantity] = useState<number>(10);
  const [price, setPrice] = useState<number>(2040);
  const [tif, setTif] = useState<'DAY' | 'GTC'>('GTC');

  const router = useRouter();
  const navigate = useNavigate();

  // Red theme colors
  const accent = '#ef4444'; // main red
  const accentBg = `${accent}15`; // ~8-10% opacity

  return (
    <div className="flex min-h-screen justify-center bg-[#000000]">
      <div className="relative flex min-h-screen w-full flex-col text-white">
        {/* Header */}
        <header className="sticky top-0 z-999 bg-[#000000] px-6 pt-12">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.history.back()}
              className="text-gray-300 -ml-2 rounded-full p-2 hover:bg-white/10"
            >
              <MdArrowBack className="text-xl" />
            </button>

            <h1 className="flex-grow pr-8 text-center text-lg font-medium">
              Trade
            </h1>

            <button className="text-gray-300 -mr-2 rounded-full p-2 hover:bg-white/10">
              <MdMoreHoriz className="text-xl" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-grow overflow-y-auto px-6 pb-8">
          <div className="flex flex-col items-center">
            <div className="mb-1 flex items-baseline gap-2">
              <h2 className="text-xs font-bold">XAU/USD</h2>
              <span className="rounded bg-[#ef4444]/20 px-2 py-0.5 text-xs font-semibold text-[#ef4444]">
                GOLD SPOT
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">$2,045.50</span>

              <div className="flex items-center rounded-full bg-[#ef4444]/10 px-2 py-1 text-sm font-medium text-[#ef4444]">
                <MdTrendingDown className="mr-1 text-sm" />
                -1.2%
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="mb-3 mt-6">
            <label className="text-gray-400 mb-2 ml-4 block text-xs uppercase">
              Order Type
            </label>

            <div className="relative">
              <select className="w-full appearance-none rounded-2xl border border-[#2a1a1a] bg-[#000000] px-6 py-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50">
                <option>Limit Order</option>
                <option>Market Order</option>
                <option>Stop Loss</option>
                <option>Stop Limit</option>
              </select>

              <MdExpandMore className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ef4444]" />
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-3 rounded-2xl border border-[#2a1a1a] bg-[#000000] p-4">
            <div className="mb-1 flex justify-between">
              <label className="text-gray-400 text-xs uppercase">
                Quantity (oz)
              </label>
              <span className="text-xs text-[#ef4444]/80">Max: 500</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#ef4444] hover:bg-white/10"
              >
                <MdRemove />
              </button>

              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-transparent text-center text-sm font-semibold focus:outline-none"
              />

              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#ef4444] hover:bg-white/10"
              >
                <MdAdd />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4 rounded-2xl border border-[#2a1a1a] bg-[#000000] p-4">
            <div className="mb-1 flex justify-between">
              <label className="text-gray-400 text-xs uppercase">
                Limit Price
              </label>
              <span className="text-xs text-[#ef4444]/80">Ask: 2046.20</span>
            </div>

            <div className="relative flex items-center">
              <span className="text-gray-500 absolute text-sm">$</span>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-transparent pl-4 text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Time In Force */}
          <div className="mb-3">
            <label className="text-gray-400 mb-3 ml-4 block text-xs uppercase">
              Time in Force
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setTif('DAY')}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                  tif === 'DAY'
                    ? `text-white] border border-[#940303] bg-[#940303]`
                    : 'text-gray-400 border border-[#2a1a1a] bg-[#000000]'
                }`}
              >
                Day Only
              </button>

              <button
                onClick={() => setTif('GTC')}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                  tif === 'GTC'
                    ? `border border-[#940303] bg-[#940303] text-white`
                    : 'text-gray-400 border border-[#2a1a1a] bg-[#000000]'
                }`}
              >
                Good Till Cancel
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-[#2a1a1a] bg-[#000000] p-5">
            <div className="mb-3 flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400 text-sm">Trading Fees</span>
              <span className="text-sm">$12.50</span>
            </div>

            <div className="mb-3 flex justify-between">
              <span className="text-gray-400 text-sm">Estimated Proceeds</span>
              <span className="text-xs font-semibold">$20,412.50</span>
            </div>

            <div className="flex justify-between">
              <div>
                <span className="text-gray-500 text-xs">Margin Released</span>
                <div className="text-sm text-[#ef4444]">$1,020.63</div>
              </div>

              <div className="text-right">
                <span className="text-gray-500 text-xs">Available Margin</span>
                <div className="text-sm">$5,500.00</div>
              </div>
            </div>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[18.5%] bg-[#940303]" />
            </div>

            <div className="text-gray-500 mt-1 flex justify-between text-[10px] uppercase">
              <span>Used</span>
              <span>Safe</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                navigate({
                  to: '/rejected',
                });
              }}
              className={`flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#940303] text-sm font-bold text-white`}
            >
              <span>Place Sell Order</span>
              <MdArrowForward />
            </button>
          </div>
        </main>

        {/* Bottom Action */}
        <div className="w-full bg-gradient-to-t from-[#2a1a1a] via-[#2a1a1a] to-transparent p-6">
          <p className="text-gray-500 mt-4 text-center text-xs">
            By placing this order, you agree to our{' '}
            <span className="text-[#940303] underline">Terms of Service</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sell;
