import React, {useState} from 'react';
import {
  MdArrowBack,
  MdHelpOutline,
  MdCheck,
  MdSearch,
  MdExpandMore,
  MdVisibilityOff,
  MdGppMaybe,
  MdArrowForward,
  MdLock,
} from 'react-icons/md';

const Reg2: React.FC = ({setStep}: any) => {
  const [showAccount, setShowAccount] = useState(false);

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#132210] text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-2">
          <button className="hover:bg-gray-100 flex h-10 w-10 items-center justify-center rounded-full bg-[#223b1d] transition-colors">
            <MdArrowBack className="text-white" />
          </button>

          <h1 className="text-lg font-semibold tracking-tight text-white">
            Settlement Account
          </h1>

          <button className="flex h-10 w-10 items-center justify-center rounded-full">
            <MdHelpOutline className="text-white" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8 px-6">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#37ec13]">
                <MdCheck className="text-[10px] text-[#132210]" />
              </div>
              <span className="text-[10px] font-medium text-[#37ec13]">
                Identity
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-[#37ec13] ring-4 ring-[#37ec13]/20"></div>
              <span className="text-[10px] font-medium text-[#37ec13]">
                Link Bank
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-white"></div>
              <span className="text-[10px] font-medium text-white">
                Confirm
              </span>
            </div>
          </div>
        </div>

        {/* Scroll content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 text-white">
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold">Connect Banking</h2>
            <p className="text-sm leading-relaxed text-white">
              Ensure the account belongs to{' '}
              <span className="font-medium text-white">Michael T.</span> for
              instant settlements.
            </p>
          </div>

          <div className="space-y-6">
            {/* Bank */}
            <div>
              <label className="mb-2 ml-4 block text-xs font-medium uppercase tracking-wider text-white">
                Bank Name
              </label>

              <div className="relative">
                <input
              autoComplete="off"
              data-lpignore="true"
                  placeholder="Search your bank (e.g. Chase)"
                  className="w-full rounded-full bg-[#223b1d] py-4 pl-12 pr-10 text-sm font-medium placeholder:text-white focus:border-[#37ec13] focus:outline-none focus:ring-1 focus:ring-[#37ec13]"
                />

                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white" />
                <MdExpandMore className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white" />
              </div>
            </div>

            {/* Account number */}
            <div>
              <label className="mb-2 ml-4 block text-xs font-medium uppercase tracking-wider text-white">
                Account Number
              </label>

              <div className="relative">
                <input
                  type={showAccount ? 'text' : 'password'}
                  defaultValue="•••• •••• 8821"
                  className="w-full rounded-full bg-[#223b1d] py-4 pl-6 pr-12 text-sm font-medium tracking-widest focus:border-[#37ec13] focus:outline-none focus:ring-1 focus:ring-[#37ec13]"
                />

                <button
                  onClick={() => setShowAccount(!showAccount)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#37ec13]"
                >
                  <MdVisibilityOff className="text-lg" />
                </button>
              </div>
            </div>

            {/* IFSC */}
            <div>
              <label className="mb-2 ml-4 block text-xs font-medium uppercase tracking-wider text-white">
                Routing / IFSC Code
              </label>

              <div className="relative">
                <input
                  placeholder="ABCD0123456"
                  className="w-full rounded-full bg-[#223b1d] py-4 pl-6 pr-12 text-sm font-medium uppercase placeholder:text-white focus:border-[#37ec13] focus:outline-none focus:ring-1 focus:ring-[#37ec13]"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#37ec13]">
                  <MdCheck className="rounded-full bg-[#37ec13]/20 p-0.5 text-lg" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="border-gray-200 absolute bottom-0 left-0 w-full border-t bg-[#132210] p-6 backdrop-blur-md">
          <button
            onClick={() => setStep(3)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#37ec13] py-4 font-bold text-[#132210] shadow-[0_0_20px_rgba(55,236,19,0.3)] transition-all hover:bg-[#37ec13]/90 active:scale-[0.98]"
          >
            <span>Verify & Link Account</span>
            <MdArrowForward className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reg2;
