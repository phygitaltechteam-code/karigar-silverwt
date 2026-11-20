import React, { useState, useRef, useEffect } from 'react';
import { Tag, X, Plus, Loader2 } from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericDropdown from '@/components/Forms/Dropdown/GenericDropdown';
import { UnifiedDesignItem } from './unifiedDesignHelpers';
import { manufacturingProcess } from '@/schemas/design.schema';
import { useCreateDesign } from '@/lib/api/design';
import toast from 'react-hot-toast';

interface AddDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (item: UnifiedDesignItem) => void;
  defaultProcess?: string;
}

export const AddDesignModal: React.FC<AddDesignModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  defaultProcess = 'BHARNI',
}) => {
  const [designName, setDesignName] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<manufacturingProcess>(
    manufacturingProcess.BHARNI,
  );
  const [rate, setRate] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const createDesignMutation = useCreateDesign();

  useEffect(() => {
    if (isOpen) {
      setDesignName('');
      setRate('');
      const upper = (defaultProcess || 'BHARNI').toUpperCase();
      if (Object.values(manufacturingProcess).includes(upper as manufacturingProcess)) {
        setSelectedProcess(upper as manufacturingProcess);
      } else {
        setSelectedProcess(manufacturingProcess.BHARNI);
      }
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen, defaultProcess]);

  if (!isOpen) return null;

  const isSoldering = selectedProcess === manufacturingProcess.SOLDERING;

  const handleSave = async () => {
    if (!designName.trim()) {
      toast.error('Design Name is required');
      return;
    }

    let parsedRate: number | undefined = undefined;
    if (isSoldering) {
      if (rate.trim() !== '') {
        const num = Number(rate.trim());
        if (Number.isNaN(num) || num < 0) {
          toast.error('Rate cannot be negative');
          return;
        }
        parsedRate = num;
      }
    }

    try {
      const result = await createDesignMutation.mutateAsync({
        name: designName.trim(),
        process: selectedProcess,
        rate: parsedRate,
      });

      if (onSaved) {
        onSaved({
          id: result.id,
          designName: result.name,
          processType: (result.process.charAt(0).toUpperCase() +
            result.process.slice(1).toLowerCase()) as any,
          ratePerDesign: result.rate !== undefined && result.rate !== null ? String(result.rate) : undefined,
        });
      }

      onClose();
    } catch {
      // Error is handled in mutation hook
    }
  };

  const processOptions = [
    { label: 'Bharni Process', value: manufacturingProcess.BHARNI },
    { label: 'Cutting Process', value: manufacturingProcess.CUTTING },
    { label: 'Polishing Process', value: manufacturingProcess.POLISHING },
    { label: 'Soldering Process', value: manufacturingProcess.SOLDERING },
    { label: 'Vibrator Process', value: manufacturingProcess.VIBRATOR },
    { label: 'Melting Process', value: manufacturingProcess.MELTING },
    { label: 'Company Process', value: manufacturingProcess.COMPANY },
    { label: 'Press Process', value: manufacturingProcess.PRESS },
    { label: 'Sutt Process', value: manufacturingProcess.SUTT },
    { label: 'Wash Process', value: manufacturingProcess.WASH },
    { label: 'Meena Process', value: manufacturingProcess.MEENA },
    { label: 'Tass Process', value: manufacturingProcess.TASS },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-md border border-[#d3c4af]/30 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#785600]/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
              <Tag className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-[#1a1c1b] dark:text-white">
              Add New Design (मास्टर डिज़ाइन)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          <GenericInputField
            label="Design Name *"
            required
            placeholder="Enter design name (e.g. Indo-Italian, Round Box)"
            value={designName}
            inputRef={nameRef}
            onChange={(e) => setDesignName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <GenericDropdown
            label="Manufacturing Process *"
            value={selectedProcess}
            options={processOptions}
            onChange={(val) => setSelectedProcess(val as manufacturingProcess)}
          />

          {isSoldering ? (
            <GenericInputField
              label="Rate / Design (Rs) (Optional)"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 120"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          ) : (
            <div className="rounded-lg bg-amber-50/60 p-2.5 text-xs text-[#785600] dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30">
              Note: Rate is only applicable for the <strong>Soldering</strong> process.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#d3c4af]/10 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={createDesignMutation.isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <GenericButton
            variant="primary"
            onClick={handleSave}
            type="button"
            disabled={createDesignMutation.isPending}
          >
            {createDesignMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Save Design</span>
              </>
            )}
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default AddDesignModal;
