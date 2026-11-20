import React, { useState, useMemo } from 'react';
import TabBar from '@/components/common/TabBar';
import { Plus, Tag, Box, Flame, TrendingUp, RefreshCw, Scissors, Trash2 } from 'lucide-react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

import {
  BHARNI_DESIGN_STORAGE_KEY,
  BHARNI_COMMON_RATE_KEY,
  CUTTING_DESIGN_STORAGE_KEY,
  POLISHING_DESIGN_STORAGE_KEY,
  POLISHING_COMMON_RATE_KEY,
  SOLDERING_DESIGN_STORAGE_KEY,
  VIBRATOR_DESIGN_STORAGE_KEY,
  DesignEntry,
  BharniDesignEntry,
  CuttingDesignEntry,
  PolishingDesignEntry,
  SolderingDesignEntry,
  VibratorDesignEntry,
  ProcessTabType,
  UnifiedDesignItem,
  defaultBharniDesigns,
  defaultCuttingDesigns,
  defaultPolishingDesigns,
  defaultSolderingDesigns,
  defaultVibratorDesigns,
  loadBharniCommonRate,
  loadBharniDesigns,
  loadCuttingDesigns,
  loadPolishingCommonRate,
  loadPolishingDesigns,
  loadSolderingDesigns,
  loadVibratorDesigns,
} from './unifiedDesignHelpers';

import AddDesignModal from './AddDesignModal';
import { useGetDesigns, useDeleteDesign, BackendDesign } from '@/lib/api/design';

// Re-export all types, keys, and loader functions for backwards compatibility
export {
  BHARNI_DESIGN_STORAGE_KEY,
  BHARNI_COMMON_RATE_KEY,
  CUTTING_DESIGN_STORAGE_KEY,
  POLISHING_DESIGN_STORAGE_KEY,
  POLISHING_COMMON_RATE_KEY,
  SOLDERING_DESIGN_STORAGE_KEY,
  VIBRATOR_DESIGN_STORAGE_KEY,
  defaultBharniDesigns,
  defaultCuttingDesigns,
  defaultPolishingDesigns,
  defaultSolderingDesigns,
  defaultVibratorDesigns,
  loadBharniCommonRate,
  loadBharniDesigns,
  loadCuttingDesigns,
  loadPolishingCommonRate,
  loadPolishingDesigns,
  loadSolderingDesigns,
  loadVibratorDesigns,
};
export type {
  DesignEntry,
  BharniDesignEntry,
  CuttingDesignEntry,
  PolishingDesignEntry,
  SolderingDesignEntry,
  VibratorDesignEntry,
  ProcessTabType,
  UnifiedDesignItem,
};

interface UnifiedDesignMasterProps {
  defaultTab?: ProcessTabType;
}

export default function UnifiedDesignMaster({
  defaultTab = 'BHARNI',
}: UnifiedDesignMasterProps) {
  const [activeTab, setActiveTab] = useState<ProcessTabType>(defaultTab);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query API hooks
  const { data: apiDesigns, isLoading } = useGetDesigns();
  const deleteDesignMutation = useDeleteDesign();

  // Local state fallbacks
  const [bharniList, setBharniList] = useState<BharniDesignEntry[]>(() =>
    loadBharniDesigns(),
  );
  const [cuttingList, setCuttingList] = useState<CuttingDesignEntry[]>(() =>
    loadCuttingDesigns(),
  );
  const [polishingList, setPolishingList] = useState<PolishingDesignEntry[]>(() =>
    loadPolishingDesigns(),
  );
  const [solderingList, setSolderingList] = useState<SolderingDesignEntry[]>(() =>
    loadSolderingDesigns(),
  );
  const [vibratorList, setVibratorList] = useState<VibratorDesignEntry[]>(() =>
    loadVibratorDesigns(),
  );

  const handleSavedItem = (item: UnifiedDesignItem) => {
    if (item.processType === 'Bharni') {
      const updated: BharniDesignEntry[] = [
        ...bharniList,
        { id: item.id, designName: item.designName },
      ];
      setBharniList(updated);
      try {
        localStorage.setItem(BHARNI_DESIGN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } else if (item.processType === 'Cutting') {
      const updated: CuttingDesignEntry[] = [
        ...cuttingList,
        { id: item.id, designName: item.designName },
      ];
      setCuttingList(updated);
      try {
        localStorage.setItem(CUTTING_DESIGN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } else if (item.processType === 'Polishing') {
      const updated: PolishingDesignEntry[] = [
        ...polishingList,
        { id: item.id, designName: item.designName },
      ];
      setPolishingList(updated);
      try {
        localStorage.setItem(POLISHING_DESIGN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } else if (item.processType === 'Soldering') {
      const updated: SolderingDesignEntry[] = [
        ...solderingList,
        {
          id: item.id,
          designName: item.designName,
          ratePerDesign: item.ratePerDesign || '',
        },
      ];
      setSolderingList(updated);
      try {
        localStorage.setItem(SOLDERING_DESIGN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } else if (item.processType === 'Vibrator') {
      const updated: VibratorDesignEntry[] = [
        ...vibratorList,
        { id: item.id, designName: item.designName },
      ];
      setVibratorList(updated);
      try {
        localStorage.setItem(VIBRATOR_DESIGN_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete design "${name}"?`)) {
      try {
        await deleteDesignMutation.mutateAsync(id);
        // Also remove from local lists
        setBharniList((prev) => prev.filter((d) => d.id !== id));
        setCuttingList((prev) => prev.filter((d) => d.id !== id));
        setPolishingList((prev) => prev.filter((d) => d.id !== id));
        setSolderingList((prev) => prev.filter((d) => d.id !== id));
        setVibratorList((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete design');
      }
    }
  };

  // Compile active data combining API results and local fallback
  const getActiveData = (): {
    data: any[];
    columns: Column<any>[];
    processLabel: string;
  } => {
    // If we have API designs matching current process, prefer them
    const apiFiltered = (apiDesigns || []).filter(
      (d) => d.process.toUpperCase() === activeTab.toUpperCase(),
    );
    const hasApi = Array.isArray(apiDesigns);

    let displayData: any[] = [];

    switch (activeTab) {
      case 'BHARNI': {
        displayData = hasApi
          ? apiFiltered.map((d) => ({ id: d.id, designName: d.name }))
          : bharniList;
        return {
          data: displayData,
          processLabel: 'Bharni',
          columns: [
            {
              key: 'designName',
              header: 'Design Name',
              render: (item: any) => (
                <span className="font-semibold text-[#1a1c1b] dark:text-white">
                  {item.designName || item.name}
                </span>
              ),
            },
          ],
        };
      }
      case 'CUTTING': {
        displayData = hasApi
          ? apiFiltered.map((d) => ({ id: d.id, designName: d.name }))
          : cuttingList;
        return {
          data: displayData,
          processLabel: 'Cutting',
          columns: [
            {
              key: 'designName',
              header: 'Design Name',
              render: (item: any) => (
                <span className="font-semibold text-[#1a1c1b] dark:text-white">
                  {item.designName || item.name}
                </span>
              ),
            },
          ],
        };
      }
      case 'POLISHING': {
        displayData = hasApi
          ? apiFiltered.map((d) => ({ id: d.id, designName: d.name }))
          : polishingList;
        return {
          data: displayData,
          processLabel: 'Polishing',
          columns: [
            {
              key: 'designName',
              header: 'Design Name',
              render: (item: any) => (
                <span className="font-semibold text-[#1a1c1b] dark:text-white">
                  {item.designName || item.name}
                </span>
              ),
            },
          ],
        };
      }
      case 'SOLDERING': {
        displayData = hasApi
          ? apiFiltered.map((d) => ({
              id: d.id,
              designName: d.name,
              ratePerDesign: d.rate !== undefined && d.rate !== null ? String(d.rate) : '',
            }))
          : solderingList;
        return {
          data: displayData,
          processLabel: 'Soldering',
          columns: [
            {
              key: 'designName',
              header: 'Design Name',
              render: (item: any) => (
                <span className="font-semibold text-[#1a1c1b] dark:text-white">
                  {item.designName || item.name}
                </span>
              ),
            },
            {
              key: 'ratePerDesign',
              header: 'Rate / Design (Rs)',
              render: (item: any) => (
                <span className="font-mono text-xs font-semibold text-[#785600] dark:text-amber-400">
                  {item.ratePerDesign ? `₹${item.ratePerDesign}` : '—'}
                </span>
              ),
            },
          ],
        };
      }
      case 'VIBRATOR': {
        displayData = hasApi
          ? apiFiltered.map((d) => ({ id: d.id, designName: d.name }))
          : vibratorList;
        return {
          data: displayData,
          processLabel: 'Vibrator',
          columns: [
            {
              key: 'designName',
              header: 'Design Name',
              render: (item: any) => (
                <span className="font-semibold text-[#1a1c1b] dark:text-white">
                  {item.designName || item.name}
                </span>
              ),
            },
          ],
        };
      }
    }
  };

  const { data: currentData, columns: currentColumns, processLabel } =
    getActiveData();

  const tabs: { id: ProcessTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'BHARNI', label: 'Bharni Designs', icon: <Box className="h-4 w-4" /> },
    {
      id: 'CUTTING',
      label: 'Cutting Designs',
      icon: <Scissors className="h-4 w-4" />,
    },
    {
      id: 'POLISHING',
      label: 'Polishing Designs',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'SOLDERING',
      label: 'Soldering Designs',
      icon: <Flame className="h-4 w-4" />,
    },
    {
      id: 'VIBRATOR',
      label: 'Vibrator Designs',
      icon: <RefreshCw className="h-4 w-4" />,
    },
  ];

  const renderRowActions = (item: any) => {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteItem(item.id, item.designName || item.name);
          }}
          className="rounded-lg border border-red-200/60 p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
          title="Delete Design"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold italic text-[#1a1c1b] dark:text-white">
              Design Master (डिझाईन मास्टर)
            </h1>
            <p className="mt-0.5 text-xs font-medium text-[#785600] dark:text-amber-400">
              Manage master designs across manufacturing processes
            </p>
          </div>

          <GenericButton
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Add Design</span>
          </GenericButton>
        </div>

        {/* Tab Navigation */}
        <TabBar
          tabs={tabs}
          active={activeTab}
          onChange={(id) => setActiveTab(id)}
          className="mb-6"
        />

        {/* Data Table */}
        <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <GenericTable
            data={currentData}
            columns={currentColumns}
            showEdit={false}
            showDelete={false}
            showSrNo
            srNoLabel="Sr No."
            renderActions={renderRowActions}
            searchPlaceholder="Search designs..."
            searchFields={['designName', 'name']}
            emptyMessage={`No designs added for ${processLabel} process yet. Click '+ Add Design' to create one.`}
          />
        </div>
      </div>

      {/* Add Design Modal */}
      <AddDesignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSavedItem}
        defaultProcess={activeTab}
      />
    </div>
  );
}