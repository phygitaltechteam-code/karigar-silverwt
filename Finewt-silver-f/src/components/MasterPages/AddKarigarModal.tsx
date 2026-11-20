import React, { useState, useRef, useEffect } from 'react';
import { User, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  UnifiedKarigarEntry,
  KarigarProcessType,
  createSampleStages,
  createSampleLedger,
} from './unifiedKarigarHelpers';

import { useCreateKarigar } from '@/lib/api/karigar';
import { createSchema } from '@/schemas/karigar.schema';

interface AddKarigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (entry: UnifiedKarigarEntry) => void;
  initialProcessType?: KarigarProcessType;
}

export const AddKarigarModal: React.FC<AddKarigarModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialProcessType = 'Melting',
}) => {
  const [form, setForm] = useState<{
    name: string;
    number: string;
    address: string;
    processType: KarigarProcessType;
    openingBalance: string;
  }>({
    name: '',
    number: '',
    address: '',
    processType: initialProcessType as KarigarProcessType,
    openingBalance: '0',
  });

  const { mutateAsync: createKarigar, isPending } = useCreateKarigar();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: '',
        number: '',
        address: '',
        processType: initialProcessType,
        openingBalance: '0',
      });
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen, initialProcessType]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const parsed = createSchema.parse({
        name: form.name.trim(),
        process: form.processType,
        phone: form.number.trim() || null,
        address: form.address.trim() || null,
        openingBalance: form.openingBalance ? parseFloat(form.openingBalance) : 0,
      });

      const entry = await createKarigar(parsed);
      onSaved(entry);
      onClose();
    } catch (err: any) {
      if (err?.errors && err.errors[0]?.message) {
        toast.error(err.errors[0].message);
      } else {
        toast.error(err?.message || 'Please check form fields');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-md border border-[#d3c4af]/30 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#785600]/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
              <User className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-[#1a1c1b] dark:text-white">
              Add New Karigar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <GenericInputField
              label="Karigar Name *"
              placeholder="Enter karigar name"
              value={form.name}
              inputRef={nameRef}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
              Manufacturing Process Type *
            </label>
            <select
              value={form.processType}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  processType: e.target.value as KarigarProcessType,
                }))
              }
              className="w-full rounded-lg border border-[#b8a892] bg-white px-3 py-2 text-xs font-medium text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="Melting">Melting Process Karigar</option>
              <option value="Company">Company Process Karigar</option>
              <option value="Press">Press Process Karigar</option>
              <option value="Sutt">Sutt Process Karigar</option>
              <option value="Bharni">Bharni Process Karigar</option>
              <option value="Cutting">Cutting Process Karigar</option>
              <option value="Wash">Wash Process Karigar</option>
              <option value="Soldering">Soldering Process Karigar</option>
              <option value="Polishing">Polishing Process Karigar</option>
              <option value="Vibrator">Vibrator Process Karigar</option>
              <option value="Meena">Meena Process Karigar</option>
              <option value="Tass">Tass Process Karigar</option>
            </select>
          </div>

          <div>
            <GenericInputField
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={form.number}
              maxLength={10}
              inputMode="numeric"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm((p) => ({ ...p, number: val }));
              }}
            />
          </div>

          <div>
            <GenericInputField
              label="City / Address"
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>

          <div>
            <GenericInputField
              label="Opening Balance (G)"
              type="text"
              inputMode="decimal"
              placeholder="0.000"
              value={form.openingBalance}
              suffix="G"
              onChange={(e) =>
                setForm((p) => ({ ...p, openingBalance: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#d3c4af]/10 p-4 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <GenericButton
            variant="primary"
            onClick={handleSave}
            type="button"
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            <span>{isPending ? 'Saving...' : 'Save Karigar'}</span>
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default AddKarigarModal;
