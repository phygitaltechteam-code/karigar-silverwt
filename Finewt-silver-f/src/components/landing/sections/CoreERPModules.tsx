import React from 'react';
import {erpModules} from '../landingData';

export const CoreERPModules: React.FC = () => {
  return (
    <section
      id="modules"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
          Comprehensive Suite
        </div>
        <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
          Built Specifically for Precious Metal Enterprises
        </h2>
        <p className="mt-2 text-xs text-[#4f4535] sm:mt-3 sm:text-sm md:text-base">
          From the factory floor to retail billing desks and corporate Super
          Admins, all operations share a single unified fine gold ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {erpModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#d3c4af]/50 bg-white p-5 transition-all hover:border-[#785600]/60 hover:bg-[#fffdfa] hover:shadow-lg sm:p-6"
            >
              <div className="mb-3.5 flex items-center justify-between">
                <div className="rounded-xl border border-[#785600]/20 bg-[#785600]/10 p-2.5 text-[#785600] shadow-sm sm:p-3">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="rounded border border-[#d3c4af]/40 bg-[#f9f9f7] px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-[#785600] sm:text-[10px]">
                  {mod.tag}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1a1c1b] sm:text-base">
                {mod.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4f4535]">
                {mod.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
