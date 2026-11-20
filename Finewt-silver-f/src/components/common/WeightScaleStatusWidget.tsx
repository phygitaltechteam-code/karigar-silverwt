import React, {useState} from 'react';
import {
  Scale,
  Wifi,
  WifiOff,
  Cable,
  CheckCircle2,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Sliders,
  X,
} from 'lucide-react';
import {useWeightScale} from '@/context/WeightScaleContext';
import toast from 'react-hot-toast';

export const WeightScaleStatusWidget: React.FC = () => {
  const {
    status,
    isConnected,
    liveWeight,
    stableWeight,
    isStable,
    isWebSerialSupported,
    connectSerial,
    disconnect,
    connectWebSocket,
    fillActiveInputWithScale,
  } = useWeightScale();

  const [isExpanded, setIsExpanded] = useState(false);
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:8181');

  const handleConnectSerial = async () => {
    await connectSerial(baudRate);
  };

  const handleConnectWs = () => {
    connectWebSocket(wsUrl);
  };

  const handleInsertCurrent = () => {
    const filled = fillActiveInputWithScale();
    if (filled > 0) {
      toast.success(`Captured ${filled.toFixed(3)} g from Scale!`, {
        icon: '⚖️',
      });
    }
  };

  return (
    <div className="font-sans fixed bottom-6 left-6 z-50 select-none">
      {/* Minimized Pill Badge */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${
            isConnected
              ? isStable
                ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300 shadow-emerald-900/30'
                : 'border-amber-500/40 bg-amber-950/80 text-amber-300 shadow-amber-900/30'
              : 'border-[#785600]/30 bg-[#1a1815]/90 text-[#d3c4af] shadow-black/40'
          }`}
        >
          <Scale className="h-4 w-4 shrink-0 text-amber-400" />

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-sm font-extrabold text-white">
                {isStable ? stableWeight.toFixed(3) : liveWeight.toFixed(3)} g
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                  isStable
                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                    : 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                }`}
              >
                {isStable ? 'STABLE' : 'LIVE'}
              </span>
            </div>
          ) : (
            <span>Connect Scale (COM4)</span>
          )}

          <ChevronUp className="ml-1 h-3.5 w-3.5 opacity-60" />
        </div>
      ) : (
        /* Expanded Control Panel */
        <div className="animate-in fade-in slide-in-from-bottom-2 w-80 rounded-2xl border border-[#785600]/40 bg-[#1a1815]/95 p-4 text-white shadow-2xl backdrop-blur-xl duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Gold Weighing Scale
                </h4>
                <p className="text-[10px] text-amber-200/70">
                  Precision: 0.001 g (COM / WebSocket)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Live Weight Display Screen */}
          <div className="my-3 rounded-xl border border-amber-500/20 bg-black/60 p-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? isStable
                      ? 'bg-emerald-400'
                      : 'animate-pulse bg-amber-400'
                    : 'bg-gray-500'
                }`}
              />
              <span>
                {isConnected
                  ? isStable
                    ? '✅ STABLE WEIGHT'
                    : '⚡ LIVE READING...'
                  : 'DISCONNECTED'}
              </span>
            </div>

            <div className="font-mono my-1 text-3xl font-black tracking-tight text-white">
              {isConnected
                ? (isStable ? stableWeight : liveWeight).toFixed(3)
                : '0.000'}
              <span className="ml-1.5 text-sm font-normal text-amber-400">
                g
              </span>
            </div>

            {isConnected && (
              <div className="font-mono text-[10px] text-white/50">
                {((isStable ? stableWeight : liveWeight) * 1000).toFixed(0)} mg
              </div>
            )}
          </div>

          {/* One-Click Insert to Active Input Button */}
          {isConnected && (
            <button
              type="button"
              onClick={handleInsertCurrent}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Insert Weight into Active Field</span>
            </button>
          )}

          {/* Connection Options */}
          <div className="space-y-2 border-t border-white/10 pt-1 text-xs">
            {!isConnected ? (
              <>
                {/* Direct Serial (COM4) */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-amber-200/80">
                    Direct Serial Port (COM / USB)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(Number(e.target.value))}
                      className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
                    >
                      <option value={9600}>9600 Baud</option>
                      <option value={19200}>19200 Baud</option>
                      <option value={4800}>4800 Baud</option>
                      <option value={2400}>2400 Baud</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleConnectSerial}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-bold text-white transition-colors hover:bg-white/20"
                    >
                      <Cable className="h-3.5 w-3.5 text-amber-400" />
                      <span>Select COM Port</span>
                    </button>
                  </div>
                </div>

                {/* Local Node Bridge (WebSocket) */}
                <div className="pt-2">
                  <label className="mb-1 block text-[10px] font-bold text-amber-200/80">
                    Local Node Bridge Server
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wsUrl}
                      onChange={(e) => setWsUrl(e.target.value)}
                      placeholder="ws://localhost:8181"
                      className="font-mono flex-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConnectWs}
                      className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Connect
                    </button>
                  </div>
                  <p className="mt-1 text-[9px] text-amber-200/60">
                    Auto-redirects to ports 8181, 8080, 8081, 8082 if busy
                  </p>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={disconnect}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/20 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/30"
              >
                Disconnect Scale
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightScaleStatusWidget;
