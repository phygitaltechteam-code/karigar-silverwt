import React, {useState} from 'react';
import {X} from 'lucide-react';
import toast from 'react-hot-toast';
import {z} from 'zod';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {useCreateClient} from '@/lib/api/client';

const ClientSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number(),
});

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    openingBalance: '',
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    openingBalance?: string;
  }>({});

  const createClient = useCreateClient();

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const {name} = e.target;
    let {value} = e.target;

    if (name === 'fullName') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phoneNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({...prev, [name]: value}));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({...prev, [name]: undefined}));
    }
  };

  const validateForm = (): boolean => {
    try {
      ClientSchema.parse({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        openingBalance: parseFloat(formData.openingBalance) || 0,
      });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setFormErrors(errors);
        toast.error(errors[Object.keys(errors)[0]] || 'Please fix the errors');
      }
      return false;
    }
  };

  const handleAddClient = async () => {
    if (!validateForm()) return;

    try {
      await createClient.mutateAsync({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        openingBalance: parseFloat(formData.openingBalance) || 0,
      });
      setFormData({
        fullName: '',
        phoneNumber: '',
        address: '',
        openingBalance: '',
      });
      setFormErrors({});
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-[95%] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-lg">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d3c4af]/10 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
          <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
            Add New Client
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 p-3 sm:p-4">
          {/* Name */}
          <div>
            <GenericInputField
              label="Name"
              required
              name="fullName"
              autoFocus={true}
              value={formData.fullName}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.querySelector<HTMLInputElement>('input[name="phoneNumber"]')?.focus();
                }
              }}
              placeholder="Enter client name"
              className={
                formErrors.fullName ? '!border-red-500 focus:!ring-red-500' : ''
              }
            />
            {formErrors.fullName && (
              <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                {formErrors.fullName}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <GenericInputField
              label="Phone Number"
              required
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.querySelector<HTMLTextAreaElement>('textarea[name="address"]')?.focus();
                }
              }}
              placeholder="Enter 10-digit phone number"
              className={
                formErrors.phoneNumber
                  ? '!border-red-500 focus:!ring-red-500'
                  : ''
              }
            />
            {formErrors.phoneNumber && (
              <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                {formErrors.phoneNumber}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1c1b] dark:text-white">
              Address <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  document.querySelector<HTMLInputElement>('input[name="openingBalance"]')?.focus();
                }
              }}
              placeholder="Enter address"
              rows={3}
              className={`w-full min-w-0 resize-none rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all duration-200 placeholder:text-[#817563] hover:border-[#785600]/50 focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
                formErrors.address ? '!border-red-500 focus:!ring-red-500' : ''
              }`}
            />
            {formErrors.address && (
              <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                {formErrors.address}
              </p>
            )}
          </div>

          {/* Opening Balance */}
          <div>
            <GenericInputField
              label="Opening Balance (G)"
              required
              name="openingBalance"
              inputMode="decimal"
              decimalScale={3}
              allowNegative={true}
              suffix="G"
              value={formData.openingBalance}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddClient();
                }
              }}
              placeholder="e.g., -50.5 or 50.5"
              className={`font-mono ${
                formErrors.openingBalance
                  ? '!border-red-500 focus:!ring-red-500'
                  : ''
              }`}
            />
            {formErrors.openingBalance && (
              <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                {formErrors.openingBalance}
              </p>
            )}
            <p className="mt-1 text-[8px] text-[#4f4535]/60 dark:text-slate-500 sm:text-[10px]">
              Enter opening balance in grams
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 flex flex-col-reverse justify-end gap-2 border-t border-[#d3c4af]/10 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:gap-3 sm:p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <GenericButton
            type="button"
            onClick={handleAddClient}
            disabled={createClient.isPending}
            variant="primary"
            className="!px-4 !py-2"
          >
            {createClient.isPending ? 'Saving...' : 'Add Client'}
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
