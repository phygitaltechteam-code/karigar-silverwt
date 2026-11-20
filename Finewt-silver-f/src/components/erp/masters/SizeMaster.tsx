import React, {useState} from 'react';
import {Plus, X, ArrowLeft, Search, Edit, Trash2} from 'lucide-react';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {useNavigate} from '@tanstack/react-router';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {z} from 'zod';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import {
  Size,
  SizeSchema,
  useCreateSize,
  useDeleteSize,
  useGetSizes,
  useUpdateSize,
} from '@/lib/api/sizes';

const SizeMaster: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);
  const [formData, setFormData] = useState({
    size: '',
  });
  const [formErrors, setFormErrors] = useState<{size?: string}>({});
  const [searchTerm, setSearchTerm] = useState('');

const DEFAULT_DEMO_SIZES: Size[] = [];

  // React Query hooks
  const {data: sizes = [], isLoading, refetch} = useGetSizes();
  const createSize = useCreateSize();
  const updateSize = useUpdateSize();
  const deleteSize = useDeleteSize();

  const activeSizes = sizes.length > 0 ? sizes : DEFAULT_DEMO_SIZES;

  // Filter data based on search term
  const filteredData = searchTerm
    ? activeSizes.filter((item) =>
        item.size.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : activeSizes;

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;

    setFormData((prev) => ({...prev, [name]: value}));
    if (formErrors.size) {
      setFormErrors({});
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      SizeSchema.parse({size: formData.size.trim()});
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: {size?: string} = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'size') {
            errors.size = err.message;
          }
        });
        setFormErrors(errors);
        toast.error(errors.size || 'Please fix the errors');
      }
      return false;
    }
  };

  // Handle add new size
  const handleAddSize = async () => {
    if (!validateForm()) return;
    try {
      await createSize.mutateAsync({size: formData.size.trim()});
      resetForm();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle edit size
  const handleEditSize = async () => {
    if (!editingSize) return;
    if (!validateForm()) return;

    try {
      await updateSize.mutateAsync({
        id: editingSize.id,
        data: {size: formData.size.trim()},
      });
      resetForm();
      setIsModalOpen(false);
      setEditingSize(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle delete size click
  const handleDeleteClick = (item: Size) => {
    setSizeToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm delete size
  const handleConfirmDelete = async () => {
    if (!sizeToDelete) return;

    try {
      await deleteSize.mutateAsync(sizeToDelete.id);

      // If the deleted size was being edited, clear the edit state and form
      if (editingSize?.id === sizeToDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }

      setDeleteModalOpen(false);
      setSizeToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting size:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = (item: Size) => {
    setEditingSize(item);
    setFormData({size: item.size});
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({size: ''});
    setFormErrors({});
    setEditingSize(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const renderActions = (item: Size) => (
    <div className="flex items-center justify-center gap-1">
      {/* Edit Button - Same style as delete but with edit icon */}
      <button
        onClick={() => handleEditClick(item)}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Edit Size"
      >
        <Edit className="h-4 w-4" />
      </button>

      {/* Delete Button - Same style as edit */}
      <button
        onClick={() => handleDeleteClick(item)}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Delete Size"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Table columns
  const columns: Column<Size>[] = [
    {
      key: 'size',
      header: 'Size',
      className: 'font-medium',
      render: (item) => (
        <span className="text-xs font-medium text-[#1a1c1b] dark:text-white sm:text-sm">
          {item.size}
        </span>
      ),
    },
  ];

  // Delete must not disable the Add/Edit form.
  const isFormSubmitting = createSize.isPending || updateSize.isPending;

  const isDeleting = deleteSize.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header - Back Button, Title, Search, and Add Button on Same Line */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          {/* Left side - Back button and Title */}
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/Stocks/stockpage'})}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Size Master
            </h2>
          </div>

          {/* Right side - Search and Add Size Button */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Size Button */}
            <GenericButton type="button" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="xs:hidden">Add Size</span>
            </GenericButton>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Sizes Table - Full width */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            showSrNo={true}
            columns={columns}
            onSave={(item) => {
              console.log('Save size:', item);
            }}
            renderActions={renderActions}
            emptyMessage="No sizes found. Click 'Add Size' to create one."
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Add/Edit Modal - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-[95%] rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-3 dark:border-slate-700 sm:p-4">
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                {editingSize ? 'Edit Size' : 'Add New Size'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase text-[#4f4535] dark:text-slate-400 sm:text-[10px]">
                  Size <span className="text-red-500">*</span>
                </label>
                <GenericInputField
                  type="text"
                  name="size"
                  autoFocus={true}
                  value={formData.size}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (editingSize) handleEditSize();
                      else handleAddSize();
                    }
                  }}
                  placeholder="Enter size (e.g., 1Box, 2Box)"
                  className={formErrors.size ? 'ring-2 ring-red-500' : ''}
                  compact
                />
                {formErrors.size && (
                  <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                    {formErrors.size}
                  </p>
                )}
                <p className="mt-1 text-[8px] text-[#4f4535]/60 dark:text-slate-500 sm:text-[10px]">
                  Enter size (e.g., 1Box, 2Box)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#d3c4af]/10 p-3 dark:border-slate-700 sm:flex-row sm:gap-3 sm:p-4">
              <GenericButton
                type="button"
                onClick={editingSize ? handleEditSize : handleAddSize}
                disabled={isFormSubmitting}
                variant="primary"
              >
                {isFormSubmitting
                  ? 'Saving...'
                  : editingSize
                    ? 'Update Size'
                    : 'Add Size'}
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
          setSizeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Size"
        itemIdentifier={sizeToDelete?.size}
        isLoading={deleteSize.isPending}
      />
    </div>
  );
};

export default SizeMaster;
