import {useNavigate} from '@tanstack/react-router';
import React from 'react';
import {MdClose, MdArrowBack} from 'react-icons/md';

const OrderRejected: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen justify-center bg-[#000000] text-white">
      <div className="relative flex min-h-screen w-full flex-col pb-20 shadow-2xl">
        {/* MAIN CONTENT */}
        <main className="flex flex-grow flex-col items-center justify-center px-6 pb-4 pt-6">
          {/* Rejected Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl"></div>

            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#940303] bg-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
              <MdClose className="text-5xl text-[#940303]" />
            </div>
          </div>

          <h1 className="mb-1 text-center text-2xl font-bold">
            Order Rejected
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

                  <span className="rounded bg-[#940303] px-2 py-0.5 text-[9px] font-bold text-white">
                    BUY
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-gray-400 mb-1 block text-[10px] uppercase">
                  Status
                </span>

                <span className="flex items-center justify-end gap-1 text-xs font-medium text-[#940303]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#940303]" />
                  Rejected
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

          {/* Rejection Reason */}
          <div className="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
            <span className="mb-1 block text-[10px] uppercase text-red-400">
              Reason
            </span>

            <span className="text-sm text-red-300">
              Insufficient margin to execute this order
            </span>
          </div>
        </main>

        {/* BOTTOM ACTION */}
        <div className="bg-[#000000] px-6 pb-6 pt-2">
          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                navigate({
                  to: '/market',
                })
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#940303] py-3 text-base font-bold text-white shadow-md transition hover:bg-red-600"
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

export default OrderRejected;
