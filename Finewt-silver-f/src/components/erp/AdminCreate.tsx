import React, {useState, useMemo} from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
  MapPin,
  Sparkles,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  useGetAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  getAdminByIdApi,
  AdminPayload,
} from '@/lib/api/admin';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';

export interface AdminItem {
  id: string;
  userId?: string;
  fullname: string;
  shopName: string;
  email: string;
  username: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  address: string;
  accessType: 'ONLINE' | 'OFFLINE' | 'TRIAL' | string;
  amount?: string | number;
  renewalAmount?: string | number;
  expiryDate?: string;
  rawExpiryDate?: string;
  effectiveExpiryDate?: string;
  hasExtension?: boolean;
  isExpired?: boolean;
  key?: string;
  isUsedKey?: boolean | null;
  role?: string;
  extendKey?: string | null;
  extendDays?: number | string | null;
  isExtendUsedKey?: boolean | null;
  startDate?: string;
  createdAt?: string;
  rawItem?: any;
}

// Calculate default expiry date: 7 days for TRIAL/TRIAL, 1 year for ONLINE/OFFLINE
const calculateDefaultExpiry = (type: string): string => {
  const d = new Date();
  const upperType = (type || 'ONLINE').toUpperCase();
  if (upperType === 'TRIAL' || upperType === 'TRIAL') {
    d.setDate(d.getDate() + 7);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const formatForDatetimeLocal = (isoString?: string) => {
  if (!isoString) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return {date: '-', time: '-'};
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return {date: dateString, time: ''};
    return {
      date: d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  } catch {
    return {date: dateString || '-', time: ''};
  }
};

// Update formatDisplayDateTime to handle ISO strings
const formatDisplayDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const AdminCreate: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedTab, setSelectedTab] = useState<
    'ALL' | 'ONLINE' | 'OFFLINE' | 'TRIAL' | 'EXPIRED'
  >('ALL');

  // Sorting state for Create Date & Expiry Date
  const [sortField, setSortField] = useState<'createdAt' | 'expiryDate' | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullname: '',
    shopName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    username: '',
    password: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    address: '',
    accessType: 'ONLINE',
    amount: '',
    renewalAmount: '',
    expiryDate: calculateDefaultExpiry('ONLINE'),
    key: '12345',
    role: 'ADMIN',
    extendDays: '',
    extendKey: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);

  // API Hooks
  const {data: adminsData, isLoading} = useGetAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();

  // Safely extract items array from response object
  const rawList = Array.isArray(adminsData)
    ? adminsData
    : Array.isArray(adminsData?.data)
      ? adminsData.data
      : [];

  const adminsList: AdminItem[] = useMemo(() => {
    const now = Date.now();
    return rawList.map((item: any, idx: number) => {
      // Handle both nested and flat structures
      const userObj = item.user || {};

      // Get expiry date - from item or user
      const rawExp = item.expiryDate || userObj.expiryDate || '';
      const extDays = Number(item.extendDays ?? userObj.extendDays) || 0;

      // Calculate effective expiry date
      let effectiveExpTime = rawExp ? new Date(rawExp).getTime() : NaN;
      let effectiveExpDate = rawExp;
      let hasExtension = false;

      if (!isNaN(effectiveExpTime) && extDays > 0) {
        hasExtension = true;
        const extendedTime = effectiveExpTime + extDays * 86400000;
        effectiveExpDate = new Date(extendedTime).toISOString();
        effectiveExpTime = extendedTime;
      }

      // Calculate expiry status based on effective expiry date
      const isExpired = !isNaN(effectiveExpTime) && effectiveExpTime < now;

      // Get shop name
      const shopNameVal = item.shopName || userObj.shopName || 'N/A';

      // Get address
      const addressVal = userObj.address || item.address || 'N/A';

      return {
        id: item.id || `admin-${idx}`,
        userId: item.userId || userObj.id || item.id,
        fullname: userObj.fullname || userObj.name || item.fullname || 'N/A',
        shopName: shopNameVal,
        email: userObj.email || item.email || '',
        username:
          userObj.username || userObj.phoneNumber || item.phoneNumber || 'N/A',
        phoneNumber: userObj.phoneNumber || item.phoneNumber || 'N/A',
        secondaryPhoneNumber:
          userObj.secondaryPhoneNumber || item.secondaryPhoneNumber || '',
        pincode: item.pincode || userObj.pincode || '',
        city: item.city || userObj.city || '',
        district: item.district || userObj.district || '',
        state: item.state || userObj.state || '',
        address: addressVal,
        accessType: (
          item.accessType ||
          userObj.accessType ||
          'ONLINE'
        ).toUpperCase(),
        amount: item.amount ?? userObj.amount ?? '',
        renewalAmount: item.renewalAmount ?? userObj.renewalAmount ?? '',
        rawExpiryDate: rawExp,
        expiryDate: rawExp ? formatDisplayDateTime(rawExp) : 'Unlimited',
        effectiveExpiryDate: effectiveExpDate,
        hasExtension: hasExtension,
        isExpired: isExpired,
        key: item.key || userObj.key || '',
        isUsedKey: item.isUsedKey ?? userObj.isUsedKey ?? null,
        role: userObj.role || item.role || 'ADMIN',
        extendKey: item.extendKey || userObj.extendKey || '',
        extendDays:
          item.extendDays !== undefined && item.extendDays !== null
            ? item.extendDays
            : userObj.extendDays,
        isExtendUsedKey:
          item.isExtendUsedKey ?? userObj.isExtendUsedKey ?? null,
        startDate: item.startDate || userObj.startDate || '',
        createdAt: item.createdAt || userObj.createdAt || '',
        rawItem: item,
      };
    });
  }, [rawList]);
  // Extract unique cities for City filter dropdown
  const uniqueCities = useMemo(() => {
    const citySet = new Set<string>();
    adminsList.forEach((a) => {
      if (a.city && a.city !== 'N/A' && a.city.trim() !== '') {
        citySet.add(a.city.trim());
      }
    });
    return Array.from(citySet).sort();
  }, [adminsList]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let online = 0;
    let offline = 0;
    let TRIAL = 0;
    let expired = 0;

    adminsList.forEach((a) => {
      const type = (a.accessType || 'ONLINE').toUpperCase();
      if (type === 'ONLINE') online++;
      if (type === 'OFFLINE') offline++;
      if (type === 'TRIAL' || type === 'TRIAL') TRIAL++;
      if (a.isExpired) expired++;
    });

    return {
      all: adminsList.length,
      online,
      offline,
      TRIAL,
      expired,
    };
  }, [adminsList]);

  // Filter admins by Search, City, and Tab
  const filteredAdmins = useMemo(() => {
    return adminsList.filter((admin) => {
      const query = searchTerm.toLowerCase().trim();

      // Tab filter
      if (selectedTab === 'EXPIRED') {
        if (!admin.isExpired) return false;
      } else if (selectedTab === 'ONLINE') {
        if (admin.accessType !== 'ONLINE') return false;
      } else if (selectedTab === 'OFFLINE') {
        if (admin.accessType !== 'OFFLINE') return false;
      } else if (selectedTab === 'TRIAL') {
        const t = admin.accessType.toUpperCase();
        if (t !== 'TRIAL' && t !== 'TRIAL') return false;
      }

      // City filter
      if (selectedCity !== 'ALL') {
        if (
          !admin.city ||
          admin.city.toLowerCase() !== selectedCity.toLowerCase()
        ) {
          return false;
        }
      }

      // Search query filter
      if (query) {
        const matchesShop =
          admin.shopName && admin.shopName.toLowerCase().includes(query);
        const matchesName =
          admin.fullname && admin.fullname.toLowerCase().includes(query);
        const matchesPhone =
          (admin.phoneNumber && admin.phoneNumber.includes(query)) ||
          (admin.secondaryPhoneNumber &&
            admin.secondaryPhoneNumber.includes(query));
        const matchesEmail =
          admin.email && admin.email.toLowerCase().includes(query);
        const matchesUser =
          admin.username && admin.username.toLowerCase().includes(query);
        const matchesCity =
          admin.city && admin.city.toLowerCase().includes(query);
        const matchesAddress =
          admin.address && admin.address.toLowerCase().includes(query);
        const matchesKey = admin.key && admin.key.toLowerCase().includes(query);
        const matchesExtendKey =
          admin.extendKey && admin.extendKey.toLowerCase().includes(query);

        return (
          matchesShop ||
          matchesName ||
          matchesPhone ||
          matchesEmail ||
          matchesUser ||
          matchesCity ||
          matchesAddress ||
          matchesKey ||
          matchesExtendKey
        );
      }

      return true;
    });
  }, [adminsList, searchTerm, selectedCity, selectedTab]);

  // Handle sorting for Create Date and Expiry Date
  const handleSort = (field: 'createdAt' | 'expiryDate') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedAdmins = useMemo(() => {
    if (!sortField) return filteredAdmins;
    return [...filteredAdmins].sort((a, b) => {
      let timeA = 0;
      let timeB = 0;
      if (sortField === 'createdAt') {
        timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (sortField === 'expiryDate') {
        const rawA = a.effectiveExpiryDate || a.rawExpiryDate || a.expiryDate;
        const rawB = b.effectiveExpiryDate || b.rawExpiryDate || b.expiryDate;
        timeA = rawA ? new Date(rawA).getTime() : 0;
        timeB = rawB ? new Date(rawB).getTime() : 0;
      }
      if (isNaN(timeA)) timeA = 0;
      if (isNaN(timeB)) timeB = 0;

      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [filteredAdmins, sortField, sortOrder]);

  // Lookup pincode to fetch city, district, state from India Postal API
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
          city: city,
          district: district,
          state: state,
        }));

        if (errors.pincode) {
          setErrors((prev) => ({...prev, pincode: ''}));
        }
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

  // Generate random key for offline access
  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newKey = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) newKey += '-';
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newKey;
  };

  // Calculate new expiry preview when extendDays is added before/after expiration
  const getExtendedExpiryPreview = (
    currentExpiry?: string,
    daysToAdd?: string | number,
  ) => {
    const days = Number(daysToAdd);
    if (!days || isNaN(days) || days <= 0) return null;
    let base = new Date();
    let isExtendingFromCurrent = false;
    if (currentExpiry) {
      const parsed = new Date(currentExpiry.replace(' ', 'T'));
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        base = parsed;
        isExtendingFromCurrent = true;
      }
    }
    const newDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    return {
      dateFormatted: newDate.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      isExtendingFromCurrent,
    };
  };

  const handleOpenCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      fullname: '',
      shopName: '',
      email: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      username: '',
      password: '',
      pincode: '',
      city: '',
      district: '',
      state: '',
      address: '',
      accessType: 'ONLINE',
      amount: '',
      renewalAmount: '',
      expiryDate: calculateDefaultExpiry('ONLINE'),
      key: '12345',
      role: 'ADMIN',
      extendDays: '',
      extendKey: '',
    });
    setErrors({});
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (admin: AdminItem) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);

    const raw = admin.rawItem || {};
    const userObj = raw.user || {};

    const emailVal =
      userObj.email || raw.email || raw.contactPersonEmail || admin.email || '';
    const secPhoneVal =
      userObj.secondaryPhoneNumber ||
      userObj.secondazyPhoneNumber ||
      raw.secondaryPhoneNumber ||
      raw.secondazyPhoneNumber ||
      raw.contactPersonNumber ||
      admin.secondaryPhoneNumber ||
      '';
    const addressVal =
      userObj.address ||
      raw.address ||
      (admin.address !== 'N/A' ? admin.address : '');
    const rawExpiry = raw.expiryDate || admin.rawExpiryDate || admin.expiryDate;

    setFormData({
      fullname: admin.fullname !== 'N/A' ? admin.fullname : '',
      shopName: admin.shopName !== 'N/A' ? admin.shopName : '',
      email: emailVal,
      username: admin.username !== 'N/A' ? admin.username : admin.phoneNumber,
      password: '',
      phoneNumber: admin.phoneNumber !== 'N/A' ? admin.phoneNumber : '',
      secondaryPhoneNumber: secPhoneVal,
      pincode: admin.pincode || '',
      city: admin.city && admin.city !== 'N/A' ? admin.city : '',
      district: admin.district || '',
      state: admin.state || '',
      address: addressVal,
      accessType: (admin.accessType || 'ONLINE').toUpperCase(),
      amount:
        admin.amount !== undefined && admin.amount !== null
          ? String(admin.amount)
          : '',
      renewalAmount:
        admin.renewalAmount !== undefined && admin.renewalAmount !== null
          ? String(admin.renewalAmount)
          : '',
      expiryDate: formatForDatetimeLocal(rawExpiry).replace('T', ' ') + ':00',
      key: admin.key || '12345',
      role: admin.role || 'ADMIN',
      extendDays:
        admin.extendDays !== undefined && admin.extendDays !== null
          ? String(admin.extendDays)
          : '',
      extendKey: admin.extendKey || '',
    });
    setErrors({});
    setShowPassword(false);

    try {
      const targetId = admin.id || admin.userId;
      if (targetId) {
        const fullData = await getAdminByIdApi(targetId);
        if (fullData) {
          const u = fullData.user || fullData;
          setFormData((prev) => ({
            ...prev,
            fullname: u.fullname || u.name || prev.fullname,
            shopName:
              fullData.shopName ||
              u.shopName ||
              fullData.storeName ||
              u.storeName ||
              prev.shopName,
            email:
              u.email ||
              fullData.email ||
              fullData.contactPersonEmail ||
              prev.email,
            username: u.username || u.phoneNumber || prev.username,
            phoneNumber: u.phoneNumber || u.phone || prev.phoneNumber,
            secondaryPhoneNumber:
              u.secondaryPhoneNumber ||
              u.secondazyPhoneNumber ||
              fullData.secondaryPhoneNumber ||
              fullData.secondazyPhoneNumber ||
              fullData.contactPersonNumber ||
              prev.secondaryPhoneNumber,
            pincode:
              fullData.pincode ||
              u.pincode ||
              fullData.pinCode ||
              u.pinCode ||
              prev.pincode,
            city: fullData.city || u.city || prev.city,
            district: fullData.district || u.district || prev.district,
            state: fullData.state || u.state || prev.state,
            address: fullData.address || u.address || prev.address,
            accessType: (
              fullData.accessType ||
              u.accessType ||
              prev.accessType
            ).toUpperCase(),
            amount:
              fullData.amount !== undefined
                ? String(fullData.amount)
                : prev.amount,
            renewalAmount:
              fullData.renewalAmount !== undefined
                ? String(fullData.renewalAmount)
                : prev.renewalAmount,
            expiryDate: fullData.expiryDate
              ? formatForDatetimeLocal(fullData.expiryDate).replace('T', ' ') +
                ':00'
              : prev.expiryDate,
            key: fullData.key || prev.key,
            role: u.role || prev.role,
            extendDays:
              fullData.extendDays !== undefined && fullData.extendDays !== null
                ? String(fullData.extendDays)
                : prev.extendDays,
            extendKey: fullData.extendKey || prev.extendKey,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch single admin details by ID:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const {name, value} = e.target;
    setFormData((prev) => {
      const updated = {...prev, [name]: value};
      if (
        name === 'phoneNumber' &&
        (!prev.username || prev.username === prev.phoneNumber)
      ) {
        updated.username = value;
      }

      // Automatically calculate and update Expiry Date on Expiry Date field when extendDays changes
      if (name === 'extendDays') {
        const days = Number(value);
        if (days && !isNaN(days) && days > 0) {
          let base = new Date();
          const existingExp =
            editingAdmin?.rawExpiryDate ||
            editingAdmin?.expiryDate ||
            editingAdmin?.rawItem?.expiryDate ||
            prev.expiryDate;
          if (existingExp) {
            const parsed = new Date(existingExp.replace(' ', 'T'));
            if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
              base = parsed;
            }
          }
          const newDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
          const pad = (n: number) => String(n).padStart(2, '0');
          updated.expiryDate = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())} ${pad(newDate.getHours())}:${pad(newDate.getMinutes())}:00`;
        } else if (!value) {
          if (editingAdmin) {
            const rawExpiry =
              editingAdmin.rawItem?.expiryDate ||
              editingAdmin.rawExpiryDate ||
              editingAdmin.expiryDate;
            updated.expiryDate =
              formatForDatetimeLocal(rawExpiry).replace('T', ' ') + ':00';
          } else {
            updated.expiryDate = calculateDefaultExpiry(prev.accessType);
          }
        }
      }

      return updated;
    });

    if (name === 'pincode') {
      if (value.length === 6) {
        handlePincodeLookup(value);
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({...prev, [name]: ''}));
    }
  };

  // Handle access type change and automatically calculate default expiry date
  const handleAccessTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const defaultExp = calculateDefaultExpiry(value);

    setFormData((prev) => ({
      ...prev,
      accessType: value,
      expiryDate: defaultExp,
      key:
        value === 'OFFLINE'
          ? prev.key && prev.key !== '12345'
            ? prev.key
            : generateKey()
          : '12345',
    }));
    if (errors.accessType) {
      setErrors((prev) => ({...prev, accessType: ''}));
    }
  };

  const handleCopyKey = (keyVal?: string) => {
    const val = keyVal || formData.key;
    if (!val) {
      toast.error('No key to copy');
      return;
    }
    navigator.clipboard.writeText(val);
    toast.success('Offline key copied to clipboard!');
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'First Name / Full Name is required';
    }
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    if (
      formData.secondaryPhoneNumber.trim() &&
      !/^\d{10}$/.test(formData.secondaryPhoneNumber.trim())
    ) {
      newErrors.secondaryPhoneNumber =
        'Secondary phone number must be 10 digits';
    }
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Password validation: only require when creating a new admin if empty
    if (!editingAdmin) {
      if (!formData.password?.trim()) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all form validation errors');
      return;
    }

    // Format expiry date to YYYY-MM-DD HH:mm:ss if provided
    let formattedExpiry = formData.expiryDate;
    if (formattedExpiry && formattedExpiry.includes('T')) {
      formattedExpiry = formattedExpiry.replace('T', ' ');
      if (formattedExpiry.length === 16) {
        formattedExpiry += ':00';
      }
    }

    const basePayload: AdminPayload = {
      fullname: formData.fullname.trim(),
      shopName: formData.shopName.trim(),
      email: formData.email.trim(),
      username: formData.username.trim() || formData.phoneNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      secondaryPhoneNumber: formData.secondaryPhoneNumber.trim() || undefined,
      pincode: formData.pincode.trim() || undefined,
      city: formData.city.trim() || undefined,
      district: formData.district.trim() || undefined,
      state: formData.state.trim() || undefined,
      address: formData.address.trim(),
      accessType: formData.accessType.toUpperCase(),
      amount: formData.amount
        ? Number(formData.amount) || formData.amount
        : undefined,
      renewalAmount: formData.renewalAmount
        ? Number(formData.renewalAmount) || formData.renewalAmount
        : undefined,
      expiryDate: formattedExpiry || undefined,
      key: formData.accessType === 'OFFLINE' ? formData.key : '12345',
      role: formData.role || 'ADMIN',
    };

    // Only include extend fields if accessType is OFFLINE and values are provided
    if (formData.accessType === 'OFFLINE') {
      if (formData.extendKey && formData.extendKey.trim()) {
        basePayload.extendKey = formData.extendKey.trim();
      }
      if (
        formData.extendDays !== '' &&
        formData.extendDays !== null &&
        formData.extendDays !== undefined
      ) {
        basePayload.extendDays = Number(formData.extendDays) || null;
      }
    }

    if (formData.password) {
      basePayload.password = formData.password;
    }

    try {
      if (editingAdmin) {
        await updateAdmin.mutateAsync({id: editingAdmin.id, data: basePayload});
      } else {
        await createAdmin.mutateAsync(basePayload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Submit Admin Error:', err);
    }
  };

  // Table Columns Definition as requested
  const columns: Column<AdminItem>[] = [
    {
      key: 'shopName',
      header: 'Shop Name',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {item.shopName && item.shopName !== 'N/A'
              ? item.shopName
              : item.fullname}
          </span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
            {item.city && item.city !== 'N/A' ? item.city : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone No.',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {item.phoneNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'accessType',
      header: 'Type',
      render: (item) => {
        const typeUpper = (item.accessType || 'ONLINE').toUpperCase();
        if (typeUpper === 'TRIAL' || typeUpper === 'TRIAL') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
              <Sparkles className="h-3 w-3" />
              TRIAL
            </span>
          );
        }
        if (typeUpper === 'OFFLINE') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              <Key className="h-3 w-3" />
              OFFLINE
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            ONLINE
          </span>
        );
      },
    },
    {
      key: 'key',
      header: 'Key',
      render: (item) => {
        const keyVal = item.key;
        if (!keyVal || keyVal === '12345') {
          return (
            <span className="text-gray-400 text-xs dark:text-slate-500">-</span>
          );
        }
        return (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1">
              <span className="font-mono rounded border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-[#1a1c1b] dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-slate-200">
                {keyVal}
              </span>
              <button
                type="button"
                onClick={() => handleCopyKey(keyVal)}
                className="text-gray-400 p-0.5 transition-colors hover:text-[#785600] dark:text-slate-400 dark:hover:text-amber-400"
                title="Copy Key"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            {item.isUsedKey !== undefined && item.isUsedKey !== null && (
              <span
                className={`py-0.2 inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold ${
                  item.isUsedKey
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                {item.isUsedKey ? 'Used' : 'Unused'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'extendKey',
      header: 'Extend Key',
      render: (item) => {
        const extKey = item.extendKey;
        const extDays = item.extendDays;
        if (!extKey) {
          return (
            <span className="text-gray-400 text-xs dark:text-slate-500">-</span>
          );
        }
        return (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1">
              <span className="font-mono rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-xs font-semibold text-purple-900 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300">
                {extKey}
              </span>
              <button
                type="button"
                onClick={() => handleCopyKey(extKey)}
                className="text-gray-400 p-0.5 transition-colors hover:text-[#785600] dark:text-slate-400 dark:hover:text-amber-400"
                title="Copy Extend Key"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {extDays !== undefined && extDays !== null && extDays !== '' && (
                <span className="py-0.2 inline-flex items-center rounded-full bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  +{extDays} days
                </span>
              )}
              {item.isExtendUsedKey !== undefined &&
                item.isExtendUsedKey !== null && (
                  <span
                    className={`py-0.2 inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold ${
                      item.isExtendUsedKey
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    {item.isExtendUsedKey ? 'Used' : 'Unused'}
                  </span>
                )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: (
        <button
          type="button"
          onClick={() => handleSort('createdAt')}
          className="group inline-flex items-center justify-center gap-1.5 font-semibold text-white transition-colors hover:text-amber-200"
          title={`Sort by Create Date (${
            sortField === 'createdAt'
              ? sortOrder === 'asc'
                ? 'Oldest to Newest'
                : 'Newest to Oldest'
              : 'Click to sort'
          })`}
        >
          <span>Create Date Time</span>
          {sortField === 'createdAt' ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-amber-300" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-amber-300" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50 group-hover:text-white" />
          )}
        </button>
      ),
      render: (item) => {
        const {date, time} = formatDate(item?.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'expiryDate',
      header: (
        <button
          type="button"
          onClick={() => handleSort('expiryDate')}
          className="group inline-flex items-center justify-center gap-1.5 font-semibold text-white transition-colors hover:text-amber-200"
          title={`Sort by Expiry Date (${
            sortField === 'expiryDate'
              ? sortOrder === 'asc'
                ? 'Oldest to Newest'
                : 'Newest to Oldest'
              : 'Click to sort'
          })`}
        >
          <span>Expiry Date Time</span>
          {sortField === 'expiryDate' ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-amber-300" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-amber-300" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50 group-hover:text-white" />
          )}
        </button>
      ),
      render: (item) => {
        const rawDate = item.rawExpiryDate || item.expiryDate;
        if (!rawDate) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-sm text-[#1a1c1b] dark:text-white">
                Unlimited
              </span>
            </div>
          );
        }

        const extDays = Number(item.extendDays) || 0;
        const originalTime = new Date(rawDate).getTime();
        const isOriginalExpired =
          !isNaN(originalTime) && originalTime < Date.now();

        if (extDays > 0 && item.effectiveExpiryDate) {
          const {date: extDate, time: extTime} = formatDate(
            item.effectiveExpiryDate,
          );
          const {date: origDate} = formatDate(rawDate);

          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-black">{extDate}</span>
              {extTime && extTime !== '-' && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {extTime}
                </span>
              )}
            </div>
          );
        }

        const {date, time} = formatDate(rawDate);
        return (
          <div className="flex flex-col items-center">
            <span
              className={`text-sm ${
                item.isExpired
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : 'text-[#1a1c1b] dark:text-white'
              }`}
            >
              {date}
            </span>
            {time && time !== '-' && (
              <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                {time}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'renewalAmount',
      header: 'Renewal Charges',
      render: (item) => (
        <span className="text-sm font-semibold text-black dark:text-amber-400">
          {item.renewalAmount !== undefined &&
          item.renewalAmount !== null &&
          item.renewalAmount !== ''
            ? `₹${Number(item.renewalAmount).toLocaleString('en-IN')}`
            : '-'}
        </span>
      ),
    },
  ];

  // Action column with EDIT ONLY (Delete action removed as requested)
  const renderActions = (item: AdminItem) => (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => handleOpenEditModal(item)}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400 dark:hover:bg-slate-800"
        title="Edit Admin"
      >
        <Edit className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="mx-auto space-y-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <PageHeader title="Admin Management" />
          <GenericButton
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </GenericButton>
        </div>

        {/* Unified Single Line Filter Toolbar: Search -> City -> Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d3c4af]/30 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* 1. First: Search Bar */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search shop, name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] py-1.5 pl-8 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* 3. Third: Status / Type Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <label className="text-gray-500 whitespace-nowrap text-xs font-medium dark:text-slate-400">
              City:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] px-2.5 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Cities ({adminsList.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {(searchTerm ||
              selectedCity !== 'ALL' ||
              selectedTab !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCity('ALL');
                  setSelectedTab('ALL');
                }}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 dark:text-gray-300 flex items-center gap-1 whitespace-nowrap rounded-lg border bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                title="Reset filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedTab('ALL')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedTab === 'ALL'
                  ? 'bg-[#785600] text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/70 dark:text-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              All
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  selectedTab === 'ALL'
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-200 text-gray-700 dark:text-gray-200 dark:bg-slate-700'
                }`}
              >
                {tabCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('ONLINE')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedTab === 'ONLINE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Online
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  selectedTab === 'ONLINE'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                {tabCounts.online}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('OFFLINE')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedTab === 'OFFLINE'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              Offline
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  selectedTab === 'OFFLINE'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                {tabCounts.offline}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('TRIAL')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedTab === 'TRIAL'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              TRIAL
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  selectedTab === 'TRIAL'
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                }`}
              >
                {tabCounts.TRIAL}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('EXPIRED')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedTab === 'EXPIRED'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-gray-100/70 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Expired
              <span
                className={`py-0.2 rounded-full px-1.5 text-[10px] ${
                  selectedTab === 'EXPIRED'
                    ? 'bg-white/25 text-white'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                }`}
              >
                {tabCounts.expired}
              </span>
            </button>
          </div>
        </div>

        {/* Admins Table */}
        <GenericTable<AdminItem>
          data={sortedAdmins}
          columns={columns}
          emptyMessage="No admin accounts match your filter criteria."
          isLoading={isLoading}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onSave={() => {}}
        />
      </div>

      {/* Modal for Create / Edit Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#d3c4af]/20 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="border-gray-100 mb-5 flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                  {editingAdmin ? 'Edit Admin Account' : 'Create New Admin'}
                </h2>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  {editingAdmin
                    ? 'Update admin details, shop information, and access parameters'
                    : 'Fill in all fields to register a new shop admin'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: First Name / Full Name & Shop Name */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    First Name / Full Name{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.fullname
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fullname}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="e.g. Royal Jewellers"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.shopName
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.shopName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.shopName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.email ? 'border-red-500 focus:ring-red-500/20' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Phone No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.phoneNumber
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Pincode, City, District, State */}
              <div className="space-y-3 rounded-lg border border-[#d3c4af]/30 bg-[#fbf9f6] p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#785600] dark:text-amber-400">
                  <MapPin className="h-4 w-4" />
                  Address & Location Details
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Pincode
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-8 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                          errors.pincode ? 'border-red-500' : ''
                        }`}
                      />
                      {isPincodeLoading && (
                        <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
                      )}
                    </div>
                    {errors.pincode && (
                      <p className="mt-1 text-[11px] text-red-500">
                        {errors.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Auto-filled via pincode"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="District"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Address Line / Street{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Shop No. 12, MG Road Market"
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.address
                        ? 'border-red-500 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Type, Price, Renewal Charges, Expiry Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="accessType"
                    value={formData.accessType}
                    onChange={handleAccessTypeChange}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ONLINE">ONLINE (1 Year)</option>
                    <option value="OFFLINE">OFFLINE (1 Year)</option>
                    <option value="TRIAL">TRIAL (7 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    min={0}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Renewal Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="renewalAmount"
                    value={formData.renewalAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 2000"
                    min={0}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={formData.expiryDate.slice(0, 16).replace(' ', 'T')}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryDate: e.target.value.replace('T', ' ') + ':00',
                      }))
                    }
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Offline / Key & Extension Settings - Only shown when Access Type is OFFLINE */}
              {formData.accessType === 'OFFLINE' && (
                <div className="space-y-3 rounded-lg border border-[#d3c4af]/30 bg-[#fbfbf9] p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between border-b border-[#d3c4af]/20 pb-2 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                        Offline Key & Extension Settings
                      </span>
                    </div>
                    <span className="text-gray-400 text-[10px]">
                      Offline Only
                    </span>
                  </div>

                  {/* Primary / Activation Key Field */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                      Primary Key (Activation Key)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        name="key"
                        value={formData.key}
                        onChange={handleInputChange}
                        placeholder="Primary Key (e.g. BZUH-SLWJ-Z72F-4EA2)"
                        className="font-mono flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyKey(formData.key)}
                        disabled={!formData.key}
                        className="flex items-center gap-1 rounded-lg border border-[#d3c4af]/40 bg-white px-2.5 py-2 text-xs font-medium text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                        title="Copy Primary Key"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newKey = generateKey();
                          setFormData((prev) => ({
                            ...prev,
                            key: newKey,
                          }));
                          toast.success('Primary Key generated!');
                        }}
                        className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2.5 py-2 text-xs font-medium text-white transition-colors hover:from-[#6b4c00] hover:to-[#875f00]"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Extend Days Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                        Extension Days
                      </label>
                      <input
                        type="number"
                        name="extendDays"
                        value={formData.extendDays}
                        onChange={handleInputChange}
                        placeholder="Enter days (e.g. 30)"
                        min={0}
                        className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Extend Key Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                        Extend Key (Extension Key)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          name="extendKey"
                          value={formData.extendKey}
                          onChange={handleInputChange}
                          placeholder="Extend Key (e.g. VJJ7-286K-Y3HO-92Y7)"
                          className="font-mono flex-1 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyKey(formData.extendKey)}
                          disabled={!formData.extendKey}
                          className="flex items-center gap-1 rounded-lg border border-[#d3c4af]/40 bg-white px-2.5 py-2 text-xs font-medium text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                          title="Copy Extend Key"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newKey = generateKey();
                            setFormData((prev) => ({
                              ...prev,
                              extendKey: newKey,
                            }));
                            toast.success('Extend Key generated!');
                          }}
                          className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2.5 py-2 text-xs font-medium text-white transition-colors hover:from-[#6b4c00] hover:to-[#875f00]"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expiry Advance Preview Notice */}
                  {(() => {
                    const preview = getExtendedExpiryPreview(
                      formData.expiryDate,
                      formData.extendDays,
                    );
                    if (!preview) return null;
                    return (
                      <div className="flex items-center gap-2 rounded-lg bg-[#785600]/10 p-2.5 text-xs text-[#785600] dark:bg-amber-950/40 dark:text-amber-300">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>
                          {preview.isExtendingFromCurrent
                            ? `Extension starts after current expiry date (${formData.expiryDate.slice(0, 10)}). New expiry: `
                            : 'Extension starts from today. New expiry: '}
                          <strong>{preview.dateFormatted}</strong> (+
                          {formData.extendDays} days)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Row 6: Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                  Password{' '}
                  {editingAdmin ? (
                    <span className="text-gray-400 font-normal">
                      (Leave blank to keep unchanged)
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingAdmin ? '••••••••' : 'Pass@123'}
                    className={`w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3.5 py-2 pr-10 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#785600]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="border-gray-100 flex justify-end gap-3 border-t pt-4 dark:border-slate-800">
                <GenericButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="!px-5"
                >
                  Cancel
                </GenericButton>
                <GenericButton
                  type="submit"
                  disabled={createAdmin.isPending || updateAdmin.isPending}
                  variant="primary"
                  className="!px-5"
                >
                  {createAdmin.isPending || updateAdmin.isPending
                    ? 'Saving...'
                    : editingAdmin
                      ? 'Update Admin'
                      : 'Create Admin'}
                </GenericButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreate;
