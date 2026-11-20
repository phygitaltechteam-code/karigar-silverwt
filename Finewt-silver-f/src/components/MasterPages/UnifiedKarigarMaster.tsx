import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Tag,
  Box,
  Flame,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Briefcase,
  Settings2,
  CheckCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';

import {
  UNIFIED_KARIGAR_STORAGE_KEY,
  BHARNI_KARIGAR_STORAGE_KEY,
  SOLDERING_KARIGAR_STORAGE_KEY,
  POLISHING_KARIGAR_STORAGE_KEY,
  VIBRATOR_KARIGAR_STORAGE_KEY,
  MELTING_KARIGAR_STORAGE_KEY,
  COMPANY_KARIGAR_STORAGE_KEY,
  PRESS_KARIGAR_STORAGE_KEY,
  SUTT_KARIGAR_STORAGE_KEY,
  CUTTING_KARIGAR_STORAGE_KEY,
  WASH_KARIGAR_STORAGE_KEY,
  MEENA_KARIGAR_STORAGE_KEY,
  TASS_KARIGAR_STORAGE_KEY,
  BHARNI_KARIGAR_RATE_KEY,
  SOLDERING_KARIGAR_RATE_KEY,
  POLISHING_KARIGAR_RATE_KEY,
  VIBRATOR_KARIGAR_RATE_KEY,
  MELTING_KARIGAR_RATE_KEY,
  COMPANY_KARIGAR_RATE_KEY,
  PRESS_KARIGAR_RATE_KEY,
  SUTT_KARIGAR_RATE_KEY,
  CUTTING_KARIGAR_RATE_KEY,
  WASH_KARIGAR_RATE_KEY,
  MEENA_KARIGAR_RATE_KEY,
  TASS_KARIGAR_RATE_KEY,
  RATE_STORAGE_MAP,
  KarigarProcessType,
  hasRate,
  loadKarigarCommonRate,
  saveKarigarCommonRate,
  JobStage,
  LedgerEntry,
  UnifiedKarigarEntry,
  defaultKarigars,
  loadUnifiedKarigars,
  saveUnifiedKarigars,
  loadBharniKarigars,
  loadSolderingKarigars,
  loadPolishingKarigars,
  loadVibratorKarigars,
  loadMeltingKarigars,
  loadCuttingKarigars,
  loadWashKarigars,
  loadMeenaKarigars,
  loadTassKarigars,
} from './unifiedKarigarHelpers';

import AddKarigarModal from './AddKarigarModal';
import EditKarigarModal from './EditKarigarModal';
import KarigarSettlementModal from './KarigarSettlementModal';
import {
  useGetKarigars,
  useDeleteKarigar,
  useGetProcessRate,
  useSetProcessRate,
} from '@/lib/api/karigar';

// Re-export all types, keys, and loader functions for backwards compatibility
export {
  UNIFIED_KARIGAR_STORAGE_KEY,
  BHARNI_KARIGAR_STORAGE_KEY,
  SOLDERING_KARIGAR_STORAGE_KEY,
  POLISHING_KARIGAR_STORAGE_KEY,
  VIBRATOR_KARIGAR_STORAGE_KEY,
  MELTING_KARIGAR_STORAGE_KEY,
  COMPANY_KARIGAR_STORAGE_KEY,
  PRESS_KARIGAR_STORAGE_KEY,
  SUTT_KARIGAR_STORAGE_KEY,
  CUTTING_KARIGAR_STORAGE_KEY,
  WASH_KARIGAR_STORAGE_KEY,
  MEENA_KARIGAR_STORAGE_KEY,
  TASS_KARIGAR_STORAGE_KEY,
  BHARNI_KARIGAR_RATE_KEY,
  SOLDERING_KARIGAR_RATE_KEY,
  POLISHING_KARIGAR_RATE_KEY,
  VIBRATOR_KARIGAR_RATE_KEY,
  MELTING_KARIGAR_RATE_KEY,
  COMPANY_KARIGAR_RATE_KEY,
  PRESS_KARIGAR_RATE_KEY,
  SUTT_KARIGAR_RATE_KEY,
  CUTTING_KARIGAR_RATE_KEY,
  WASH_KARIGAR_RATE_KEY,
  MEENA_KARIGAR_RATE_KEY,
  TASS_KARIGAR_RATE_KEY,
  RATE_STORAGE_MAP,
  hasRate,
  loadKarigarCommonRate,
  saveKarigarCommonRate,
  defaultKarigars,
  loadUnifiedKarigars,
  saveUnifiedKarigars,
  loadBharniKarigars,
  loadSolderingKarigars,
  loadPolishingKarigars,
  loadVibratorKarigars,
  loadMeltingKarigars,
  loadCuttingKarigars,
  loadWashKarigars,
  loadMeenaKarigars,
  loadTassKarigars,
};
export type { JobStage, LedgerEntry, UnifiedKarigarEntry, KarigarProcessType };

export default function UnifiedKarigarMaster({
  defaultTab = 'Melting',
}: {
  defaultTab?: KarigarProcessType;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<KarigarProcessType>(defaultTab);
  const { data: apiKarigars, isLoading: isApiLoading } = useGetKarigars();
  const [list, setList] = useState<UnifiedKarigarEntry[]>(() =>
    loadUnifiedKarigars(),
  );

  const [editingKarigar, setEditingKarigar] = useState<UnifiedKarigarEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [settlingKarigar, setSettlingKarigar] = useState<UnifiedKarigarEntry | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const { mutateAsync: deleteKarigar } = useDeleteKarigar();

  useEffect(() => {
    if (apiKarigars) {
      setList(apiKarigars);
    }
  }, [apiKarigars]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: apiProcessRate, isLoading: isRateLoading } =
    useGetProcessRate(activeTab);
  const { mutateAsync: setProcessRate, isPending: isSavingRate } =
    useSetProcessRate();

  const [commonRate, setCommonRate] = useState<string>(() =>
    loadKarigarCommonRate(defaultTab),
  );

  useEffect(() => {
    if (
      apiProcessRate !== undefined &&
      apiProcessRate !== null &&
      apiProcessRate !== ''
    ) {
      setCommonRate(apiProcessRate);
    } else {
      setCommonRate(loadKarigarCommonRate(activeTab));
    }
  }, [apiProcessRate, activeTab]);

  const persist = (updated: UnifiedKarigarEntry[]) => {
    setList(updated);
    saveUnifiedKarigars(updated);
  };

  const handleSaved = (entry: UnifiedKarigarEntry) => persist([entry, ...list]);

  const handleSaveCommonRate = async () => {
    try {
      await setProcessRate({
        process: activeTab,
        rate: commonRate,
      });
    } catch {
      // Error handled in hook
    }
  };

  const displayedData = useMemo(() => {
    return list.filter((k) => k.processType === activeTab);
  }, [list, activeTab]);

  const columns: Column<UnifiedKarigarEntry>[] = [
    {
      key: 'name',
      header: 'Karigar Name',
      render: (item) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-[#785600] dark:text-amber-400 group-hover:underline">
            {item.name}
          </span>
          <span className="text-[11px] text-[#817563] dark:text-slate-400">
            {item.number || 'No Mobile'}
          </span>
        </div>
      ),
    },
    {
      key: 'number',
      header: 'Mobile',
      render: (item) => (
        <span className="text-xs text-[#1a1c1b] dark:text-slate-300">
          {item.number || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="text-xs text-[#1a1c1b] dark:text-slate-300">
          {item.address || '—'}
        </span>
      ),
    },
    ...(activeTab !== 'Soldering'
      ? [
          {
            key: 'rate',
            header: 'Rate (/Kg)',
            render: (item: UnifiedKarigarEntry) => {
              const r = item.rate || commonRate || '0';
              return (
                <span className="font-mono text-xs font-semibold text-[#785600] dark:text-amber-400">
                  {r} / Kg
                </span>
              );
            },
          } as Column<UnifiedKarigarEntry>,
        ]
      : []),
    {
      key: 'openingBalance',
      header: 'Opening Balance (G)',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#785600] dark:text-amber-400">
          {(item.openingBalance || 0).toFixed(3)} G
        </span>
      ),
    },
  ];

  const tabs: {
    id: KarigarProcessType;
    name: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'Melting', name: 'Melting', icon: <Flame className="h-4 w-4" /> },
    { id: 'Company', name: 'Company', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'Press', name: 'Press', icon: <Box className="h-4 w-4" /> },
    { id: 'Sutt', name: 'Sutt', icon: <Tag className="h-4 w-4" /> },
    { id: 'Bharni', name: 'Bharni', icon: <Box className="h-4 w-4" /> },
    { id: 'Cutting', name: 'Cutting', icon: <Settings2 className="h-4 w-4" /> },
    { id: 'Wash', name: 'Wash', icon: <RefreshCw className="h-4 w-4" /> },
    { id: 'Soldering', name: 'Soldering', icon: <Flame className="h-4 w-4" /> },
    {
      id: 'Polishing',
      name: 'Polishing',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'Vibrator',
      name: 'Vibrator',
      icon: <RefreshCw className="h-4 w-4" />,
    },
    { id: 'Meena', name: 'Meena', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'Tass', name: 'Tass', icon: <CreditCard className="h-4 w-4" /> },
  ];

  const handleNavigateToKarigar = (item: UnifiedKarigarEntry) => {
    navigate({
      to: '/karigar/kairgerbyid/$id',
      params: { id: item.id },
    });
  };

  const renderRowActions = (item: UnifiedKarigarEntry) => {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSettlingKarigar(item);
            setIsSettleModalOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-[#785600] px-3 py-1 text-xs font-bold text-white hover:bg-[#5d4200] transition-colors shadow-sm"
          title="Settle"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Settle</span>
        </button>

        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete karigar "${item.name}"?`)) {
              try {
                await deleteKarigar(item.id);
                setList((prev) => prev.filter((k) => k.id !== item.id));
              } catch (err: any) {
                toast.error(err?.message || 'Failed to delete karigar');
              }
            }
          }}
          className="rounded-lg border border-red-200/60 p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
          title="Delete Karigar"
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
              Karigar Master & Settlement (कारीगर मास्टर)
            </h1>
            <p className="mt-0.5 text-xs font-medium text-[#785600] dark:text-amber-400">
              Manage Karigars, process job stages & settlements by department
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'Soldering' && (
              <div className="flex items-center gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                  <span className="text-xs font-bold uppercase text-[#4f4535] dark:text-slate-300">
                    Rate (/Kg):
                  </span>
                </div>
                <input
                  type="number"
                  value={commonRate}
                  onChange={(e) => setCommonRate(e.target.value)}
                  placeholder={isRateLoading ? '...' : '0'}
                  className="w-20 rounded-lg border border-[#d3c4af]/40 bg-white px-2 py-1 text-center font-mono text-xs font-bold text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  disabled={isSavingRate || isRateLoading}
                  onClick={handleSaveCommonRate}
                  className="rounded-lg bg-[#785600] font-bold text-white hover:bg-[#5d4200] transition-colors disabled:opacity-50 h-9 px-4 text-xs sm:text-[13px]"
                >
                  {isSavingRate ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            <GenericButton
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Add Karigar</span>
            </GenericButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 overflow-x-auto border-b border-[#d3c4af]/20 scrollbar-thin dark:border-slate-700">
          <nav className="flex flex-nowrap gap-1 pb-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                      : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-400 dark:hover:bg-[#986d00]/10'
                  } cursor-pointer`}
                >
                  <span
                    className={
                      isActive
                        ? 'text-[#785600] dark:text-[#986d00]'
                        : 'text-[#4f4535] dark:text-slate-400'
                    }
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Karigar Table */}
        <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <GenericTable
            data={displayedData}
            columns={columns}
            showEdit={false}
            showDelete={false}
            showSrNo
            srNoLabel="Sr No."
            renderActions={renderRowActions}
            onRowClick={(item) => handleNavigateToKarigar(item)}
            searchPlaceholder="Search by name, mobile, address..."
            searchFields={['name', 'number', 'address', 'processType']}
            emptyMessage={`No karigars found for ${activeTab}. Click '+ Add Karigar' to add.`}
          />
        </div>
      </div>

      {/* Add Karigar Modal */}
      <AddKarigarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        initialProcessType={activeTab}
      />

      {/* Edit Karigar Modal */}
      <EditKarigarModal
        isOpen={isEditModalOpen}
        karigar={editingKarigar}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingKarigar(null);
        }}
        onUpdated={(updated) => {
          setList((prev) =>
            prev.map((k) => (k.id === updated.id ? updated : k)),
          );
        }}
      />

      {/* Karigar Settlement Modal */}
      <KarigarSettlementModal
        isOpen={isSettleModalOpen}
        karigar={settlingKarigar}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlingKarigar(null);
        }}
        onSettled={(updated) => {
          setList((prev) =>
            prev.map((k) => (k.id === updated.id ? updated : k)),
          );
        }}
      />
    </div>
  );
}