import React, {useState, useEffect} from 'react';
import {
  Plus,
  Trash2,
  Save,
  Flame,
  TrendingUp,
  Box,
  Hammer,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from './Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {
  useGetProcessAlert,
  useSubmitProcessAlert,
  useDeleteProcessAlert,
} from '@/lib/api/alertmanagement';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

export interface AlertRuleRow {
  id: string;
  grossWt: number | string;
  purity: number | string;
  loss: number | string;
  adjustment: number | string;
}

/** Manufacturing stages (same order as the Process page) */
export type ProcessTabId =
  | 'galai'
  | 'company'
  | 'press'
  | 'sutt'
  | 'bharni'
  | 'cutting'
  | 'wash'
  | 'soldering'
  | 'meena'
  | 'tass'
  | 'polishing'
  | 'vibrator';

interface ProcessTabConfig {
  id: ProcessTabId;
  label: string;
  icon: React.ReactNode;
}

const stageIcon = <Hammer className="h-4 w-4" />;
const PROCESS_TABS: ProcessTabConfig[] = [
  {id: 'galai', label: 'Galai', icon: <Flame className="h-4 w-4" />},
  {id: 'company', label: 'Company', icon: stageIcon},
  {id: 'press', label: 'Press', icon: stageIcon},
  {id: 'sutt', label: 'Sutt', icon: stageIcon},
  {id: 'bharni', label: 'Bharni', icon: <Box className="h-4 w-4" />},
  {id: 'cutting', label: 'Cutting', icon: <Scissors className="h-4 w-4" />},
  {id: 'wash', label: 'Wash', icon: stageIcon},
  {id: 'soldering', label: 'Soldering', icon: stageIcon},
  {id: 'meena', label: 'Meena', icon: stageIcon},
  {id: 'tass', label: 'Tass', icon: stageIcon},
  {id: 'polishing', label: 'Polishing', icon: <TrendingUp className="h-4 w-4" />},
  {id: 'vibrator', label: 'Vibrator', icon: <CheckCircle className="h-4 w-4" />},
];

const createDefaultRow = (grossWt: string = '100G'): AlertRuleRow => ({
  id: `rule-temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  grossWt: grossWt,
  purity: '',
  loss: '',
  adjustment: '',
});

export const AlertManagement: React.FC = () => {
  const [activeProcess, setActiveProcess] = useState<ProcessTabId>('galai');
  const [alertData, setAlertData] = useState<Partial<Record<ProcessTabId, AlertRuleRow[]>>>({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<AlertRuleRow | null>(null);

  const {data: serverAlerts, isLoading: isAlertsLoading} =
    useGetProcessAlert(activeProcess);

  useEffect(() => {
    let list: any[] = [];
    if (Array.isArray(serverAlerts) && serverAlerts.length > 0) {
      list = serverAlerts;
    } else if (serverAlerts && typeof serverAlerts === 'object') {
      if (
        Array.isArray((serverAlerts as any).data) &&
        (serverAlerts as any).data.length > 0
      ) {
        list = (serverAlerts as any).data;
      } else if ((serverAlerts as any).grossWt !== undefined) {
        list = [serverAlerts];
      }
    }

    const mappedRows: AlertRuleRow[] = list.map((item, idx) => {
      const lossVal =
        item.loss !== undefined && item.loss !== null
          ? item.loss
          : item.lossWt !== undefined && item.lossWt !== null
            ? item.lossWt
            : '';

      const adjVal =
        item.adjustment !== undefined && item.adjustment !== null
          ? item.adjustment
          : item.adjsutment !== undefined && item.adjsutment !== null
            ? item.adjsutment
            : '';

      return {
        id: item._id || item.id || `rule-${activeProcess}-${idx}-${Date.now()}`,
        grossWt:
          item.grossWt !== undefined && item.grossWt !== null
            ? typeof item.grossWt === 'number'
              ? `${item.grossWt}G`
              : String(item.grossWt).includes('G')
                ? item.grossWt
                : `${item.grossWt}G`
            : '100G',
        purity:
          item.purity !== undefined && item.purity !== null ? item.purity : '',
        loss: lossVal,
        adjustment: adjVal,
      };
    });

    const finalRows = mappedRows.length > 0 ? mappedRows : [createDefaultRow('100G')];

    setAlertData((prev) => ({
      ...prev,
      [activeProcess]: finalRows,
    }));
  }, [serverAlerts, activeProcess]);

  const currentRows = alertData[activeProcess] || [];

  const submitalert = useSubmitProcessAlert();
  const deleteAlertMutation = useDeleteProcessAlert();

  const handleFieldChange = (
    rowId: string,
    field: keyof Omit<AlertRuleRow, 'id'>,
    value: string,
  ) => {
    setAlertData((prev) => {
      const updatedList = (prev[activeProcess] || []).map((row) => {
        if (row.id === rowId) {
          return {...row, [field]: value};
        }
        return row;
      });
      return {
        ...prev,
        [activeProcess]: updatedList,
      };
    });
  };

  const handleAddRow = (index?: number) => {
    const newRow = createDefaultRow('100G');
    setAlertData((prev) => {
      const list = [...(prev[activeProcess] || [])];
      if (typeof index === 'number') {
        list.splice(index + 1, 0, newRow);
      } else {
        list.push(newRow);
      }
      return {
        ...prev,
        [activeProcess]: list,
      };
    });
  };

  const handleDeleteClick = (row: AlertRuleRow) => {
    setRowToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    const rowId = rowToDelete.id;

    // 1. Calculate remaining rows
    const remaining = (alertData[activeProcess] || []).filter(
      (r) => r.id !== rowId,
    );

    // 2. Update local state
    setAlertData((prev) => ({
      ...prev,
      [activeProcess]: remaining,
    }));

    // 3. If row had a real server ID, attempt single delete API
    if (rowId && !rowId.startsWith('rule-') && !rowId.includes('.')) {
      try {
        await deleteAlertMutation.mutateAsync({
          process: activeProcess,
          id: rowId,
        });
      } catch (e) {
        console.error('Single delete API error:', e);
      }
    }

    // 4. Sync the updated remaining rows array to the backend
    try {
      const payload = remaining
        .filter(
          (r) =>
            (r.purity !== '' && r.purity !== undefined) ||
            (r.loss !== '' && r.loss !== undefined) ||
            (r.adjustment !== '' && r.adjustment !== undefined),
        )
        .map((row) => ({
          grossWt:
            typeof row.grossWt === 'number'
              ? row.grossWt
              : parseFloat(String(row.grossWt).replace(/[^0-9.]/g, '')) || 100,
          purity: parseFloat(String(row.purity)) || 0,
          loss: parseFloat(String(row.loss)) || 0,
          lossWt: parseFloat(String(row.loss)) || 0,
          adjustment:
            parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0,
          adjsutment:
            parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0,
        }));

      await submitalert.mutateAsync({
        process: activeProcess,
        data: payload,
      });
    } catch (e) {
      console.error('Sync alert settings after delete error:', e);
    }

    setDeleteModalOpen(false);
    setRowToDelete(null);
  };

  const handleSave = async () => {
    try {
      const payload = currentRows.map((row) => {
        const grossWtNumber =
          typeof row.grossWt === 'number'
            ? row.grossWt
            : parseFloat(String(row.grossWt).replace(/[^0-9.]/g, '')) || 100;

        const adjustmentNumber =
          typeof row.adjustment === 'number'
            ? row.adjustment
            : parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0;

        const lossNumber = parseFloat(String(row.loss)) || 0;

        return {
          grossWt: grossWtNumber,
          purity: parseFloat(String(row.purity)) || 0,
          loss: lossNumber,
          lossWt: lossNumber,
          adjustment: adjustmentNumber,
          adjsutment: adjustmentNumber,
        };
      });

      await submitalert.mutateAsync({
        process: activeProcess,
        data: payload,
      });
    } catch (error) {
      console.error('Failed to submit alert settings:', error);
      toast.error('Failed to save alert settings');
    }
  };

  const columns: Column<AlertRuleRow>[] = [
    {
      key: 'grossWt',
      header: 'Gross Wt',
      render: (item: AlertRuleRow) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {item.grossWt}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.purity}
            onChange={(e) =>
              handleFieldChange(item.id, 'purity', e.target.value)
            }
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            %
          </span>
        </div>
      ),
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.loss}
            onChange={(e) => handleFieldChange(item.id, 'loss', e.target.value)}
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'adjustment',
      header: 'Adjustment',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.adjustment}
            onChange={(e) =>
              handleFieldChange(item.id, 'adjustment', e.target.value)
            }
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            %
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (item: AlertRuleRow, index: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddRow(index)}
            className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Add New Row"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(item)}
            className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Delete Row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Page Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <PageHeader
            title="Alert Management"
            subtitle="Configure alert rules for each manufacturing process"
          />
        </div>

        {/* Sub-Tab Navigation Bar with Icons */}
        <div className="mb-6 border-b border-[#d3c4af]/20 dark:border-slate-700">
          <nav className="flex flex-wrap gap-1" aria-label="Tabs">
            {PROCESS_TABS.map((tab) => {
              const isActive = activeProcess === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProcess(tab.id)}
                  className={`group relative flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                      : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-500 dark:hover:bg-[#986d00]/10'
                  } cursor-pointer`}
                >
                  <span
                    className={
                      isActive
                        ? 'text-[#785600] dark:text-[#986d00]'
                        : 'text-[#4f4535] dark:text-slate-500'
                    }
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* GenericTable Component */}
        <div className="p-4 shadow-sm dark:bg-slate-900">
          <GenericTable<AlertRuleRow>
            data={currentRows}
            columns={columns}
            showSrNo={true}
            srNoLabel="Sr No."
            pagination={false}
            isLoading={isAlertsLoading}
            emptyMessage="No alert rules found for this process. Click 'Add Rule' to create one."
          />

          {/* Footer with Save Button */}
          {currentRows.length > 0 && (
            <div className="mt-1 flex items-center justify-end px-4 py-3 dark:border-slate-700">
              <GenericButton
                type="button"
                onClick={handleSave}
                variant="primary"
                size="sm"
                disabled={submitalert.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{submitalert.isPending ? 'Saving...' : 'Save'}</span>
              </GenericButton>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRowToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Alert Rule"
        itemIdentifier={
          rowToDelete
            ? `${rowToDelete.purity ? `${rowToDelete.purity}% purity` : 'Rule'}`
            : undefined
        }
        isLoading={deleteAlertMutation.isPending || submitalert.isPending}
      />
    </div>
  );
};

export default AlertManagement;
