import {useRouter} from '@tanstack/react-router';
import React, {useState} from 'react';
import {
  MdArrowBack,
  MdPerson,
  MdPublic,
  MdExpandMore,
  MdEmail,
  MdLock,
  MdVisibilityOff,
  MdLoyalty,
  MdArrowForward,
} from 'react-icons/md';

const Reg1: React.FC = ({setStep}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  const router = useRouter();

  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="flex min-h-screen w-full flex-col bg-[#132210] text-white">
        <header className="sticky top-0 flex w-full items-center bg-[#132210]/90 px-6 pb-4 pt-12 backdrop-blur-sm">
          <button
            onClick={() => router.history.back()}
            className="hover:bg-gray-200 -ml-2 rounded-full p-2 text-white transition-colors"
          >
            <MdArrowBack className="text-2xl" />
          </button>

          <div className="text-sm font-bold uppercase tracking-wide text-[#37ec13]/80">
            Gold Trader Pro
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-6 pb-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Join the Gold Standard
            </h1>
            <p className="text-white">
              Start trading gold securely in minutes. Create your
              institutional-grade account today.
            </p>
          </div>

          <form className="space-y-5">
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdPerson className="text-white group-focus-within:text-[#37ec13]" />
              </div>

              <input
                type="text"
                placeholder="Legal Full Name"
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-4 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
              />
            </div>

            <div className="flex space-x-3">
              <div className="w-full">
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] px-6 py-4 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
                />
              </div>
            </div>

            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdEmail className="text-white group-focus-within:text-[#37ec13]" />
              </div>

              <input
                type="email"
                placeholder="name@example.com"
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-4 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
              />
            </div>

            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdLock className="text-white group-focus-within:text-[#37ec13]" />
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Set a strong password"
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-12 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-white transition-colors hover:text-white"
              >
                <MdVisibilityOff className="text-xl" />
              </button>
            </div>

            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MdLoyalty className="text-white group-focus-within:text-[#37ec13]" />
              </div>

              <input
                type="text"
                placeholder="Broker Code"
                className="placeholder-gray-400 block w-full rounded-full border-transparent bg-[#223b1d] py-4 pl-12 pr-4 text-sm font-medium text-white shadow-sm transition-all focus:border-[#37ec13] focus:ring-1 focus:ring-[#37ec13]"
              />
            </div>

            <div className="mt-6 flex items-start px-2">
              <div className="flex h-5 items-center">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="border-gray-300 h-5 w-5 cursor-pointer rounded text-[#37ec13] accent-[#37ec13]"
                />
              </div>

              <div className="ml-3 text-xs leading-5">
                <label className="font-medium text-white">
                  I agree to the{' '}
                  <a
                    href="#"
                    className="text-[#37ec13] decoration-[#37ec13] hover:underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="#"
                    className="text-[#37ec13] decoration-[#37ec13] hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
            </div>

            <button
              type="submit"
              onClick={() => setStep(2)}
              className="group mt-4 flex w-full transform items-center justify-center rounded-full bg-[#37ec13] px-6 py-4 font-bold text-[#132210] shadow-lg shadow-[#37ec13]/20 transition-all hover:bg-opacity-90 active:scale-[0.98]"
            >
              Create Account
              <MdArrowForward className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </main>

        <footer className="py-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white">
            Secure • Regulated • Trusted
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Reg1;
