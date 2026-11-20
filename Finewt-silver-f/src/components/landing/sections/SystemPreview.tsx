import React from 'react';
import {Sparkles} from 'lucide-react';

interface SystemPreviewProps {
  activeDemoTab: 'manufacturing' | 'ledger' | 'billing';
  setActiveDemoTab: (tab: 'manufacturing' | 'ledger' | 'billing') => void;
  scrollToSection: (id: string) => void;
}

export const SystemPreview: React.FC<SystemPreviewProps> = ({
  activeDemoTab,
  setActiveDemoTab,
  scrollToSection,
}) => {
  return (
    <section
      id="demo"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-3xl border border-[#d3c4af]/60 bg-white p-5 shadow-xl sm:p-8 md:p-10">
        <div className="mb-6 flex flex-col gap-4 border-b border-[#d3c4af]/30 pb-5 sm:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[#785600] sm:text-xs">
              Live Platform Preview
            </span>
            <h3 className="text-xl font-extrabold text-[#1a1c1b] sm:text-2xl md:text-3xl">
              Experience the ERP Interface
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-1 sm:gap-2 sm:self-auto">
            <button
              onClick={() => setActiveDemoTab('manufacturing')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeDemoTab === 'manufacturing'
                  ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                  : 'text-[#4f4535] hover:text-[#785600]'
              }`}
            >
              Factory Floor
            </button>
            <button
              onClick={() => setActiveDemoTab('ledger')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeDemoTab === 'ledger'
                  ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                  : 'text-[#4f4535] hover:text-[#785600]'
              }`}
            >
              Fine Gold Ledger
            </button>
            <button
              onClick={() => setActiveDemoTab('billing')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeDemoTab === 'billing'
                  ? 'bg-gradient-to-r from-[#785600] to-[#986d00] text-white shadow-sm'
                  : 'text-[#4f4535] hover:text-[#785600]'
              }`}
            >
              Smart Invoicing
            </button>
          </div>
        </div>

        {/* Tab 1: Manufacturing Simulation */}
        {activeDemoTab === 'manufacturing' && (
          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5">
              <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#785600]">
                Active Job Batches
              </div>
              <div className="font-mono space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                  <div>
                    <div className="font-bold text-[#1a1c1b]">
                      BATCH #CH-2026-88
                    </div>
                    <div className="text-[10px] text-[#817563]">
                      22K Box Chain (18 Inch)
                    </div>
                  </div>
                  <span className="rounded bg-[#785600]/15 px-2 py-0.5 text-[9px] font-bold text-[#785600] sm:text-[10px]">
                    Cutting
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                  <div>
                    <div className="font-bold text-[#1a1c1b]">
                      BATCH #CH-2026-89
                    </div>
                    <div className="text-[10px] text-[#817563]">
                      18K Rope Chain (20 Inch)
                    </div>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 sm:text-[10px]">
                    Finishing
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm sm:p-3">
                  <div>
                    <div className="font-bold text-[#1a1c1b]">
                      BATCH #CH-2026-90
                    </div>
                    <div className="text-[10px] text-[#817563]">
                      22K Tar Wire Spool (0.35mm)
                    </div>
                  </div>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 sm:text-[10px]">
                    Tar Dept
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-5 md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1a1c1b]">
                  Department Weight Reconciliation
                </span>
                <span className="font-mono rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-[11px]">
                  99.96% Yield
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="font-mono w-full min-w-[340px] text-left text-xs">
                  <thead className="border-b border-[#d3c4af]/40 text-[10px] text-[#817563] sm:text-[11px]">
                    <tr>
                      <th className="pb-2">Dept</th>
                      <th className="pb-2">Gross In</th>
                      <th className="pb-2">Gross Out</th>
                      <th className="pb-2">Scrap</th>
                      <th className="pb-2 text-right">Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e2d8] text-[#1a1c1b]">
                    <tr>
                      <td className="py-2 font-bold text-[#785600]">
                        1. Melting
                      </td>
                      <td>2,500.00 g</td>
                      <td>2,488.50 g</td>
                      <td>10.20 g</td>
                      <td className="text-right font-bold text-rose-600">
                        1.30 g
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-[#785600]">2. Tar</td>
                      <td>2,488.50 g</td>
                      <td>2,460.10 g</td>
                      <td>26.50 g</td>
                      <td className="text-right font-bold text-rose-600">
                        1.90 g
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-bold text-[#785600]">
                        3. Soldering
                      </td>
                      <td>2,460.10 g</td>
                      <td>2,520.40 g</td>
                      <td>5.20 g</td>
                      <td className="text-right font-bold text-emerald-700">
                        +65.50 g
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ledger Simulation */}
        {activeDemoTab === 'ledger' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                Vault Pure Gold Stock
              </div>
              <div className="font-mono mt-1.5 text-2xl font-black text-[#785600] sm:text-3xl">
                4,821.450 g
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                24K Bullion Equivalent
              </div>
            </div>

            <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                Customer Pending Metal
              </div>
              <div className="font-mono mt-1.5 text-2xl font-black text-[#986d00] sm:text-3xl">
                1,240.800 g
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                Fine Gold Receivables
              </div>
            </div>

            <div className="rounded-xl border border-[#785600]/30 bg-[#fffdf9] p-4 text-center shadow-sm sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#817563] sm:text-[11px]">
                Finished Ready Stock
              </div>
              <div className="font-mono mt-1.5 text-2xl font-black text-emerald-700 sm:text-3xl">
                3,580.650 g
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-[#4f4535]">
                Hallmarked 916 Chains
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Billing Simulation */}
        {activeDemoTab === 'billing' && (
          <div className="rounded-xl border border-[#d3c4af]/40 bg-[#f9f9f7] p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 border-b border-[#d3c4af]/40 pb-3 sm:flex-row sm:items-center">
              <div>
                <h4 className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                  TAX INVOICE / RECEIPT #INV-2026-1044
                </h4>
                <p className="text-[10px] text-[#817563] sm:text-[11px]">
                  Client: Royal Jewellers (GSTIN: 27AABCR1234F1Z5)
                </p>
              </div>
              <span className="self-start rounded border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 sm:self-auto sm:text-xs">
                PAID / SETTLED
              </span>
            </div>

            <div className="font-mono mb-4 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4 sm:gap-4">
              <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                  Total Gross Wt:
                </span>
                <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                  485.600 g
                </span>
              </div>
              <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                  Total Fine Gold:
                </span>
                <span className="text-xs font-bold text-[#785600] sm:text-sm">
                  444.810 g
                </span>
              </div>
              <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                  Labor (SRP):
                </span>
                <span className="text-xs font-bold text-emerald-700 sm:text-sm">
                  ₹ 24,280
                </span>
              </div>
              <div className="rounded-lg border border-[#d3c4af]/40 bg-white p-2.5 shadow-sm sm:p-3">
                <span className="block text-[9px] text-[#817563] sm:text-[10px]">
                  Settlement:
                </span>
                <span className="text-xs font-bold text-[#1a1c1b] sm:text-sm">
                  Metal + Cash
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => scrollToSection('trial')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Get Free Demo & 7-Day Trial</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
