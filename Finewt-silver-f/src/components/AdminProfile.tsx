import React, {useState, useEffect} from 'react';
import {useAuthContext} from '@/context/AuthContext';
import {useGetProfileData, useUpdateProfile} from '@/lib/api/profile';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Key,
  Calendar,
  BadgeCheck,
  Save,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Clock8,
  CalendarDays,
} from 'lucide-react';
import {
  getSavedWeekCycle,
  saveWeekCycle,
  WEEK_DAYS,
  WEEK_CYCLE_OPTIONS,
  getCurrentAppWeekRange,
  WeekCycleConfig,
} from '@/utils/weekRangeUtils';
import { BsShop } from 'react-icons/bs';

// Helpers for converting between "HH:mm" time inputs and ISO Date strings expected by backend
const formatTimeToISO = (time?: string | null): string | null => {
  if (!time || !time.trim()) return null;
  if (time.includes('T') || time.includes('Z')) {
    const d = new Date(time);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  const parts = time.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const d = new Date();
    d.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return d.toISOString();
  }
  return null;
};

const formatISOToTime = (isoOrTimeString?: string | null): string => {
  if (!isoOrTimeString) return '';
  if (/^\d{2}:\d{2}$/.test(isoOrTimeString)) {
    return isoOrTimeString;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(isoOrTimeString)) {
    return isoOrTimeString.slice(0, 5);
  }
  try {
    const d = new Date(isoOrTimeString);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) {}
  return '';
};

const formatDateDisplay = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const AdminProfile: React.FC = () => {
  const {user} = useAuthContext();
  const getdata = useGetProfileData();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    shopName:'',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    address: '',
    accessType: 'ONLINE',
    key: '',
    expiryDate: '',
    workStartTime: '',
    workEndTime: '',
    workStatus: 'active',
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Weekly Date Cycle Settings
  const [weekConfig, setWeekConfig] = useState<WeekCycleConfig>(() =>
    getSavedWeekCycle(),
  );
  const [weekRangeDates, setWeekRangeDates] = useState<{from: Date; to: Date}>(
    () => {
      const range = getCurrentAppWeekRange();
      return {from: range.fromDate, to: range.toDate};
    },
  );

  const handleWeeklyCycleDayChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedDay = Number(e.target.value);
    const calculatedEndDay = (selectedDay - 1 + 7) % 7;
    const matchingOption = WEEK_CYCLE_OPTIONS.find(
      (opt) => opt.startDay === selectedDay,
    );

    const updated: WeekCycleConfig = {
      startDay: selectedDay,
      endDay: calculatedEndDay,
      cycleId: matchingOption?.cycleId || 'custom',
    };
    setWeekConfig(updated);
    saveWeekCycle(updated);

    // Recalculate the live week range dates
    const range = getCurrentAppWeekRange();
    setWeekRangeDates({from: range.fromDate, to: range.toDate});

    const startDayName = WEEK_DAYS.find((d) => d.value === selectedDay)?.label;
    const endDayName = WEEK_DAYS.find(
      (d) => d.value === calculatedEndDay,
    )?.label;
    toast.success(`Weekly cycle set: ${startDayName} to ${endDayName}`);
  };

  useEffect(() => {
    if (!getdata?.data && !user) return;

    const resData = getdata?.data?.data || getdata?.data || {};
    const userObj = resData.user || resData;

    setFormData({
      fullname: userObj?.fullname || userObj?.name || user?.fullname || '',
      email: userObj?.email || resData?.contactPersonEmail || user?.email || '',
      phoneNumber:
        userObj?.phoneNumber || userObj?.phone || user?.phoneNumber || '',
      secondaryPhoneNumber:
        userObj?.secondaryPhoneNumber ||
        userObj?.secondazyPhoneNumber ||
        resData?.contactPersonNumber ||
        '',
      shopName: resData?.shopName || userObj?.shopName || user?.shopName || '',
      address:
        userObj?.address ||
        resData?.address ||
        resData?.city ||
        user?.address ||
        '',
      accessType: (
        resData?.accessType ||
        userObj?.accessType ||
        'ONLINE'
      ).toUpperCase(),
      key: resData?.key !== undefined ? resData.key : user?.key || '',
      expiryDate: resData?.expiryDate || '',
      workStartTime: formatISOToTime(
        resData?.workStartTime || userObj?.workStartTime,
      ),
      workEndTime: formatISOToTime(
        resData?.workEndTime || userObj?.workEndTime,
      ),
      workStatus: resData?.workStatus || userObj?.workStatus || 'active',
    });
  }, [getdata?.data, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setPasswordData((prev) => ({...prev, [name]: value}));
  };

  // Combined save - handles both profile update and password change
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Prepare payload with profile data
    const payload: any = {
      fullname: formData.fullname,
      email: formData.email,
      shopName:formData.shopName || '',
      phoneNumber: formData.phoneNumber,
      secondaryPhoneNumber: formData.secondaryPhoneNumber,
      address: formData.address,
      workStartTime: formatTimeToISO(formData.workStartTime),
      workEndTime: formatTimeToISO(formData.workEndTime),
    };

    // Check if password fields are filled
    const hasCurrentPassword = passwordData.currentPassword.trim() !== '';
    const hasNewPassword = passwordData.newPassword.trim() !== '';

    if (hasCurrentPassword || hasNewPassword) {
      payload.currentPassword = passwordData.currentPassword;
      payload.newPassword = passwordData.newPassword;
    }

    try {
      await updateProfile.mutateAsync(payload);
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
      });
    } catch (error: any) {
      console.error('Update error:', error);
    }
  };

  const resData = getdata?.data?.data || getdata?.data || {};
  const userObj = resData.user || resData;

  return (
    <div className="bg-[#f9f9f7] px-4 py-3 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Profile Form with Header Actions and 2-Column Compact Layout */}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
            {/* LEFT COLUMN: Account Information (Compact 2-col field grid) */}
            <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <User className="h-4 w-4" />
                    Account Information
                  </h3>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Shop Name */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Shop Name
                    </label>
                    <div className="relative flex items-center">
                      <BsShop className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleInputChange}
                        placeholder="Enter shop name"
                        autoComplete="off"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Primary Phone */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Primary Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Primary phone"
                        className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Secondary Phone */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Secondary Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="secondaryPhoneNumber"
                        value={formData.secondaryPhoneNumber}
                        onChange={handleInputChange}
                        placeholder="Secondary phone"
                        className="font-mono w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Location / Address
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter location / address"
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Expiry Date & Time
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="expiryDate"
                        value={(() => {
                          const raw =
                            formData.expiryDate ||
                            resData?.expiryDate ||
                            user?.expiryDate;
                          if (!raw) return 'N/A';
                          const parsed = new Date(raw);
                          return isNaN(parsed.getTime())
                            ? raw
                            : parsed.toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              });
                        })()}
                        disabled
                        className="bg-gray-50 w-full rounded-lg border border-[#d3c4af]/40 py-1.5 pl-8 pr-2.5 text-xs font-medium text-[#1a1c1b] dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Access Type */}
                  <div className="col-span-1">
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Access Type
                    </label>
                    <div className="flex h-[30px] items-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase text-green-800 dark:bg-green-950/40 dark:text-green-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {formData.accessType || 'ONLINE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Work Hours, Password & Weekly Date Cycle */}
            <div className="space-y-3">
              {/* Work Hours & Security Card */}
              <div className="rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    Work Schedule & Security
                  </h3>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Work Start Time */}
                  <div>
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Work Start Time
                    </label>
                    <div className="relative flex items-center">
                      <Clock className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="time"
                        name="workStartTime"
                        value={formData.workStartTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Work End Time */}
                  <div>
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Work End Time
                    </label>
                    <div className="relative flex items-center">
                      <Clock8 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="time"
                        name="workEndTime"
                        value={formData.workEndTime}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Current Password */}
                  <div>
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Current Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Current password"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        spellCheck={false}
                        style={{
                          WebkitTextSecurity: showCurrentPassword
                            ? 'none'
                            : 'disc',
                        }}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-8 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <Key className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <input
                        type="text"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="New password"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        spellCheck={false}
                        style={{
                          WebkitTextSecurity: showNewPassword ? 'none' : 'disc',
                        }}
                        className="w-full rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-8 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Date Cycle Settings Card */}
              <div className="rounded-xl border border-[#d3c4af]/30 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-slate-800">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                    <CalendarDays className="h-4 w-4" />
                    Default Weekly Date Cycle
                  </h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-[#785600] dark:bg-slate-800 dark:text-amber-300">
                    <span>Active Cycle:</span>
                    <span className="font-bold">
                      {
                        WEEK_DAYS.find((d) => d.value === weekConfig.startDay)
                          ?.label
                      }{' '}
                      to{' '}
                      {
                        WEEK_DAYS.find((d) => d.value === weekConfig.endDay)
                          ?.label
                      }
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
                  {/* Single Weekly Day Dropdown */}
                  <div>
                    <label className="text-gray-500 mb-1 block text-[11px] font-semibold dark:text-slate-400">
                      Weekly Day Cycle
                    </label>
                    <div className="relative flex items-center">
                      <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                      <select
                        value={weekConfig.startDay}
                        onChange={handleWeeklyCycleDayChange}
                        className="w-full cursor-pointer rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-8 pr-2.5 text-xs font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white"
                      >
                        {WEEK_CYCLE_OPTIONS.map((opt) => (
                          <option key={opt.startDay} value={opt.startDay}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Current Active Date Range Display */}
                  <div className="rounded-lg border border-[#d3c4af]/30 bg-amber-50/40 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                      Current Cycle Dates:
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#1a1c1b] dark:text-white">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-[#785600] dark:text-amber-400" />
                      <span>
                        {formatDateDisplay(weekRangeDates.from)} to{' '}
                        {formatDateDisplay(weekRangeDates.to)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <GenericButton
              type="submit"
              variant="primary"
              disabled={updateProfile.isPending}
              className="!px-4 !py-1.5 !text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </span>
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
