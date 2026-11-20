import React from 'react';
import {ChevronDown} from 'lucide-react';
import {faqs} from '../landingData';

interface FAQSectionProps {
  openFaq: number | null;
  setOpenFaq: (idx: number | null) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  openFaq,
  setOpenFaq,
}) => {
  return (
    <section
      id="faq"
      className="mx-auto max-w-4xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-8 text-center sm:mb-10">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
          Frequently Asked Questions
        </div>
        <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl">
          Everything You Need to Know
        </h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-[#d3c4af]/50 bg-white shadow-sm transition-colors"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
              >
                <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#785600] transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-[#d3c4af]/30 px-4 pb-4 pt-2.5 text-xs leading-relaxed text-[#4f4535] sm:px-5 sm:pb-5">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
