import React, {useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import {useMutation} from '@tanstack/react-query';
import {api} from '@/utils/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import {z} from 'zod';

import {ProcessStep, manufacturingSteps} from './landingData';

import {LandingHeader} from './sections/LandingHeader';
import {HeroSection} from './sections/HeroSection';
import {ManufacturingProcess} from './sections/ManufacturingProcess';
import {CoreERPModules} from './sections/CoreERPModules';
import {SystemPreview} from './sections/SystemPreview';
import {DemoTrialRequest} from './sections/DemoTrialRequest';
import {FAQSection} from './sections/FAQSection';
import {BottomCTA} from './sections/BottomCTA';
import {LandingFooter} from './sections/LandingFooter';

const demoTrialSchema = z.object({
  fullname: z.string().min(2, 'Name must be at least 2 characters.'),
  shopName: z.string().min(2, 'Shop Name must be at least 2 characters.'),
  phone: z
    .string()
    .length(10, 'Mobile number must be exactly 10 digits.')
    .regex(/^\d+$/, 'Must contain only digits'),
  password: z.string().min(1, 'Password is required.'),
  pincode: z
    .string()
    .length(6, 'Pincode must be exactly 6 digits')
    .regex(/^\d+$/, 'Must contain only digits'),
  address: z.string().min(3, 'Address must be at least 3 characters.'),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

type DemoTrialFormData = z.infer<typeof demoTrialSchema>;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<ProcessStep>(
    manufacturingSteps[0],
  );
  const [activeDemoTab, setActiveDemoTab] = useState<
    'manufacturing' | 'ledger' | 'billing'
  >('manufacturing');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Demo & Trial Form State
  const [formData, setFormData] = useState<DemoTrialFormData>({
    fullname: '',
    shopName: '',
    phone: '',
    password: '',
    pincode: '',
    address: '',
    city: '',
    district: '',
    state: '',
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof DemoTrialFormData, string>>
  >({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const handlePincodeLookup = async (pincodeVal: string) => {
    const cleanPin = pincodeVal.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      return;
    }

    setIsPincodeLoading(true);
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${cleanPin}`,
      );
      const data = response.data;
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].Status === 'Success' &&
        Array.isArray(data[0].PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const district = po.District || '';
        const state = po.State || '';
        const blockVal =
          po.Block && po.Block.trim().toUpperCase() !== 'NA'
            ? po.Block.trim()
            : '';
        const city = blockVal || district || po.Name || '';

        setFormData((prev) => ({
          ...prev,
          city,
          district,
          state,
        }));

        setFormErrors((prev) => ({...prev, pincode: undefined}));
        toast.success(`Location detected: ${city}, ${state}`);
      } else {
        toast.error('Invalid Pincode or no records found');
      }
    } catch (err) {
      console.warn('Pincode fetch error:', err);
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // React Query Mutation for submitting Demo & Trial Registration
  const saveDemoTrialMutation = useMutation({
    mutationFn: async (payload: DemoTrialFormData) => {
      try {
        await api.post('/users/self-register', {
          fullname: payload.fullname.trim(),
          shopName: payload.shopName.trim(),
          phoneNumber: payload.phone.trim(),
          password: payload.password,
          address: payload.address.trim(),
          pincode: payload.pincode.trim(),
          city: payload.city?.trim() || '',
          district: payload.district?.trim() || '',
          state: payload.state?.trim() || '',
          username: payload.phone.trim(),
          accessType: 'TRIAL',
          role: 'ADMIN',
          key: '12345',
        });
      } catch (err: any) {
        console.warn(
          'Backend self-register endpoint notice:',
          err?.message || err,
        );
      }

      // 2. Persist locally in localStorage for tracking
      const refId = `GC-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = JSON.parse(
        localStorage.getItem('goldchain_demo_requests') || '[]',
      );
      const newEntry = {
        ...payload,
        refId,
        createdAt: new Date().toISOString(),
      };
      existing.push(newEntry);
      localStorage.setItem('goldchain_demo_requests', JSON.stringify(existing));

      return {refId, name: payload.fullname};
    },
    onSuccess: () => {
      setFormData({
        fullname: '',
        shopName: '',
        phone: '',
        password: '',
        pincode: '',
        address: '',
        city: '',
        district: '',
        state: '',
      });
      setFormErrors({});
      setSaveSuccessMsg(
        'Demo trial registration saved! Our team will contact you shortly.',
      );
      toast.success('Demo trial request saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save demo trial registration.');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const {name, value} = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({...prev, phone: digitsOnly}));
    } else if (name === 'pincode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({...prev, pincode: digitsOnly}));
      if (digitsOnly.length === 6) {
        handlePincodeLookup(digitsOnly);
      }
    } else {
      setFormData((prev) => ({...prev, [name]: value}));
    }

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({...prev, [name]: undefined}));
    }
    if (saveSuccessMsg) {
      setSaveSuccessMsg(null);
    }
  };

  const validateForm = () => {
    const result = demoTrialSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof DemoTrialFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof DemoTrialFormData] = err.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handleSaveDemoTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    setSaveSuccessMsg(null);
    saveDemoTrialMutation.mutate(formData);
  };

  const handleGoToLogin = () => {
    setIsMobileMenuOpen(false);
    navigate({to: '/signin'});
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[#f9f9f7] text-[#1a1c1b] antialiased selection:bg-[#785600] selection:text-white">
      <LandingHeader
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        scrollToSection={scrollToSection}
        handleGoToLogin={handleGoToLogin}
      />

      <main className="space-y-16 pb-16 sm:space-y-24 sm:pb-20">
        <HeroSection scrollToSection={scrollToSection} />

        <ManufacturingProcess
          selectedStep={selectedStep}
          setSelectedStep={setSelectedStep}
          scrollToSection={scrollToSection}
        />

        <CoreERPModules />

        <SystemPreview
          activeDemoTab={activeDemoTab}
          setActiveDemoTab={setActiveDemoTab}
          scrollToSection={scrollToSection}
        />

        <DemoTrialRequest
          formData={formData}
          formErrors={formErrors}
          saveSuccessMsg={saveSuccessMsg}
          isPincodeLoading={isPincodeLoading}
          handleInputChange={handleInputChange}
          handleSaveDemoTrial={handleSaveDemoTrial}
          saveDemoTrialMutation={saveDemoTrialMutation}
        />

        <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

        <BottomCTA scrollToSection={scrollToSection} />
      </main>

      <LandingFooter scrollToSection={scrollToSection} />
    </div>
  );
};

export default LandingPage;
