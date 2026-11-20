import React, {useState} from 'react';
import {CheckCircle2, Send, Sparkles, Eye, EyeOff, Loader2} from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {UseMutationResult} from '@tanstack/react-query';

interface DemoTrialRequestProps {
  formData: {
    fullname: string;
    shopName: string;
    phone: string;
    password?: string;
    pincode: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
  };
  formErrors: Record<string, string | undefined>;
  saveSuccessMsg: string | null;
  isPincodeLoading: boolean;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleSaveDemoTrial: (e: React.FormEvent) => void;
  saveDemoTrialMutation: UseMutationResult<any, any, any, any>;
}

export const DemoTrialRequest: React.FC<DemoTrialRequestProps> = ({
  formData,
  formErrors,
  saveSuccessMsg,
  isPincodeLoading,
  handleInputChange,
  handleSaveDemoTrial,
  saveDemoTrialMutation,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section
      id="trial"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8"
    >
      {/* Legacy anchor support so any #pricing link scrolls smoothly here */}
      <span id="pricing" className="-mt-20 block h-0" />

      <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#785600]/20 bg-[#785600]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#785600] sm:text-xs">
          <Sparkles className="h-3 w-3 text-[#785600]" />
          Free Demo & 7-Day Trial
        </div>
        <h2 className="text-2xl font-black text-[#1a1c1b] sm:text-3xl md:text-4xl">
          Register for Free Demo & Trial
        </h2>
        <p className="mt-1.5 text-xs text-[#4f4535] sm:text-sm">
          Enter your workshop details below to save your trial registration.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-[#d3c4af]/60 bg-white p-6 shadow-xl shadow-[#785600]/10 sm:p-8 md:p-9">
          <form
            onSubmit={handleSaveDemoTrial}
            noValidate
            className="flex flex-col space-y-6 sm:space-y-8"
          >
            {saveSuccessMsg && (
              <div className="animate-in fade-in flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <GenericInputField
                  name="fullname"
                  label="Your Full Name"
                  placeholder="e.g. Rajesh Soni"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.fullname
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                />
                {formErrors.fullname && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.fullname}
                  </p>
                )}
              </div>

              <div>
                <GenericInputField
                  name="shopName"
                  label="Shop Name"
                  placeholder="e.g. Rajesh Jewellers"
                  value={formData.shopName}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.shopName
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                />
                {formErrors.shopName && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.shopName}
                  </p>
                )}
              </div>

              <div>
                <GenericInputField
                  name="phone"
                  label="Mobile / WhatsApp Number"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 10 digit mobile number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.phone
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                />
                {formErrors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <GenericInputField
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.password
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center justify-center p-1 text-[#817563] hover:text-[#785600]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                {formErrors.password && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div className="relative">
                <GenericInputField
                  name="pincode"
                  label="Pincode"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6 digit pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.pincode
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                />
                {isPincodeLoading && (
                  <div className="absolute right-3 top-[34px]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#785600]" />
                  </div>
                )}
                {formErrors.pincode && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.pincode}
                  </p>
                )}
              </div>

              <div>
                <GenericInputField
                  name="city"
                  label="City"
                  placeholder="Auto-filled via pincode"
                  value={formData.city}
                  readOnly
                  disabled
                  className="bg-slate-50 opacity-70"
                />
              </div>

              <div>
                <GenericInputField
                  name="district"
                  label="District"
                  placeholder="Auto-filled via pincode"
                  value={formData.district}
                  readOnly
                  disabled
                  className="bg-slate-50 opacity-70"
                />
              </div>

              <div>
                <GenericInputField
                  name="state"
                  label="State"
                  placeholder="Auto-filled via pincode"
                  value={formData.state}
                  readOnly
                  disabled
                  className="bg-slate-50 opacity-70"
                />
              </div>

              <div>
                <GenericInputField
                  name="address"
                  label="Workshop / Store Address"
                  placeholder="e.g. Shop 24, Zaveri Bazaar, Kalbadevi"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className={
                    formErrors.address
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200'
                      : ''
                  }
                />
                {formErrors.address && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    {formErrors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm pt-4">
              <button
                type="submit"
                disabled={saveDemoTrialMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] via-[#8c6400] to-[#986d00] py-3.5 text-xs font-bold text-white shadow-xl shadow-[#785600]/25 transition-all hover:opacity-95 hover:shadow-2xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75 sm:text-sm"
              >
                {saveDemoTrialMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Your Demo Trial...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Save & Book Free Demo Trial</span>
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-[#817563]">
                🔒 Your contact information is kept strictly confidential and
                used solely to provision your demo account.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
