import React from 'react';
import {Scale, Zap, CheckCircle2, Power} from 'lucide-react';
import {useWeightScale} from '@/context/WeightScaleContext';
import toast from 'react-hot-toast';

export const ScaleSetting: React.FC = () => {
  const {
    isConnected: isScaleConnected,
    liveWeight,
    stableWeight,
    isStable,
    connectSerial,
    disconnect: disconnectScale,
  } = useWeightScale();

  const handleToggleConnect = async () => {
    if (isScaleConnected) {
      await disconnectScale();
      toast.success('Weighing scale disconnected');
    } else {
      const ok = await connectSerial(9600);
      if (ok) {
        toast.success('Weighing scale connected successfully');
      }
    }
  };

  return (
    <div className="py-4">
      <div className="max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-base font-bold text-[#1a1c1b] dark:text-white">
          Weighing Scale Machine (वजन काटा)
        </h3>

        {/* Simple Scale Toggle Button */}
        <button
          type="button"
          onClick={handleToggleConnect}
          className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 active:scale-[0.99] ${
            isScaleConnected
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-[#785600]/30 bg-[#785600]/5 text-[#785600] hover:bg-[#785600]/10 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isScaleConnected
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[#785600]/15 text-[#785600] dark:bg-amber-500/20 dark:text-amber-400'
              }`}
            >
              <Scale
                size={22}
                className={isScaleConnected ? 'animate-pulse' : ''}
              />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                  {isScaleConnected ? 'Scale Connected' : 'Connect Scale'}
                </span>
                {isScaleConnected && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                      isStable
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isStable ? 'STABLE' : 'LIVE'}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#4f4535] dark:text-slate-400">
                {isScaleConnected
                  ? 'Click to disconnect'
                  : 'Click to connect via USB / COM'}
              </span>
            </div>
          </div>

          <div className="text-right">
            {isScaleConnected ? (
              <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                {(isStable ? stableWeight : liveWeight).toFixed(3)} g
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5d4200]">
                <Zap size={13} />
                Connect
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default ScaleSetting;
