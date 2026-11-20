import React from 'react';
import {ArrowRight, Layers, Sparkles} from 'lucide-react';

interface HeroSectionProps {
  scrollToSection: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({scrollToSection}) => {
  return (
    <section
      id="hero"
      className="mx-auto max-w-7xl px-4 pt-10 text-center sm:px-6 sm:pt-16 md:pt-20 lg:px-8"
    >
      {/* Badge */}
      <div className="mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1.5 text-center text-[11px] font-bold text-[#785600] shadow-sm sm:gap-2 sm:px-4 sm:text-xs">
        <Sparkles className="h-3 w-3 shrink-0 text-[#785600] sm:h-3.5 sm:w-3.5" />
        <span className="truncate">
          Next-Gen Gold Chain Manufacturing & ERP
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="mx-auto max-w-5xl text-3xl font-extrabold leading-[1.2] tracking-tight text-[#1a1c1b] sm:text-5xl sm:leading-[1.15] md:text-6xl lg:text-7xl">
        Precision Gold Chain Manufacturing &{' '}
        <span className="bg-gradient-to-r from-[#785600] via-[#986d00] to-[#b8860b] bg-clip-text text-transparent">
          Complete Enterprise ERP
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mt-4 max-w-3xl text-sm font-normal leading-relaxed text-[#4f4535] sm:mt-6 sm:text-lg md:text-xl">
        Eliminate unaccounted metal loss from raw bullion ingot to finished
        hallmarked chain. Track all 7 manufacturing stages with micro-milligram
        precision, live fine weight ledger, smart billing, and offline factory
        resilience.
      </p>

      {/* Action CTAs */}
      <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:gap-4">
        <button
          onClick={() => scrollToSection('trial')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-[#785600]/25 transition-all hover:scale-105 active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>Free Demo & 7-Day Trial</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => scrollToSection('manufacturing')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d3c4af] bg-white px-6 py-3.5 text-xs font-bold text-[#4f4535] shadow-sm transition-all hover:border-[#785600] hover:bg-[#fff9ed] hover:text-[#785600] sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
        >
          <Layers className="h-4 w-4 text-[#785600]" />
          <span>Explore 7-Stage Process</span>
        </button>
      </div>

      {/* Metrics Counter Bar */}
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:mt-16 sm:gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
          <div className="text-2xl font-black text-[#785600] sm:text-3xl lg:text-4xl">
            99.99%
          </div>
          <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
            Fine Weight Accuracy
          </div>
          <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
            Real-time Karat ledger
          </div>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
          <div className="text-2xl font-black text-[#986d00] sm:text-3xl lg:text-4xl">
            7 Stages
          </div>
          <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
            Shop-Floor Tracking
          </div>
          <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
            Melting to S-Kunda
          </div>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
          <div className="text-2xl font-black text-[#785600] sm:text-3xl lg:text-4xl">
            0% Loss
          </div>
          <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
            Unaccounted Metal Drops
          </div>
          <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
            Automated scrap recovery
          </div>
        </div>

        <div className="rounded-2xl border border-[#d3c4af]/50 bg-white p-4 text-left shadow-sm sm:p-6 sm:shadow-md">
          <div className="text-2xl font-black text-[#986d00] sm:text-3xl lg:text-4xl">
            Offline+
          </div>
          <div className="mt-1 text-xs font-bold text-[#1a1c1b]">
            Factory Resilience
          </div>
          <div className="mt-0.5 text-[10px] text-[#817563] sm:text-[11px]">
            Zero-downtime logging
          </div>
        </div>
      </div>
    </section>
  );
};
