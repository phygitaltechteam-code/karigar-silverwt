import React from 'react';
import {ArrowRight, Sparkles} from 'lucide-react';

interface BottomCTAProps {
  scrollToSection: (id: string) => void;
}

export const BottomCTA: React.FC<BottomCTAProps> = ({scrollToSection}) => {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#785600] via-[#8c6400] to-[#986d00] p-6 text-center text-white shadow-xl sm:p-10 md:flex-row md:p-12 md:text-left">
        <div className="max-w-2xl">
          <span className="mb-2.5 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase sm:text-xs">
            Ready for Modern Precious Metal ERP?
          </span>
          <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Transform Your Gold Manufacturing & Billing Operations
          </h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-white/90 sm:text-sm">
            Join high-precision gold chain manufacturers running zero-loss
            manufacturing and automated billing.
          </p>
        </div>

        <div className="w-full shrink-0 md:w-auto">
          <button
            onClick={() => scrollToSection('trial')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-[#785600] shadow-2xl transition-all hover:scale-105 hover:bg-[#fff9ed] active:scale-95 sm:px-8 sm:py-4 sm:text-sm md:w-auto"
          >
            <Sparkles className="h-4 w-4 text-[#785600]" />
            <span>Free Demo & 7-Day Trial</span>
            <ArrowRight className="h-4 w-4 text-[#785600]" />
          </button>
        </div>
      </div>
    </section>
  );
};
