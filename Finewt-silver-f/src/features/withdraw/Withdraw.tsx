import {useNavigate, useRouter} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBackIosNew,
  MdArrowForward,
  MdExpandMore,
  MdVerified,
} from 'react-icons/md';

const Withdraw: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen justify-center bg-[#000000]">
      <div className="relative flex min-h-screen w-full flex-col">
        <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-[#000000] px-6 pb-4 pt-6 backdrop-blur-xl">
          <div className="flex items-center">
            <button
              onClick={() => {
                router.history.back();
              }}
              className="-ml-2 rounded-full p-2 transition-colors hover:bg-white/5"
            >
              <MdArrowBackIosNew className="text-lg text-white/80" />
            </button>
            <h1 className="ml-2 text-xl font-bold tracking-tight text-white">
              Withdraw Funds
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6 pb-22 pt-20">
          <section className="py-4 text-center">
            <span className="text-sm font-medium uppercase tracking-widest text-white/50">
              Available Cash
            </span>
            <h2 className="mt-1 text-4xl font-extrabold text-white">
              $84,320.00
            </h2>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-white/60">
                Withdrawal Amount
              </label>

              <div className="group relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 transition-colors group-focus-within:text-[#37ec13]">
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-[#161a16] py-2 pl-10 pr-6 text-sm font-bold text-white outline-none transition-all placeholder:text-white/10 focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-white/60">
                To Bank Account
              </label>

              <div className="relative">
                <select className="w-full cursor-pointer appearance-none rounded-md border border-white/10 bg-[#161a16] px-5 py-2 text-sm font-medium text-white outline-none focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]">
                  <option value="chase">JP Morgan Chase •••• 8812</option>
                  <option value="wells">Wells Fargo •••• 4401</option>
                  <option value="merrill">Merrill Lynch WM •••• 9022</option>
                </select>

                <MdExpandMore className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xl text-white/40" />
              </div>

              <div className="ml-1 mt-1 flex items-center gap-1.5">
                <MdVerified className="text-sm text-[#37ec13]" />
                <span className="text-[11px] font-medium text-[#37ec13]/80">
                  Verified for Instant Settlements
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/5 bg-[#161a16]/50 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Processing Time</span>
                <span className="font-medium text-white">
                  1-2 Business Days
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Withdrawal Fee</span>
                <span className="font-medium text-white">$0.00</span>
              </div>

              <div className="h-px bg-white/5"></div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Estimated Arrival
                </span>
                <span className="text-xs font-bold text-[#37ec13]">
                  By Nov 02, 2023
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                navigate({
                  to: '/withdrawsuccess',
                })
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#37ec13] py-3.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(55,236,19,0.25)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Confirm Withdrawal
              <MdArrowForward className="text-xl" />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Withdraw;
