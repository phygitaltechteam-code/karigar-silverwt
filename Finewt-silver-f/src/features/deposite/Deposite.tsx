import {useNavigate, useRouter} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBackIosNew,
  MdHelpOutline,
  MdAccountBalance,
  MdCheckCircle,
  MdPayments,
  MdContentCopy,
  MdInfo,
  MdUploadFile,
  MdArrowForward,
} from 'react-icons/md';

const Deposite: React.FC = () => {
  const [amount, setAmount] = useState<number>(5000);
  const [method, setMethod] = useState<'bank' | 'cash'>('bank');
  const navigate = useNavigate();
  const router = useRouter();

  const addAmount = (value: number) => {
    setAmount((prev) => prev + value);
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="relative flex min-h-screen w-full flex-col bg-[#0a0f08] pb-32 text-white">
        <header className="fixed top-0 z-40 w-full border-b border-white/5 bg-[rgba(10,15,8,0.85)] px-6 pb-4 pt-12 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  router.history.back();
                }}
                className="-ml-2 rounded-full p-2 transition-colors hover:bg-white/5"
              >
                <MdArrowBackIosNew className="text-lg text-white/80" />
              </button>
              <h1 className="text-xl font-bold tracking-tight">
                Deposit Funds
              </h1>
            </div>
            <button className="rounded-full p-2 transition-colors hover:bg-white/5">
              <MdHelpOutline className="text-white/80" />
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6 pt-32">
          <section className="space-y-4">
            <label className="ml-1 block text-sm font-medium uppercase tracking-wider text-white/60">
              Deposit Amount
            </label>

            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                <span className="text-sm font-bold text-[#37ec13]">$</span>
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                className="block w-full rounded-lg border-2 border-white/5 bg-[#161d14] py-3 pl-12 pr-6 text-sm font-extrabold text-white transition-all placeholder:text-white/20 focus:border-[#37ec13] focus:ring-0"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addAmount(1000)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/10"
              >
                +$1,000
              </button>
              <button
                onClick={() => addAmount(5000)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/10"
              >
                +$5,000
              </button>
              <button
                onClick={() => addAmount(10000)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/10"
              >
                +$10,000
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <label className="ml-1 block text-sm font-medium uppercase tracking-wider text-white/60">
              Payment Method
            </label>

            <div className="space-y-3">
              <div
                onClick={() => setMethod('bank')}
                className={`relative flex cursor-pointer items-center gap-4 rounded-2xl p-4 text-sm ${
                  method === 'bank'
                    ? 'border-2 border-[#37ec13] bg-[#161d14] ring-4 ring-[rgba(55,236,19,0.05)]'
                    : 'border border-white/10 bg-[#161d14]'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(55,236,19,0.2)]">
                  <MdAccountBalance className="text-[#37ec13]" />
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-white">Bank Transfer</h4>
                  <p className="text-xs text-white/60">
                    SEPA, SWIFT, Local Bank
                  </p>
                </div>

                {method === 'bank' && (
                  <MdCheckCircle className="text-[#37ec13]" />
                )}
              </div>

              <div
                onClick={() => setMethod('cash')}
                className={`relative flex cursor-pointer items-center gap-4 rounded-2xl p-4 text-xs transition-colors ${
                  method === 'cash'
                    ? 'border-2 border-[#37ec13] bg-[#161d14]'
                    : 'border border-white/10 bg-[#161d14] hover:bg-[#1e291b]'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <MdPayments className="text-white/40" />
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-white/80">By Cash</h4>
                  <p className="text-xs text-white/40">
                    In-person deposit at branch
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-white/5 bg-[rgba(22,29,20,0.5)] p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#37ec13]">Beneficiary Details</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Bank Name
                  </p>
                  <p className="text-xs">Global Reserve Bank Int.</p>
                </div>
                <MdContentCopy className="cursor-pointer text-white/20 hover:text-[#37ec13]" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Account Number
                  </p>
                  <p className="text-xs tracking-wider">9928 4451 0029 3341</p>
                </div>
                <MdContentCopy className="cursor-pointer text-white/20 hover:text-[#37ec13]" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    IFSC / SWIFT CODE
                  </p>
                  <p className="text-xs tracking-wider">GRBIN88XXX</p>
                </div>
                <MdContentCopy className="cursor-pointer text-white/20 hover:text-[#37ec13]" />
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.1)] p-4">
              <MdInfo className="text-sm text-yellow-500" />
              <p className="text-[11px] font-medium leading-relaxed text-yellow-500/90">
                Please include your Transaction ID in the bank transfer remarks
                to ensure faster processing of funds.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <label className="ml-1 block text-sm font-medium uppercase tracking-wider text-white/60">
              Upload Payment Receipt
            </label>

            <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/10 bg-[#161d14] p-8 transition-all hover:border-[#37ec13]/50 hover:bg-[#1e291b]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                <MdUploadFile className="text-3xl text-white/40" />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">
                  Click to upload receipt
                </p>
                <p className="mt-1 text-xs text-white/40">
                  PNG, JPG or PDF (Max 5MB)
                </p>
              </div>
            </div>
          </section>
        </main>

        <div className="fixed bottom-0 z-50 w-full max-w-[420px] rounded-t-[2.5rem] border-t border-white/5 bg-[rgba(10,15,8,0.85)] p-6 backdrop-blur-xl">
          <button
            onClick={() => {
              navigate({
                to: '/depositesuccess',
              });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#37ec13] py-3 font-extrabold text-black shadow-[0_0_30px_rgba(55,236,19,0.3)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="text-xs uppercase tracking-wider">
              Submit Deposit Request
            </span>
            <MdArrowForward />
          </button>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};

export default Deposite;
