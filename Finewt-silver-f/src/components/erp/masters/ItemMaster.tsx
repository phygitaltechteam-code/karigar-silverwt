import React, {useState} from 'react';
import {Plus, X, ArrowLeft, Search, Edit, Trash2} from 'lucide-react';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {useNavigate} from '@tanstack/react-router';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {
  useGetItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  Item,
  ItemSchema,
} from '@/lib/api/items';
import {z} from 'zod';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const ItemMaster: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [formErrors, setFormErrors] = useState<{name?: string}>({});
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks
  const {data: items = [], isLoading, refetch} = useGetItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  // Sort items to show "GOLD" first
  const sortedItems = [...items].sort((a, b) => {
    if (a.name?.toUpperCase() === 'GOLD') return -1;
    if (b.name?.toUpperCase() === 'GOLD') return 1;
    return 0;
  });

  // Filter data based on search term
  const filteredData = searchTerm
    ? sortedItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : sortedItems;

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
    if (formErrors.name) {
      setFormErrors({});
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      ItemSchema.parse({name: formData.name.trim()});
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: {name?: string} = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') {
            errors.name = err.message;
          }
        });
        setFormErrors(errors);
        toast.error(errors.name || 'Please fix the errors');
      }
      return false;
    }
  };

  // Handle add new item
  const handleAddItem = async () => {
    if (!validateForm()) return;
    try {
      await createItem.mutateAsync({name: formData.name.trim()});
      resetForm();
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle edit item
  const handleEditItem = async () => {
    if (!editingItem) return;
    if (!validateForm()) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        data: {name: formData.name.trim()},
      });
      resetForm();
      setIsModalOpen(false);
      setEditingItem(null);
      refetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Handle delete item click - open modal
  const handleDeleteClick = (item: Item) => {
    // Prevent deletion of GOLD
    if (item.name?.toUpperCase() === 'GOLD') {
      toast.error('Cannot delete GOLD item');
      return;
    }
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Confirm delete item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem.mutateAsync(itemToDelete.id);

      // If the deleted item was being edited, clear the edit state and form
      if (editingItem?.id === itemToDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }

      setDeleteModalOpen(false);
      setItemToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = (item: Item) => {
    // Prevent editing of GOLD
    if (item.name?.toUpperCase() === 'GOLD') {
      toast.error('Cannot edit GOLD item');
      return;
    }
    setEditingItem(item);
    setFormData({name: item.name});
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({name: ''});
    setFormErrors({});
    setEditingItem(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Table columns - removed align property
  const columns: Column<Item>[] = [
    {
      key: 'name',
      header: 'Item Name',
      className: 'font-medium',
      render: (item) => {
        const isGold = item.name?.toUpperCase() === 'GOLD';
        return (
          <span
            className={`text-xs font-medium sm:text-sm ${isGold ? 'text-[#785600] dark:text-amber-400' : 'text-[#1a1c1b] dark:text-white'}`}
          >
            {item.name}
          </span>
        );
      },
    },
  ];

  const isFormSubmitting = createItem.isPending || updateItem.isPending;

  const isDeleting = deleteItem.isPending;

  // Custom actions renderer - hide Edit and Delete for GOLD
  const renderActions = (item: Item, index: number) => {
    const isGold = item.name?.toUpperCase() === 'GOLD';

    if (isGold) {
      return (
        <span className="text-xs italic text-[#4f4535] dark:text-slate-400">
          Default
        </span>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handleEditClick(item)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(item)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

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
              Item Master
            </h2>
          </div>

          {/* Right side - Search and Add Item Button */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Item Button */}
            <GenericButton
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="primary"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="xs:inline hidden">Add Item</span>
              <span className="xs:hidden">Add</span>
            </GenericButton>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Items Table - Full width */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            showSrNo={true}
            data={filteredData}
            columns={columns}
            onSave={(item) => {
              console.log('Save item:', item);
            }}
            emptyMessage="No items found. Click 'Add Item' to create one."
            isLoading={isLoading}
            renderActions={renderActions}
            srNoLabel="Sr No."
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
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
                  Item Name <span className="text-red-500">*</span>
                </label>
                <GenericInputField
                  type="text"
                  name="name"
                  autoFocus={true}
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (editingItem) handleEditItem();
                      else handleAddItem();
                    }
                  }}
                  placeholder="e.g., Chain, Bracelet, Necklace"
                  className={formErrors.name ? 'ring-2 ring-red-500' : ''}
                  compact
                />
                {formErrors.name && (
                  <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                    {formErrors.name}
                  </p>
                )}
                <p className="mt-1 text-[8px] text-[#4f4535]/60 dark:text-slate-500 sm:text-[10px]">
                  Minimum 3 characters required
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#d3c4af]/10 p-3 dark:border-slate-700 sm:flex-row sm:gap-3 sm:p-4">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <GenericButton
                type="button"
                onClick={editingItem ? handleEditItem : handleAddItem}
                disabled={isFormSubmitting}
                variant="primary"
                className="!px-4 !py-2"
              >
                {isFormSubmitting
                  ? 'Saving...'
                  : editingItem
                    ? 'Update Item'
                    : 'Add Item'}
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
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        itemIdentifier={itemToDelete?.name}
        isLoading={deleteItem.isPending}
      />
    </div>
  );
};

export default ItemMaster;
