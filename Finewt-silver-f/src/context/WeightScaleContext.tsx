import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import weightScaleService, {
  ScaleReading,
  ScaleStatus,
} from '@/lib/services/weightScaleService';
import toast from 'react-hot-toast';

interface WeightScaleContextType {
  status: ScaleStatus;
  isConnected: boolean;
  liveWeight: number; // grams (3 decimals)
  stableWeight: number; // grams (3 decimals)
  isStable: boolean;
  statusMessage: string;
  isWebSerialSupported: boolean;
  connectSerial: (baudRate?: number) => Promise<boolean>;
  disconnect: () => Promise<void>;
  connectWebSocket: (url?: string) => void;
  fillActiveInputWithScale: (customWeight?: number) => number;
}

const WeightScaleContext = createContext<WeightScaleContextType | undefined>(
  undefined,
);

export const WeightScaleProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [status, setStatus] = useState<ScaleStatus>(
    weightScaleService.getStatus(),
  );
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [reading, setReading] = useState<ScaleReading>(
    weightScaleService.getReading(),
  );

  useEffect(() => {
    const unsubReading = weightScaleService.onReading((newReading) => {
      setReading(newReading);
    });

    const unsubStatus = weightScaleService.onStatus((newStatus, message) => {
      setStatus(newStatus);
      if (message) setStatusMessage(message);
    });

    // Auto-reconnect previously authorized COM port on web/HTTPS
    weightScaleService.autoConnectPreviousSerial();

    return () => {
      unsubReading();
      unsubStatus();
    };
  }, []);

  const connectSerial = useCallback(
    async (baudRate = 9600): Promise<boolean> => {
      const ok = await weightScaleService.connectSerial(baudRate);
      if (ok) {
        toast.success('Weighing Scale connected via Serial (COM)', {
          icon: '⚖️',
        });
      }
      return ok;
    },
    [],
  );

  const disconnect = useCallback(async () => {
    await weightScaleService.disconnect();
    toast('Scale disconnected', {icon: '🔌'});
  }, []);

  const connectWebSocket = useCallback((url?: string) => {
    weightScaleService.initLocalWebSocketBridge(url);
    if (url) {
      toast.success(`Connecting to local scale server at ${url}...`, {
        icon: '🌐',
      });
    } else {
      toast.success('Scanning local scale ports (8181, 8080, 8081, 8082)...', {
        icon: '🌐',
      });
    }
  }, []);

  // Injects the current stable scale weight into whichever input field is focused
  const fillActiveInputWithScale = useCallback(
    (customWeight?: number): number => {
      const weightToUse =
        customWeight !== undefined
          ? customWeight
          : reading.stableWeight > 0
            ? reading.stableWeight
            : reading.liveWeight;

      if (weightToUse <= 0) {
        toast.error('No weight detected on scale yet', {icon: '⚖️'});
        return 0;
      }

      const activeEl = document.activeElement as HTMLInputElement | null;
      if (activeEl && activeEl.tagName === 'INPUT') {
        const valStr = weightToUse.toFixed(3);
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;

        if (nativeSetter) {
          nativeSetter.call(activeEl, valStr);
        } else {
          activeEl.value = valStr;
        }

        activeEl.dispatchEvent(new Event('input', {bubbles: true}));
        activeEl.dispatchEvent(new Event('change', {bubbles: true}));

        // Visual flash highlight
        activeEl.classList.add(
          'ring-2',
          'ring-emerald-500',
          'bg-emerald-50/50',
        );
        setTimeout(() => {
          activeEl.classList.remove(
            'ring-2',
            'ring-emerald-500',
            'bg-emerald-50/50',
          );
        }, 1200);

        toast.success(`Scale Weight Applied: ${valStr} g`, {
          icon: '⚖️',
          duration: 2000,
        });
      }

      return weightToUse;
    },
    [reading],
  );

  return (
    <WeightScaleContext.Provider
      value={{
        status,
        isConnected: status === 'connected',
        liveWeight: reading.liveWeight,
        stableWeight: reading.stableWeight,
        isStable: reading.isStable,
        statusMessage,
        isWebSerialSupported: weightScaleService.isWebSerialSupported(),
        connectSerial,
        disconnect,
        connectWebSocket,
        fillActiveInputWithScale,
      }}
    >
      {children}
    </WeightScaleContext.Provider>
  );
};

export const useWeightScale = (): WeightScaleContextType => {
  const context = useContext(WeightScaleContext);
  if (!context) {
    throw new Error('useWeightScale must be used within a WeightScaleProvider');
  }
  return context;
};

export default WeightScaleContext;
