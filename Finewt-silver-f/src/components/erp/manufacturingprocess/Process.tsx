import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { manufacturingStore } from '@/utils/manufacturingStore';
import { PROCESS_TABS } from './processTabs';

// Import all department components
import GalaiDept from './galai/GalaiDept';
import CompanyProcess from './Company/CompanyProcess';
import PressMachineProcess from './Press/PressMachineProcess';
import SuttMachineProcess from './Sutt/SuttMachineProcess';
import BharniProcess from './Bharni/BharniProcess';
import SolderingProcess from './soldering/SolderingProcess';
import CuttingProcess from './cutting/CuttingProcess';

import WashProcess from './wash/WashProcess';
import TassProcess from './tass/TassProcess';
import MeenaProcess from './meena/MeenaProcess';
import PolishingProcess from './Polishing/PolishingProcess';
import { VibratorProcess } from './vibrator/Vibrator';
import PackagingProcess from './packaging/PackagingProcess';

interface ProcessStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  path: string;
  status: 'pending' | 'active' | 'completed';
}

const Process: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [wasTarCompleted, setWasTarCompleted] = useState(false);

  // Stage order, names and icons come from PROCESS_TABS (shared with the sidebar).
  // Loose Stock is handled from the Stocks page, so it is not a tab here.
  const STAGE_COMPONENTS: Record<string, React.ReactNode> = {
    galai: <GalaiDept />,
    company: <CompanyProcess />,
    press: <PressMachineProcess />,
    sutt: <SuttMachineProcess />,
    bharni: <BharniProcess />,
    cutting: <CuttingProcess />,
    wash: <WashProcess />,
    soldering: <SolderingProcess />,
    meena: <MeenaProcess />,
    tass: <TassProcess />,
    polishing: <PolishingProcess />,
    vibrator: <VibratorProcess />,
    packaging: <PackagingProcess />,
  };
  const processSteps: ProcessStep[] = PROCESS_TABS.map((tab, i) => ({
    id: tab.id,
    name: tab.name,
    icon: <tab.Icon className="h-4 w-4" />,
    component: STAGE_COMPONENTS[tab.id],
    path: `/manufacturingprocess/${tab.id}`,
    status: i === 0 ? 'active' : 'pending',
  }));

  // Initialize steps based on current route or state
  useEffect(() => {
    const currentPath = location.pathname;
    const state = location.state as { selectedTab?: string } | null;

    let stepIndex = processSteps.findIndex((step) =>
      currentPath.includes(step.path),
    );

    if (state?.selectedTab) {
      const tabIndex = processSteps.findIndex(
        (step) => step.id === state.selectedTab,
      );
      if (tabIndex !== -1) {
        stepIndex = tabIndex;
      }
    }

    if (stepIndex === -1) {
      const entries = manufacturingStore.getEntries();
      const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);
      stepIndex = hasTar ? 0 : 0;
    }

    const updatedSteps = processSteps.map((step, index) => {
      if (index < stepIndex) return { ...step, status: 'completed' as const };
      if (index === stepIndex) return { ...step, status: 'active' as const };
      return { ...step, status: 'pending' as const };
    });

    setSteps(updatedSteps);
    setCurrentStep(stepIndex);

    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);
    setWasTarCompleted(hasTar);
  }, [location.pathname, location.state]);

  // Handle navigation when Tar is completed
  useEffect(() => {
    if (steps.length === 0) return;

    const entries = manufacturingStore.getEntries();
    const hasTar = entries.some((e) => e.tar !== undefined || e.openingStock);

    if (hasTar && currentStep === 0 && !wasTarCompleted) {
      setWasTarCompleted(true);
      const updatedSteps = steps.map((step, index) => {
        if (index === 0) return { ...step, status: 'completed' as const };
        if (index === 1) return { ...step, status: 'active' as const };
        return step;
      });
      setSteps(updatedSteps);
      setCurrentStep(1);
    }
  }, [currentStep, steps, wasTarCompleted]);

  // Handle tab click
  const handleTabClick = (index: number) => {
    const updatedSteps = steps.map((step, i) => {
      if (i < index) return { ...step, status: 'completed' as const };
      if (i === index) return { ...step, status: 'active' as const };
      return { ...step, status: 'pending' as const };
    });

    setSteps(updatedSteps);
    setCurrentStep(index);

    navigate({
      to: '/manufacturingprocess/process',
      state: { selectedTab: steps[index].id },
      replace: true,
    });
  };

  if (steps.length === 0) return null;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <div className="mb-4">
          <PageHeader
            title="Manufacturing Process"
            subtitle="Complete all steps to finish the manufacturing process"
          />
        </div>

        <div className="mb-6 overflow-x-auto border-b border-[#d3c4af]/20 scrollbar-thin dark:border-slate-700">
          <nav
            className="flex min-w-max flex-nowrap gap-1 pb-1 sm:flex-wrap"
            aria-label="Tabs"
          >
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => handleTabClick(index)}
                  className={`group relative flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                      : isCompleted
                        ? 'border-transparent text-[#785600] hover:bg-[#785600]/5 dark:text-[#986d00] dark:hover:bg-[#986d00]/10'
                        : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-500 dark:hover:bg-[#986d00]/10'
                  } cursor-pointer`}
                >
                  <span
                    className={`${
                      isActive
                        ? 'text-[#785600] dark:text-[#986d00]'
                        : 'text-[#4f4535] dark:text-slate-400'
                    }`}
                  >
                    {step.icon}
                  </span>
                  <span>{step.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div>{steps[currentStep]?.component}</div>
      </div>
    </div>
  );
};

export default Process;