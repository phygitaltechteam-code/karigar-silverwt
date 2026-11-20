import React from 'react';
import {
  MdHeadsetMic,
  MdPendingActions,
  MdBadge,
  MdFace,
  MdCheckCircle,
  MdDone,
  MdSync,
  MdArrowBack,
} from 'react-icons/md';

const Review: React.FC = () => {
  return (
    <div className="flex min-h-screen justify-center bg-[#132210]">
      <div className="relative flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-[#132210] text-white">
        {/* Header */}
        <header className="sticky top-0 flex items-center justify-between bg-[#132210]/95 px-6 pb-4 pt-12 backdrop-blur-md">
          <div className="w-10"></div>

          <h1 className="text-lg font-semibold tracking-wide text-white">
            Status Check
          </h1>

          <button className="-mr-2 rounded-full p-2 transition-colors hover:bg-slate-200">
            <MdHeadsetMic className="text-2xl text-white" />
          </button>
        </header>

        {/* Main */}
        <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-32 pt-8 text-center">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[#FFD700]/20 blur-2xl"></div>

            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-[#FFD700]/30 bg-gradient-to-b from-[#253f1f] to-[#1a2e16] shadow-[0_0_30px_rgba(255,215,0,0.1)]">
              <MdPendingActions className="text-6xl text-[#FFD700]" />

              <div className="absolute -bottom-2 flex items-center gap-1 rounded-full border border-[#FFD700]/50 bg-[#1a2e16] px-3 py-1 shadow-lg">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#FFD700]"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD700]">
                  Reviewing
                </span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-3xl font-bold text-white">
            Application Under Review
          </h2>

          <p className="mx-auto mb-8 max-w-xs leading-relaxed text-white">
            Thanks for submitting your documents. Our team is verifying your
            identity. This usually takes less than{' '}
            <span className="font-semibold text-[#37ec13]">24 hours</span>.
          </p>

          {/* Submitted Docs */}
          <div className="w-full rounded-2xl bg-[#1a2e16] p-5 text-left shadow-sm">
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold uppercase tracking-wider text-white">
              Submitted Documents
            </h3>

            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#37ec13]">
                <MdBadge className="text-lg" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">Aadhar Card</p>
                <p className="text-xs text-white">ID: ••••••4567</p>
              </div>

              <MdCheckCircle className="text-xl text-[#FFD700]" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#37ec13]">
                <MdFace className="text-lg" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Selfie Verification
                </p>
                <p className="text-xs text-white">Uploaded 10 mins ago</p>
              </div>

              <MdCheckCircle className="text-xl text-[#FFD700]" />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8 w-full px-2">
            {/* Step 1 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute bottom-0 left-[19px] top-2 -z-10 w-[2px] bg-[#253f1f]"></div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#37ec13] shadow-[0_0_10px_rgba(55,236,19,0.3)]">
                  <MdDone className="text-lg text-[#132210]" />
                </div>
              </div>

              <div className="flex-1 pb-6 pt-2 text-left">
                <h4 className="text-sm font-bold text-[#37ec13]">
                  Submission Received
                </h4>
                <p className="mt-0.5 text-xs text-white">
                  We have received your application.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FFD700] bg-[#253f1f] shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                  <MdSync className="animate-spin text-lg text-[#FFD700]" />
                </div>
              </div>

              <div className="flex-1 pt-2 text-left">
                <h4 className="text-sm font-bold text-[#FFD700]">
                  Under Review
                </h4>
                <p className="mt-0.5 text-xs text-white">
                  Our compliance team is checking your details.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#1a2e16] via-[#1a2e16] to-transparent p-6 pt-12">
          <button className="group flex w-full items-center justify-center gap-2 rounded-full border border-[#37ec13]/20 bg-[#253f1f] py-4 text-lg font-bold text-white transition-all hover:border-[#37ec13]/50 active:scale-[0.98]">
            <MdArrowBack className="text-[#37ec13] transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Review;
