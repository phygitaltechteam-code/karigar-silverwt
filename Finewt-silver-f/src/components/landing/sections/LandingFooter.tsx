import React from 'react';
import logoImg from '@/assets/logo/landingpageLogo.png';

interface LandingFooterProps {
  scrollToSection: (id: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  scrollToSection,
}) => {
  return (
    <footer className="border-t border-[#d3c4af]/40 bg-white px-4 py-8 text-xs text-[#817563] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-2.5 text-center sm:flex-row sm:text-left">
          <img
            src={logoImg}
            alt="FineWt Logo"
            className="h-7 w-auto max-w-[140px] shrink-0 object-contain sm:h-8"
          />
          <p className="text-[9px] text-[#817563] sm:border-l sm:border-[#d3c4af]/60 sm:pl-3 sm:text-[10px]">
            © {new Date().getFullYear()} Precision Jewelry Manufacturing System
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#4f4535] sm:gap-6">
          <button
            onClick={() => scrollToSection('features')}
            className="transition-colors hover:text-[#785600]"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('manufacturing')}
            className="transition-colors hover:text-[#785600]"
          >
            7-Stage Process
          </button>
          <button
            onClick={() => scrollToSection('trial')}
            className="font-bold text-[#785600] transition-colors hover:text-[#986d00]"
          >
            Free Demo & 7-Day Trial
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-600" />
          <span>Systems Online • 99.99% Uptime</span>
        </div>
      </div>
    </footer>
  );
};
