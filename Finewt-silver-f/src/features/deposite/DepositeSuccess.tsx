import {useNavigate} from '@tanstack/react-router';
import React from 'react';
import {MdCheck, MdArrowBack} from 'react-icons/md';

const DepositeSuccess: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="relative flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-[#000000]">
        <main className="relative z-10 flex flex-grow flex-col items-center justify-center px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-[rgba(55,236,19,0.2)] blur-2xl"></div>

            <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#37ec13] bg-[rgba(55,236,19,0.1)] shadow-[0_0_30px_rgba(55,236,19,0.3)]">
              <MdCheck className="text-6xl text-[#37ec13]" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">
            Deposit request placed
            <br />
            Successful
          </h1>

          <p className="text-gray-400 mb-10 text-center text-sm">
            Order ID: #8829304-XAU
          </p>
        </main>

        <div className="w-full bg-gradient-to-t from-[#000000] via-[#000000] to-transparent p-6 pb-26">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                navigate({
                  to: '/market',
                });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#37ec13] py-3 text-lg font-bold text-[#000000] shadow-[0_0_20px_-5px_rgba(55,236,19,0.5)] transition-all hover:bg-[#2dd40f] active:scale-[0.98]"
            >
              <MdArrowBack className="text-xl" />
              <span className="text-sm">Back to Market</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositeSuccess;
