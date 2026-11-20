import React, {useState, useMemo} from 'react';
import {Calculator, RefreshCw, Sparkles, Info} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import toast from 'react-hot-toast';
import {calculatePureGoldToAdd} from '@/utils/calculations';

export const PurityManagement: React.FC = () => {
  // Input states
  const [goldWeight, setGoldWeight] = useState<string>('');
  const [currentPurity, setCurrentPurity] = useState<string>('');
  const [targetPurity, setTargetPurity] = useState<string>('');

  // Parse numerical values
  const weight = useMemo(
    () => Math.max(0, parseFloat(goldWeight) || 0),
    [goldWeight],
  );
  const purityCurrent = useMemo(
    () => Math.min(100, Math.max(0, parseFloat(currentPurity) || 0)),
    [currentPurity],
  );
  const purityTarget = useMemo(
    () => Math.min(99.99, Math.max(0, parseFloat(targetPurity) || 0)),
    [targetPurity],
  );

  const hasInput =
    goldWeight !== '' && currentPurity !== '' && targetPurity !== '';

  // Validation
  const isValid = useMemo(() => {
    if (!hasInput) return true;
    return (
      weight > 0 &&
      purityCurrent >= 0 &&
      purityCurrent < 100 &&
      purityTarget > purityCurrent &&
      purityTarget < 100
    );
  }, [weight, purityCurrent, purityTarget, hasInput]);

  // Centralized Calculation: A = W * (T - P) / (100 - T)
  const pureGoldToAdd = useMemo(() => {
    if (!hasInput || !isValid) return 0;
    return calculatePureGoldToAdd(weight, purityCurrent, purityTarget);
  }, [weight, purityCurrent, purityTarget, isValid, hasInput]);

  const handleReset = () => {
    setGoldWeight('');
    setCurrentPurity('');
    setTargetPurity('');
    toast.success('Form cleared');
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#f9f9f7] p-4 text-[#1a1c1b] dark:bg-slate-950 dark:text-slate-100 sm:p-6 md:p-8">
      {/* Page Header */}
      <PageHeader
        title="Purity Management"
        subtitle="Quick gold purity upgrade calculator."
      />

      {/* Main Form Card */}
      <div className="max-w-2xl">
        <div className="rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/20 pb-3 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#785600] dark:text-amber-400">
              <Calculator className="h-5 w-5" />
              Purity Calculator
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Current Gold Weight */}
            <div>
              <GenericInputField
                label="Current Gold Weight (g)"
                required
                name="goldWeight"
                autoFocus={true}
                inputMode="decimal"
                decimalScale={3}
                suffix="Grams"
                placeholder="Enter weight in grams"
                value={goldWeight}
                onChange={(e) => setGoldWeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>('input[name="currentPurity"]')?.focus();
                  }
                }}
              />
            </div>

            {/* Current Purity */}
            <div>
              <GenericInputField
                label="Current Purity (%)"
                required
                name="currentPurity"
                inputMode="decimal"
                decimalScale={2}
                suffix="%"
                placeholder="Enter current purity percentage"
                value={currentPurity}
                onChange={(e) => setCurrentPurity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>('input[name="targetPurity"]')?.focus();
                  }
                }}
              />
            </div>

            {/* Target Purity */}
            <div>
              <GenericInputField
                label="Target Purity (%)"
                required
                name="targetPurity"
                inputMode="decimal"
                decimalScale={2}
                suffix="%"
                placeholder="Enter target purity percentage"
                value={targetPurity}
                onChange={(e) => setTargetPurity(e.target.value)}
              />
            </div>

            {/* Pure Gold (100% Fine) to Add - Disabled Input */}
            <div className="pt-1">
              <div className="relative">
                <GenericInputField
                  label="Pure Gold to Add (g)"
                  name="pureGoldToAdd"
                  inputMode="decimal"
                  decimalScale={3}
                  suffix="Grams"
                  readOnly
                  disabled
                  value={
                    pureGoldToAdd > 0
                      ? parseFloat(pureGoldToAdd.toFixed(3)).toString()
                      : ''
                  }
                  placeholder="Result will appear here"
                  className="!cursor-not-allowed !border-2 !border-amber-500/40 !bg-amber-50/60 !font-bold !text-[#785600] dark:!border-amber-500/30 dark:!bg-slate-950 dark:!text-amber-400"
                />
                {pureGoldToAdd > 0 && (
                  <div className="absolute right-12 top-9">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Validation Error */}
            {!isValid && hasInput && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/30 dark:bg-amber-950/40">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Target purity must be greater than current purity and less
                  than 100%.
                </p>
              </div>
            )}

            {/* Quick Result Summary */}
            {isValid && hasInput && pureGoldToAdd > 0 && (
              <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                <p className="text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="font-bold">Result:</span> Add{' '}
                  <span className="font-mono text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                    {parseFloat(pureGoldToAdd.toFixed(3)).toString()}g
                  </span>{' '}
                  of pure gold to reach{' '}
                  <span className="font-bold">{purityTarget}%</span> purity
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurityManagement;
