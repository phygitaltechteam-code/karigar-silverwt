import {useNavigate} from '@tanstack/react-router';
import React from 'react';
import {MdCheck, MdArrowBack} from 'react-icons/md';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen justify-center bg-[#000000] text-white">
      <div className="relative flex min-h-screen w-full flex-col pb-20 shadow-2xl">
        {/* MAIN CONTENT */}
        <main className="flex flex-grow flex-col items-center justify-center px-6 pb-4 pt-6">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#37ec13]/20 blur-2xl"></div>

            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#37ec13] bg-[#37ec13]/10 shadow-[0_0_25px_rgba(55,236,19,0.3)]">
              <MdCheck className="text-5xl text-[#37ec13]" />
            </div>
          </div>

          <h1 className="mb-1 text-center text-2xl font-bold">
            Order Placed Successfully
          </h1>

          <p className="text-gray-400 mb-6 text-center text-xs">
            Order ID: #8829304-XAU
          </p>

          {/* Order Card */}
          <div className="mb-4 w-full rounded-2xl border border-[#000000] bg-[#000000] p-4">
            <div className="mb-4 flex items-start justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-gray-400 mb-1 block text-[10px] uppercase">
                  Instrument
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">XAU/USD</span>

                  <span className="rounded bg-[#37ec13] px-2 py-0.5 text-[9px] font-bold text-black">
                    BUY
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-gray-400 mb-1 block text-[10px] uppercase">
                  Status
                </span>

                <span className="flex items-center justify-end gap-1 text-xs font-medium text-[#37ec13]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#37ec13]" />
                  Completed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <span className="text-gray-500 mb-1 block text-[10px] uppercase">
                  Type
                </span>
                <span>Limit Buy</span>
              </div>

              <div className="text-right">
                <span className="text-gray-500 mb-1 block text-[10px] uppercase">
                  Qty
                </span>
                <span>10 OZ</span>
              </div>

              <div>
                <span className="text-gray-500 mb-1 block text-[10px] uppercase">
                  Price
                </span>
                <span className="font-mono">$2,040.00</span>
              </div>

              <div className="text-right">
                <span className="text-gray-500 mb-1 block text-[10px] uppercase">
                  Total
                </span>
                <span className="font-mono">$20,400.00</span>
              </div>
            </div>
          </div>

          {/* TP / SL */}
          <div className="mb-4 grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#111111] p-3">
              <span className="text-gray-400 mb-1 block text-[9px] uppercase">
                Take Profit
              </span>

              <span className="font-mono text-sm font-bold text-[#37ec13]">
                $2,142.00
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111111] p-3">
              <span className="text-gray-400 mb-1 block text-[9px] uppercase">
                Stop Loss
              </span>

              <span className="font-mono text-sm font-bold text-red-500">
                $1,999.20
              </span>
            </div>
          </div>
        </main>

        {/* BOTTOM ACTIONS */}
        <div className="bg-[#000000] to-transparent px-6 pb-6 pt-2">
          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                navigate({
                  to: '/market',
                })
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#37ec13] py-3 text-base font-bold text-black shadow-md transition hover:bg-[#2dd40f]"
            >
              <MdArrowBack className="text-lg" />
              Back to Market
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
