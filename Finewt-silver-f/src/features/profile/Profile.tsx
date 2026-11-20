import { useRouter } from '@tanstack/react-router';
import React, { useState } from 'react';
import {
  MdArrowBack,
  MdCameraAlt,
  MdEdit,
  MdPerson,
  MdPhoneIphone,
  MdVerified,
  MdChevronRight,
  MdDiversity1,
  MdAccountBalance,
  MdCheckCircle,
  MdEmail,
} from 'react-icons/md';

// ==================== TYPES ====================
interface UserProfile {
  fullName: string;
  mobile: string;
  email: string;
  city: string;
  zipCode: string;
  isEmailVerified: boolean;
  profileImage: string;
}

interface AccountSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

// ==================== MAIN PROFILE COMPONENT ====================
const Profile: React.FC = () => {
  const router = useRouter();

  // State for form data (dynamic & editable)
  const [profile, setProfile] = useState<UserProfile>({
    fullName: 'Michael Thompson',
    mobile: '+91 98765 43210',
    email: 'michael.t@example.com',
    city: 'Nagpur',
    zipCode: '440001',
    isEmailVerified: true,
    profileImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCJUoDBgD_i1-S1kFp6x9JTuFEKouYQ0bIXgeX_imhWMMGDfJh0uCBWWGkynXT2WE-h7jPccF9AoITRTO4UahKBV6-g2IiMnSQENRKU6bQcEj1suQv327thSCcwvplRQQWPhT9KNr5kmHYhV3AopghepfYTeZtdmS4_8Tr_wYUM7tw74wGZcoTRj5d9G7WLSnoHelaGlcln1sjaMvIAQISFEHtZbx2AIhBqNQQgstGVuXpCBoM6_VCWqYxMfWdmPjcoFAA3vyPCUNo',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Handle input changes
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    alert('✅ Profile updated successfully!');
    setIsSaving(false);
  };

  // Account Sections (Dynamic)
  const accountSections: AccountSection[] = [
    {
      id: 'nominee',
      title: 'Nominee Details',
      description: 'Manage inheritance beneficiaries',
      icon: <MdDiversity1 className="text-[#37ec13]" />,
      onClick: () => alert('Navigating to Nominee Details...'),
    },
    {
      id: 'bank',
      title: 'Bank Details',
      description: 'Update withdrawal account',
      icon: <MdAccountBalance className="text-[#37ec13]" />,
      onClick: () => alert('Navigating to Bank Details...'),
    },
  ];

  return (
    <div className="flex min-h-screen justify-center bg-[#000000] text-white">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#000000] px-6 pb-4 pt-2">
          <button
            onClick={() => router.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
          >
            <MdArrowBack className="text-white" />
          </button>

          <h1 className="text-lg font-semibold tracking-tight text-white">
            Edit Profile
          </h1>

          <div className="h-10 w-10" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          {/* Profile Photo Section */}
          <div className="relative mb-10 mt-6 flex flex-col items-center">
            <div className="group relative cursor-pointer">
              <div className="h-28 w-28 rounded-full border-2 border-[#37ec13] p-1 shadow-[0_0_20px_rgba(55,236,19,0.2)]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-[#111111]">
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <MdCameraAlt className="text-2xl text-white" />
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-[#37ec13] text-black shadow-lg hover:bg-[#2dd40f]">
                <MdEdit className="text-base" />
              </button>
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-[#37ec13]/70">
              Tap to change photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                Legal Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) =>
                    handleInputChange('fullName', e.target.value)
                  }
                  className="w-full rounded-full border border-white/10 bg-[#0a0a0a] py-4 pl-6 pr-12 text-sm font-medium text-white focus:border-[#37ec13]/60 focus:outline-none focus:ring-1 focus:ring-[#37ec13]"
                />
                <MdPerson className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-white/30" />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profile.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-[#0a0a0a] py-4 pl-6 pr-12 text-sm font-medium text-white focus:border-[#37ec13]/60 focus:outline-none focus:ring-1 focus:ring-[#37ec13]"
                />
                <MdPhoneIphone className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-white/30" />
              </div>
            </div>

            {/* Email Address (Read Only) */}
            <div>
              <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-full border border-white/10 bg-[#111111] py-4 pl-6 pr-24 text-sm font-medium text-white/60"
                />
                {profile.isEmailVerified && (
                  <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-[#37ec13]/30 bg-[#37ec13]/10 px-3 py-1">
                    <MdVerified className="text-xs text-[#37ec13]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#37ec13]">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* City & Zip Code */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-[#0a0a0a] px-6 py-4 text-sm font-medium text-white focus:border-[#37ec13]/60 focus:outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Zip / Pin Code
                </label>
                <input
                  type="text"
                  value={profile.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-[#0a0a0a] px-6 py-4 text-sm font-medium text-white focus:border-[#37ec13]/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Account Details Section */}
            <div className="pt-6">
              <label className="mb-4 ml-4 block text-[10px] font-bold uppercase tracking-widest text-white/50">
                Account Details
              </label>

              <div className="space-y-3">
                {accountSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={section.onClick}
                    className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#0a0a0a] px-6 py-5 text-left transition-all hover:border-[#37ec13]/30 active:scale-[0.985]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#37ec13]/10">
                        {section.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {section.title}
                        </h3>
                        <p className="text-xs text-white/50">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <MdChevronRight className="text-2xl text-white/30 transition-colors group-hover:text-[#37ec13]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Save Button */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#000000]/95 p-6 backdrop-blur-xl">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#37ec13] py-4 text-base font-bold tracking-wider text-black shadow-[0_0_25px_rgba(55,236,19,0.4)] transition-all hover:bg-[#2dd40f] active:scale-[0.97] disabled:opacity-70"
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
            <MdCheckCircle className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
