import React from 'react';
import {Scale, Check} from 'lucide-react';
import {useWeightScale} from '@/context/WeightScaleContext';
import toast from 'react-hot-toast';

interface ScaleInputButtonProps {
  onCaptureWeight: (weight: number) => void;
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

export const ScaleInputButton: React.FC<ScaleInputButtonProps> = ({
  onCaptureWeight,
  className = '',
  size = 'sm',
  title = 'Read Weight from Scale',
}) => {
  const {isConnected, stableWeight, liveWeight, isStable, connectSerial} =
    useWeightScale();

  const currentWeight = stableWeight > 0 ? stableWeight : liveWeight;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConnected) {
      toast('Connecting to scale...', {icon: '⚖️'});
      const ok = await connectSerial();
      if (!ok) return;
    }

    if (currentWeight <= 0) {
      toast.error('Place item on scale to read weight', {icon: '⚖️'});
      return;
    }

    onCaptureWeight(Number(currentWeight.toFixed(3)));
    toast.success(`Scale Read: ${currentWeight.toFixed(3)} g`, {
      icon: '⚖️',
      duration: 1500,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${title} (Current: ${currentWeight.toFixed(3)} g)`}
      className={`inline-flex items-center justify-center gap-1 rounded border font-bold transition-all active:scale-95 ${
        isConnected
          ? isStable
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400'
          : 'border-[#785600]/20 bg-[#785600]/10 text-[#785600] hover:bg-[#785600]/20 dark:text-amber-400'
      } ${
        size === 'sm' ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
      } ${className}`}
    >
      <Scale className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>
        {isConnected && currentWeight > 0
          ? `${currentWeight.toFixed(3)} g`
          : 'Scale'}
      </span>
    </button>
  );
};

export default ScaleInputButton;
