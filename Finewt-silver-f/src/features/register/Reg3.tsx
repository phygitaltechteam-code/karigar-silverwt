import React from 'react';
import {
  MdArrowBack,
  MdHelpOutline,
  MdFingerprint,
  MdCheckCircle,
  MdLock,
  MdAddAPhoto,
  MdFlipCameraIos,
  MdArrowForward,
} from 'react-icons/md';

const Reg3: React.FC = ({setStep}: any) => {
  return (
    <div className="flex min-h-screen justify-center bg-[#000000]">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#000000] text-white">
        {/* Header */}
        <header className="sticky top-0 flex items-center justify-between bg-[#000000]/95 px-6 py-4 backdrop-blur-sm">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-[#1E1E1E] transition-colors hover:bg-[#1E1E1E]/80">
            <MdArrowBack className="text-white" />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Verify Identity
            </h1>
            <div className="mt-1 flex gap-1">
              <div className="h-1 w-2 rounded-full bg-[#39FF14]"></div>
              <div className="h-1 w-6 rounded-full bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.6)]"></div>
              <div className="h-1 w-2 rounded-full bg-white/20"></div>
            </div>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#39FF14] hover:text-[#39FF14]/80">
            <MdHelpOutline />
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
          <div className="mb-8 mt-2">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Aadhar Verification
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Please enter your 12-digit Aadhar number and upload photos to
              unlock higher trading limits.
            </p>
          </div>

          {/* Aadhar Input */}
          <div className="mb-8 space-y-2">
            <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-[#39FF14]">
              Aadhar Number
            </label>

            <div className="relative">
              <input
                maxLength={14}
                placeholder="0000 0000 0000"
                className="w-full rounded-xl border border-white/20 bg-[#1E1E1E] py-4 pl-12 pr-4 text-lg font-medium tracking-wider text-white placeholder-white/30 outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]"
              />

              <MdFingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

              <MdCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-[#39FF14] opacity-0" />
            </div>

            <div className="text-gray-500 mt-2 flex items-center gap-2 px-2 text-[11px]">
              <MdLock className="text-sm" />
              <p>Your ID is encrypted with 256-bit SSL security.</p>
            </div>
          </div>

          {/* Upload Sections */}
          <div className="space-y-6">
            {/* Front */}
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <label className="text-sm font-medium text-white/90">
                  Front of Aadhar Card
                </label>
                <span className="rounded border border-[#39FF14]/20 bg-[#39FF14]/5 px-2 py-0.5 text-xs text-[#39FF14]">
                  Required
                </span>
              </div>

              <button className="relative flex aspect-[1.58/1] w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-[#1E1E1E]/50 hover:border-[#39FF14]/50 active:scale-[0.98]">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#39FF14]/20 bg-[#39FF14]/10">
                    <MdAddAPhoto className="text-2xl text-[#39FF14]" />
                  </div>

                  <span className="text-sm font-medium text-white/80">
                    Tap to upload front side
                  </span>

                  <span className="text-gray-500 mt-1 text-xs">
                    Supports JPG, PNG under 5MB
                  </span>
                </div>
              </button>
            </div>

            {/* Back */}
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <label className="text-sm font-medium text-white/90">
                  Back of Aadhar Card
                </label>
                <span className="rounded border border-[#39FF14]/20 bg-[#39FF14]/5 px-2 py-0.5 text-xs text-[#39FF14]">
                  Required
                </span>
              </div>

              <button className="relative flex aspect-[1.58/1] w-full cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-[#1E1E1E]/50 hover:border-[#39FF14]/50 active:scale-[0.98]">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/5 bg-[#1E1E1E]">
                    <MdFlipCameraIos className="text-2xl text-white/40" />
                  </div>

                  <span className="text-sm font-medium text-white/60">
                    Tap to upload back side
                  </span>
                </div>
              </button>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-xl border border-white/5 bg-[#1E1E1E]/50 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/90">
                Tips for quick approval
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Good lighting',
                  'No flash glare',
                  'Corners visible',
                  'Text is readable',
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <MdCheckCircle className="mt-0.5 text-sm text-[#39FF14]" />
                    <span className="text-gray-400 text-xs">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#000000]/95 p-6 backdrop-blur-md">
          <button
            onClick={() => setStep(4)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#39FF14] py-4 text-lg font-bold text-black shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] active:scale-[0.99]"
          >
            <span>Verify & Continue</span>
            <MdArrowForward className="text-xl" />
          </button>
        </div>

        {/* Glow Background */}
        <div className="pointer-events-none fixed left-0 right-0 top-0 h-96 bg-gradient-to-b from-[#39FF14]/5 via-[#39FF14]/0 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};

export default Reg3;
