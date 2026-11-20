import React, {useState, useEffect} from 'react';
import {
  Plus,
  X,
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  Search,
  Eye,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {z} from 'zod';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import {
  useGetClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  Client,
} from '@/lib/api/client';

// Client Schema for validation
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

type ClientFormData = z.infer<typeof ClientSchema>;

const ClientMaster: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  // React Query hooks
  const {data: clients = [], isLoading, refetch} = useGetClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  // Filter clients based on search term
  const clientList: Client[] = Array.isArray(clients)
    ? clients
    : (clients as any)?.data && Array.isArray((clients as any).data)
      ? (clients as any).data
      : [];

  const filteredClients = searchTerm
    ? clientList.filter(
        (client: Client) =>
          client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phoneNumber?.includes(searchTerm) ||
          client.address?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : clientList;

  // Handle form input change
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
  // Validate form data
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

  // Handle add new client
  const handleAddClient = async () => {
    if (!validateForm()) return;

    try {
      await createClient.mutateAsync({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        openingBalance: parseFloat(formData.openingBalance) || 0,
      });
      resetForm();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle edit client
  const handleEditClient = async () => {
    if (!editingClient) return;
    if (!validateForm()) return;

    try {
      await updateClient.mutateAsync({
        id: editingClient.id,
        data: {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim(),
          openingBalance: parseFloat(formData.openingBalance) || 0,
        },
      });
      resetForm();
      setIsModalOpen(false);
      setEditingClient(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient.mutateAsync(clientToDelete.id);

      // Clear any edit state if the deleted client was being edited
      if (editingClient?.id === clientToDelete.id) {
        setEditingClient(null);
        resetForm();
        setIsModalOpen(false);
      }

      setDeleteModalOpen(false);
      setClientToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };
  // Handle edit button click
  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      openingBalance: client.openingBalance?.toString() || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle row click - Navigate to client detail page
  const handleRowClick = (client: Client) => {
    const targetId = client?.id || (client as any)?._id;
    if (targetId) {
      navigate({to: '/client/clientreport/$id', params: {id: targetId}});
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      address: '',
      openingBalance: '',
    });
    setFormErrors({});
    setEditingClient(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Format number
  const formatNumber = (
    value: number | string | null | undefined,
    maxDecimals: number = 3,
  ): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const fixed = num.toFixed(maxDecimals);
    return parseFloat(fixed).toString();
  };

  // Table columns
  const columns: Column<Client>[] = [
    {
      key: 'fullName',
      header: 'Name',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.fullName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.address}
        </span>
      ),
    },
    {
      key: 'openingBalance',
      header: 'Due Balance (G)',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.openingBalance)} G
        </span>
      ),
    },
  ];

  // Custom actions renderer
  const renderActions = (item: Client, index: number) => (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => handleEditClick(item)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Edit"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteClient(item)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const isSubmitting =
    createClient.isPending || updateClient.isPending || deleteClient.isPending;

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          {/* Left side - Back button and Title */}
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/setlment/settlement'})}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Client Master
            </h2>
          </div>

          {/* Right side - Search and Add Button */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by name, phone or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Button */}
            <GenericButton
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="primary"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="xs:inline hidden">Add Client</span>
              <span className="xs:hidden">Add</span>
            </GenericButton>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredClients}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
            emptyMessage="No clients found. Click 'Add Client' to create one."
            isLoading={isLoading || isSubmitting}
            // renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-[95%] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-lg">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d3c4af]/10 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                onClick={closeModal}
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
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                  className={
                    formErrors.fullName
                      ? '!border-red-500 focus:!ring-red-500'
                      : ''
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
                  placeholder="Enter address"
                  rows={3}
                  className={`w-full min-w-0 resize-none rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all duration-200 placeholder:text-[#817563] hover:border-[#785600]/50 focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
                    formErrors.address
                      ? '!border-red-500 focus:!ring-red-500'
                      : ''
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
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <GenericButton
                type="button"
                onClick={editingClient ? handleEditClient : handleAddClient}
                disabled={isSubmitting}
                variant="primary"
                className="!px-4 !py-2"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingClient
                    ? 'Update Client'
                    : 'Add Client'}
              </GenericButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Client"
        itemIdentifier={clientToDelete?.fullName}
        isLoading={deleteClient.isPending}
      />
    </div>
  );
};

export default ClientMaster;
