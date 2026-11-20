import React from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Scale,
  Sliders,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {ProcessStep, manufacturingSteps} from '../landingData';

interface ManufacturingProcessProps {
  selectedStep: ProcessStep;
  setSelectedStep: (step: ProcessStep) => void;
  scrollToSection: (id: string) => void;
}

export const ManufacturingProcess: React.FC<ManufacturingProcessProps> = ({
  selectedStep,
  setSelectedStep,
  scrollToSection,
}) => {
  return (
    <section
      id="manufacturing"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:mb-3 sm:text-xs">
          Shop Floor Engineering
        </div>
        <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
          End-to-End 7-Stage Manufacturing Pipeline
        </h2>
        <p className="mt-2 text-xs text-[#4f4535] sm:mt-3 sm:text-sm md:text-base">
          Click on any stage below to inspect how every gram of gold, alloy
          addition, link count, and micro-loss is tracked in the system.
        </p>
      </div>

      {/* Interactive Steps Selector */}
      <div className="no-scrollbar mb-5 flex gap-2.5 overflow-x-auto pb-2 sm:mb-6 sm:grid sm:grid-cols-4 sm:gap-3 sm:pb-0 lg:grid-cols-7">
        {manufacturingSteps.map((step) => {
          const Icon = step.icon;
          const isSelected = selectedStep.id === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setSelectedStep(step)}
              className={`flex w-44 shrink-0 flex-col justify-between rounded-xl border p-3 text-left transition-all sm:w-auto sm:p-4 ${
                isSelected
                  ? 'scale-[1.01] border-[#785600] bg-gradient-to-b from-[#fff9ed] to-[#fcf5e5] shadow-md'
                  : 'border-[#d3c4af]/50 bg-white hover:border-[#785600]/40 hover:bg-[#faf8f5]'
              }`}
            >
              <div>
                <div
                  className={`mb-2 w-fit rounded-lg p-2 ${
                    isSelected
                      ? 'bg-[#785600] text-white shadow-sm'
                      : 'bg-[#785600]/10 text-[#785600]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 font-bold sm:h-4 sm:w-4" />
                </div>
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-[#785600] sm:text-[10px]">
                  {step.badge}
                </span>
                <h3 className="text-xs font-bold leading-snug text-[#1a1c1b]">
                  {step.name}
                </h3>
              </div>

              {isSelected && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#785600] sm:text-[11px]">
                  <span>Active</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive Card */}
      <div className="rounded-2xl border border-[#d3c4af]/60 bg-white p-5 shadow-lg sm:p-8">
        <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Left Column: Stage Overview */}
          <div>
            <span className="rounded border border-[#785600]/20 bg-[#785600]/10 px-2.5 py-1 text-[11px] font-bold uppercase text-[#785600] sm:text-xs">
              {selectedStep.badge}
            </span>
            <h3 className="mt-3 text-xl font-extrabold text-[#1a1c1b] sm:text-2xl md:text-3xl">
              {selectedStep.name}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4f4535] sm:text-sm">
              {selectedStep.shortDesc}
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-3 sm:p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                  Stage Input
                </span>
                <span className="mt-0.5 block text-xs font-bold text-[#785600] sm:text-sm">
                  {selectedStep.details.input}
                </span>
              </div>

              <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-3 sm:p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                  Stage Output
                </span>
                <span className="mt-0.5 block text-xs font-bold text-emerald-700 sm:text-sm">
                  {selectedStep.details.output}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Column: Loss Accounting */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl border border-[#785600]/30 bg-gradient-to-br from-[#fff9ed] to-[#fcf6e8] p-4 shadow-sm sm:p-5">
              <div className="mb-1.5 flex items-center gap-2 text-[#785600]">
                <Scale className="h-4 w-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Loss & Recovery Formula
                </h4>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-[#4f4535]">
                {selectedStep.details.lossMetrics}
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#d3c4af]/40 pt-2.5 text-[10px] text-[#817563] sm:text-[11px]">
                <span>Audit Status:</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />{' '}
                  Auto-Balanced
                </span>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5">
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#1a1c1b]">
                Department Capabilities
              </h4>
              {selectedStep.details.keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[#4f4535]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 font-bold text-[#785600]" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Simulated UI Card */}
          <div className="rounded-xl border border-[#785600]/30 bg-white p-5 shadow-md sm:p-6">
            <div className="mb-3.5 flex items-center justify-between border-b border-[#d3c4af]/30 pb-2.5">
              <span className="flex items-center gap-2 text-xs font-bold text-[#1a1c1b]">
                <Sliders className="h-3.5 w-3.5 text-[#785600]" />
                Live Department Entry
              </span>
              <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 sm:text-[10px]">
                22K / 916 READY
              </span>
            </div>

            <div className="font-mono space-y-2 text-xs sm:space-y-2.5">
              <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                <span className="text-[#817563]">Gross In Weight:</span>
                <span className="font-bold text-[#1a1c1b]">1,245.850 g</span>
              </div>
              <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                <span className="text-[#817563]">Target Purity:</span>
                <span className="font-bold text-[#785600]">91.60 % (22K)</span>
              </div>
              <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                <span className="text-[#817563]">Fine Gold Equiv:</span>
                <span className="font-bold text-emerald-700">1,141.198 g</span>
              </div>
              <div className="flex justify-between border-b border-[#f0eae0] py-1 text-[#4f4535]">
                <span className="text-[#817563]">Process Scrap:</span>
                <span className="font-bold text-[#1a1c1b]">14.220 g</span>
              </div>
              <div className="flex justify-between py-1 text-[#4f4535]">
                <span className="text-[#817563]">Net Process Loss:</span>
                <span className="font-bold text-rose-600">
                  0.430 g (0.034%)
                </span>
              </div>
            </div>

            <button
              onClick={() => scrollToSection('trial')}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95 sm:mt-5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free Demo & 7-Day Trial</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
