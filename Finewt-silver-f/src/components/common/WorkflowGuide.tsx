import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X, Compass, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface TourStep {
  stepNumber: number;
  totalSteps: number;
  route: string;
  tabId?: string;
  title: string;
  initialInstruction: string;
  afterCreatedInstruction: string;
  targetKeywords?: string[];
  autoOpenKeywords?: string[];
  autoSaveKeywords?: string[];
  fieldFillRules?: {
    selectors: string[];
    value: string;
  }[];
}

const tourSteps: TourStep[] = [
  {
    stepNumber: 1,
    totalSteps: 11,
    route: '/master/additems',
    title: 'Master Catalog: Add Item',
    initialInstruction:
      'Opening modal, typing "4 Box", and automatically saving to catalog...',
    afterCreatedInstruction:
      'Here is the item you just added: "4 Box" saved live in your catalog table!',
    targetKeywords: ['add item', 'add', '+'],
    autoOpenKeywords: ['add item', 'add', '+'],
    autoSaveKeywords: ['add item', 'save'],
    fieldFillRules: [
      {
        selectors: [
          'div[role="dialog"] input[name="name"]',
          'form input[name="name"]',
          'input[name="name"]:not([placeholder*="Search"])',
        ],
        value: '4 Box',
      },
    ],
  },
  {
    stepNumber: 2,
    totalSteps: 11,
    route: '/master/size',
    title: 'Size & Length Variants',
    initialInstruction:
      'Opening modal, typing size number "45", and automatically saving...',
    afterCreatedInstruction:
      'Here is the size you just added: "45" saved and linked for production and bills!',
    targetKeywords: ['add size', 'add', '+'],
    autoOpenKeywords: ['add size', 'add', '+'],
    autoSaveKeywords: ['add size', 'add', 'save'],
    fieldFillRules: [
      {
        selectors: [
          'div[role="dialog"] input[name="size"]',
          'form input[name="size"]',
          'input[name="size"]:not([placeholder*="Search"])',
          'input[placeholder*="Size"]:not([placeholder*="Search"])',
        ],
        value: '45',
      },
    ],
  },
  {
    stepNumber: 3,
    totalSteps: 11,
    route: '/stock/openingstock',
    title: 'Vault Opening Stock & Purity',
    initialInstruction:
      'Filling Gross Weight (2,500.000 g) and Purity (91.60%), then auto-saving...',
    afterCreatedInstruction:
      'Here is your live vault balance: 2,500.000 g Gross = 2,290.000 g Fine Gold saved!',
    targetKeywords: ['submit', 'save opening stock', 'save'],
    autoSaveKeywords: ['submit', 'save opening stock', 'save'],
    fieldFillRules: [
      {
        selectors: [
          'input[name="grossWeight"]:not([placeholder*="Search"])',
          'input[placeholder*="Gross"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '2500',
      },
      {
        selectors: [
          'input[name="purity"]:not([placeholder*="Search"])',
          'input[placeholder*="Purity"]:not([placeholder*="Search"])',
        ],
        value: '91.6',
      },
    ],
  },
  {
    stepNumber: 4,
    totalSteps: 11,
    route: '/receipt/addreciept',
    title: 'Smart Billing (Add Client & Row)',
    initialInstruction:
      'Opening client dropdown, auto-creating "Royal Jewellers Mumbai", and populating bill row (85.400 g, ₹120/g SRP)...',
    afterCreatedInstruction:
      'Here is the live bill: "Royal Jewellers Mumbai" selected with 78.226 g Fine Gold & ₹10,248 SRP labor!',
    targetKeywords: ['search by client', 'add row', 'add item', '+'],
    autoOpenKeywords: ['add row', 'add item', '+'],
    autoSaveKeywords: ['add item', 'save item', 'save'],
    fieldFillRules: [
      {
        selectors: [
          'input[name="grossWeight"]:not([placeholder*="Search"])',
          'input[name="grossWt"]:not([placeholder*="Search"])',
          'input[placeholder*="Gross"]:not([placeholder*="Search"])',
        ],
        value: '85.40',
      },
      {
        selectors: [
          'input[name="purity"]:not([placeholder*="Search"])',
          'input[placeholder*="Purity"]:not([placeholder*="Search"])',
        ],
        value: '91.60',
      },
      {
        selectors: [
          'input[name="makingCharge"]:not([placeholder*="Search"])',
          'input[name="srp"]:not([placeholder*="Search"])',
          'input[placeholder*="Labor"]:not([placeholder*="Search"])',
        ],
        value: '120',
      },
    ],
  },
  {
    stepNumber: 5,
    totalSteps: 11,
    route: '/setlment/settlement',
    title: 'Metal & Cash Settlement',
    initialInstruction:
      'Opening settlement, entering bullion return (150.000 g Pure) and cash (₹45,000), and settling...',
    afterCreatedInstruction:
      'Here is the reconciled party account: 150.000 g pure gold returned and cash credited in table!',
    targetKeywords: ['add settlement', 'settlement', 'settle', '+'],
    autoOpenKeywords: ['add settlement', 'settlement', 'settle', '+'],
    autoSaveKeywords: ['settle', 'submit', 'save'],
    fieldFillRules: [
      {
        selectors: [
          'input[name="metalWeight"]:not([placeholder*="Search"])',
          'input[placeholder*="Metal"]:not([placeholder*="Search"])',
        ],
        value: '150.00',
      },
      {
        selectors: [
          'input[name="cashAmount"]:not([placeholder*="Search"])',
          'input[placeholder*="Cash"]:not([placeholder*="Search"])',
        ],
        value: '45000',
      },
    ],
  },
  {
    stepNumber: 6,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'tar',
    title: 'Manufacturing: 1. Tar (Wire Drawing)',
    initialInstruction:
      'Clicking "+ Add Tar", populating Ingot In (1,500.000 g) & Wire Out (1,480.200 g), and saving to table...',
    afterCreatedInstruction:
      'Here is the Tar Department: 1,500.000 g Ingot In → 1,480.200 g Wire Spool Out saved in the live table!',
    targetKeywords: ['add tar', 'add', '+'],
    autoOpenKeywords: ['add tar', 'add', '+'],
    autoSaveKeywords: ['save tar', 'save', 'add row'],
    fieldFillRules: [
      {
        selectors: [
          'div[role="dialog"] input[name="fine"]',
          'input[placeholder*="Fine"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '1500.000',
      },
      {
        selectors: [
          'input[placeholder*="Tar"]:not([placeholder*="Search"])',
          'input[name="tar"]:not([placeholder*="Search"])',
        ],
        value: '1480.200',
      },
      {
        selectors: [
          'input[placeholder*="Scrap"]:not([placeholder*="Search"])',
          'input[name="scrap"]:not([placeholder*="Search"])',
        ],
        value: '18.500',
      },
      {
        selectors: [
          'input[placeholder*="Purity"]:not([placeholder*="Search"])',
          'input[name="purity"]:not([placeholder*="Search"])',
        ],
        value: '91.6',
      },
    ],
  },
  {
    stepNumber: 7,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'box',
    title: 'Manufacturing: 2. Box Department',
    initialInstruction:
      'Switching to Box department, populating machine pattern weaving (1,475.400 g), and saving to table...',
    afterCreatedInstruction:
      'Here is the Box Department: 1,480.200 g Wire In → 1,475.400 g Woven Box Chain Mesh in table!',
    targetKeywords: ['box', 'save', 'add'],
    autoOpenKeywords: ['add', 'add row', '+'],
    autoSaveKeywords: ['save', 'add'],
    fieldFillRules: [
      {
        selectors: [
          'input[placeholder*="Weight"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '1475.400',
      },
      {
        selectors: ['input[placeholder*="Scrap"]:not([placeholder*="Search"])'],
        value: '4.200',
      },
    ],
  },
  {
    stepNumber: 8,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'soldering',
    title: 'Manufacturing: 3. Soldering (Taanka)',
    initialInstruction:
      'Switching to Soldering department, adding Kadka solder alloy (+35.200 g), and saving to table...',
    afterCreatedInstruction:
      'Here is the Soldering Department: +35.200 g Kadka solder added → 1,508.500 g bonded chain saved!',
    targetKeywords: ['soldering', 'save', 'add'],
    autoOpenKeywords: ['add', '+'],
    autoSaveKeywords: ['save', 'add'],
    fieldFillRules: [
      {
        selectors: [
          'input[placeholder*="Kadka"]:not([placeholder*="Search"])',
          'input[placeholder*="Solder"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '35.200',
      },
    ],
  },
  {
    stepNumber: 9,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'joint',
    title: 'Manufacturing: 4. Joint Department',
    initialInstruction:
      'Switching to Joint department, recording continuous chain locking (1,505.100 g), and saving...',
    afterCreatedInstruction:
      'Here is the Joint Department: Master link assembly with 1,505.100 g continuous locked mesh in table!',
    targetKeywords: ['joint', 'save', 'add'],
    autoOpenKeywords: ['add', '+'],
    autoSaveKeywords: ['save', 'add'],
    fieldFillRules: [
      {
        selectors: [
          'input[placeholder*="Joined"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '1505.100',
      },
    ],
  },
  {
    stepNumber: 10,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'cutting',
    title: 'Manufacturing: 5. Diamond Cutting',
    initialInstruction:
      'Switching to Diamond Cutting, recording faceted weight & suction dust recovery (21.800 g)...',
    afterCreatedInstruction:
      'Here is Diamond Cutting: 1,482.300 g Faceted Chain Out with 21.800 g vacuum dust recovered in table!',
    targetKeywords: ['cutting', 'save', 'add'],
    autoOpenKeywords: ['add', '+'],
    autoSaveKeywords: ['save', 'add'],
    fieldFillRules: [
      {
        selectors: [
          'input[placeholder*="Cut"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '1482.300',
      },
      {
        selectors: [
          'input[placeholder*="Dust"]:not([placeholder*="Search"])',
          'input[placeholder*="Recovery"]:not([placeholder*="Search"])',
        ],
        value: '21.800',
      },
    ],
  },
  {
    stepNumber: 11,
    totalSteps: 11,
    route: '/manufacturingprocess/process',
    tabId: 'kunda',
    title: 'Manufacturing: 6. S / Kunda & Finishing',
    initialInstruction:
      'Switching to S-Kunda for clasp fitting (+12.500 g), hallmark certification, and vault delivery...',
    afterCreatedInstruction:
      'Here is S-Kunda Finishing: Clasp fitted → 1,494.200 g certified 91.60% ready stock delivered to vault!',
    targetKeywords: ['kunda', 'finish', 'save', 'stock'],
    autoOpenKeywords: ['add', '+'],
    autoSaveKeywords: ['save', 'add', 'finish', 'stock'],
    fieldFillRules: [
      {
        selectors: [
          'input[placeholder*="Clasp"]:not([placeholder*="Search"])',
          'input[placeholder*="Kunda"]:not([placeholder*="Search"])',
          'input[type="number"]:not([placeholder*="Search"])',
        ],
        value: '12.500',
      },
    ],
  },
];

// Helper: Find element by keywords safely
const findElementByKeywords = (keywords?: string[]): HTMLElement | null => {
  if (!keywords || keywords.length === 0) return null;

  // 1. Search buttons
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button'),
  );
  for (const btn of buttons) {
    const text = (btn.textContent || '').trim().toLowerCase();
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return btn;
    }
    if (btn.querySelector('svg.lucide-plus') || btn.querySelector('svg')) {
      if (
        keywords.some((kw) => ['add', 'plus', '+'].includes(kw.toLowerCase()))
      ) {
        return btn;
      }
    }
  }

  // 2. Search inputs
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input'),
  );
  for (const inp of inputs) {
    const placeholder = (inp.placeholder || '').toLowerCase();
    if (keywords.some((kw) => placeholder.includes(kw.toLowerCase()))) {
      return inp;
    }
  }

  return null;
};

// Helper to simulate typing into input
const triggerInputChange = (input: HTMLInputElement, value: string) => {
  const placeholder = (input.placeholder || '').toLowerCase();
  const name = (input.name || '').toLowerCase();
  const type = (input.type || '').toLowerCase();
  if (
    (placeholder.includes('search') ||
      name.includes('search') ||
      type === 'search') &&
    !placeholder.includes('search by client')
  ) {
    return;
  }

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();
};

export const WorkflowGuide: React.FC = () => {
  const navigate = useNavigate();

  // ONLY show on first login: if 'erp-tour-seen' exists, do not show tour or floating button
  const [isTourActive, setIsTourActive] = useState<boolean>(() => {
    const hasSeen = localStorage.getItem('erp-tour-seen');
    return hasSeen !== 'true';
  });

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [hasCompletedAutoAction, setHasCompletedAutoAction] =
    useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState<{
    top: number;
    left: number;
    arrowPlacement: 'top' | 'bottom';
    arrowLeft: number;
  }>({
    top: 80,
    left: typeof window !== 'undefined' ? window.innerWidth - 380 : 20,
    arrowPlacement: 'top',
    arrowLeft: 50,
  });

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentStep = tourSteps[stepIndex] || tourSteps[0];

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  // Recalculate popup position anchored to active button
  const updatePopupPosition = useCallback(() => {
    const targetKeywords =
      currentStep.targetKeywords || currentStep.autoOpenKeywords;
    const targetEl = findElementByKeywords(targetKeywords);

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const tooltipWidth = Math.min(360, window.innerWidth - 32);
      const tooltipHeight = 175;
      const MARGIN = 10;

      // Check if tooltip fits below target button
      const fitsBelow =
        rect.bottom + tooltipHeight + MARGIN < window.innerHeight;
      const topPos = fitsBelow
        ? rect.bottom + MARGIN
        : Math.max(16, rect.top - tooltipHeight - MARGIN);

      // Horizontal centering around target element
      const elementCenter = rect.left + rect.width / 2;
      let leftPos = elementCenter - tooltipWidth / 2;
      leftPos = Math.max(
        16,
        Math.min(window.innerWidth - tooltipWidth - 16, leftPos),
      );

      // Arrow position relative to popup
      const arrowLeft = Math.max(
        20,
        Math.min(tooltipWidth - 20, elementCenter - leftPos),
      );

      setPopupPosition({
        top: topPos,
        left: leftPos,
        arrowPlacement: fitsBelow ? 'top' : 'bottom',
        arrowLeft: arrowLeft,
      });
    } else {
      // Fallback: top-right position
      setPopupPosition({
        top: 80,
        left: Math.max(16, window.innerWidth - 380),
        arrowPlacement: 'top',
        arrowLeft: 300,
      });
    }
  }, [currentStep]);

  // Execute automated open -> fill -> save simulation
  const performAutomatedAction = useCallback(() => {
    clearAllTimeouts();
    setHasCompletedAutoAction(false);

    // Update position anchored to button
    updatePopupPosition();

    // 1. If step has manufacturing tabId, click tab
    if (currentStep.tabId) {
      const tabButtons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const btn of Array.from(tabButtons)) {
        const text = btn.textContent?.toLowerCase() || '';
        if (
          (currentStep.tabId === 'tar' && text.includes('tar')) ||
          (currentStep.tabId === 'box' && text.includes('box')) ||
          (currentStep.tabId === 'soldering' && text.includes('soldering')) ||
          (currentStep.tabId === 'joint' && text.includes('joint')) ||
          (currentStep.tabId === 'cutting' && text.includes('cutting')) ||
          (currentStep.tabId === 'kunda' &&
            (text.includes('kunda') ||
              text.includes('s kunda') ||
              text.includes('s / kunda')))
        ) {
          btn.click();
          break;
        }
      }
    }

    // Special handling for Step 4 (Billing: open client search dropdown & auto create client)
    if (currentStep.stepNumber === 4) {
      const clientSearchInput = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Search by client"]',
      );
      if (clientSearchInput) {
        clientSearchInput.focus();
        clientSearchInput.click();
        const t1 = setTimeout(() => {
          const addNewClientBtn = findElementByKeywords([
            'add new client',
            'new client',
            'userplus',
          ]);
          if (addNewClientBtn) {
            addNewClientBtn.click();
            // Fill Add Client Modal
            const t2 = setTimeout(() => {
              const nameInput = document.querySelector<HTMLInputElement>(
                'div[role="dialog"] input[name="fullName"], div[role="dialog"] input[placeholder*="name"]',
              );
              const phoneInput = document.querySelector<HTMLInputElement>(
                'div[role="dialog"] input[name="phoneNumber"], div[role="dialog"] input[placeholder*="phone"]',
              );
              const addressInput = document.querySelector<HTMLInputElement>(
                'div[role="dialog"] input[name="address"]',
              );
              const balInput = document.querySelector<HTMLInputElement>(
                'div[role="dialog"] input[name="openingBalance"]',
              );

              if (nameInput)
                triggerInputChange(nameInput, 'Royal Jewellers Mumbai');
              if (phoneInput) triggerInputChange(phoneInput, '9876543210');
              if (addressInput)
                triggerInputChange(addressInput, 'Zaveri Bazaar, Mumbai');
              if (balInput) triggerInputChange(balInput, '150.50');

              // Save client modal
              const t3 = setTimeout(() => {
                const dialogModal =
                  document.querySelector('div[role="dialog"]');
                if (dialogModal) {
                  const saveBtn = dialogModal.querySelector<HTMLButtonElement>(
                    'button.bg-amber-600, button[type="button"]:not(:first-child), button[type="submit"]',
                  );
                  if (saveBtn) saveBtn.click();
                }
              }, 400);
              timeoutsRef.current.push(t3);
            }, 350);
            timeoutsRef.current.push(t2);
          }
        }, 300);
        timeoutsRef.current.push(t1);
      }
    }

    // 2. Auto click modal trigger button if not open
    if (currentStep.autoOpenKeywords) {
      const isModalAlreadyOpen = document.querySelector('div[role="dialog"]');
      if (!isModalAlreadyOpen) {
        const openBtn = findElementByKeywords(currentStep.autoOpenKeywords);
        if (openBtn) openBtn.click();
      }
    }

    // 3. Fill the form fields automatically
    const tMain = setTimeout(() => {
      if (currentStep.fieldFillRules) {
        currentStep.fieldFillRules.forEach((rule) => {
          for (const selector of rule.selectors) {
            try {
              const inputEl =
                document.querySelector<HTMLInputElement>(selector);
              if (
                inputEl &&
                inputEl.type !== 'hidden' &&
                inputEl.type !== 'submit' &&
                inputEl.type !== 'search' &&
                !(inputEl.placeholder || '').toLowerCase().includes('search')
              ) {
                triggerInputChange(inputEl, rule.value);
                inputEl.classList.add('ring-2', 'ring-black', 'bg-neutral-50');
                const tRing = setTimeout(() => {
                  inputEl.classList.remove(
                    'ring-2',
                    'ring-black',
                    'bg-neutral-50',
                  );
                }, 2000);
                timeoutsRef.current.push(tRing);
                break;
              }
            } catch (e) {
              // ignore
            }
          }
        });
      }

      // 4. Automatically click Save/Submit after filling
      if (currentStep.autoSaveKeywords) {
        const tSave = setTimeout(() => {
          const dialogModal = document.querySelector('div[role="dialog"]');
          let saved = false;

          if (dialogModal) {
            const saveBtn = dialogModal.querySelector<HTMLButtonElement>(
              'button.bg-amber-600, button[type="button"]:not(:first-child), button[type="submit"]',
            );
            if (saveBtn) {
              saveBtn.click();
              saved = true;
            }
          }

          if (!saved) {
            const saveBtn = findElementByKeywords(currentStep.autoSaveKeywords);
            if (saveBtn) {
              saveBtn.click();
              saved = true;
            }
          }

          toast.success('Saved and updated in table', {
            duration: 2000,
          });
          setHasCompletedAutoAction(true);
          updatePopupPosition();
        }, 600);
        timeoutsRef.current.push(tSave);
      } else {
        const tDone = setTimeout(() => {
          setHasCompletedAutoAction(true);
          updatePopupPosition();
        }, 300);
        timeoutsRef.current.push(tDone);
      }
    }, 400);
    timeoutsRef.current.push(tMain);
  }, [currentStep, updatePopupPosition]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Navigate when step changes during active tour
  useEffect(() => {
    if (isTourActive) {
      navigate({
        to: currentStep.route as any,
        state: currentStep.tabId ? { selectedTab: currentStep.tabId } : undefined,
      });
      const timer = setTimeout(() => {
        performAutomatedAction();
      }, 400);
      timeoutsRef.current.push(timer);
      return () => clearTimeout(timer);
    }
  }, [
    stepIndex,
    isTourActive,
    navigate,
    currentStep.route,
    currentStep.tabId,
    performAutomatedAction,
  ]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleFinish = () => {
    clearAllTimeouts();
    setIsTourActive(false);
    localStorage.setItem('erp-tour-seen', 'true');
  };

  const handleSkip = () => {
    clearAllTimeouts();
    setIsTourActive(false);
    localStorage.setItem('erp-tour-seen', 'true');
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') handleSkip();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTourActive, stepIndex]);

  // If tour is not active (user finished, skipped, or returning user), render NOTHING (No floating button)
  if (!isTourActive) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Dynamically positioned popover in Simple White/Black Theme */}
      <div
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="animate-in fade-in zoom-in-95 pointer-events-auto fixed max-w-sm duration-200 sm:max-w-md"
      >
        {/* Dynamic Pointer Arrow (pointing up) */}
        {popupPosition.arrowPlacement === 'top' && (
          <div
            style={{ left: `${popupPosition.arrowLeft}px` }}
            className="relative -top-2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-black dark:border-b-white"
          />
        )}

        {/* Minimalist Crisp White & Black Card */}
        <div className="rounded-xl border border-black/15 bg-white p-4 text-black shadow-2xl dark:border-white/20 dark:bg-[#121212] dark:text-white sm:p-5">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-black">
                <Sparkles className="h-3 w-3" />
                Step {currentStep.stepNumber}
              </span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {currentStep.title}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 dark:hover:text-white"
              title="Close Guide (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description (तपशील) Message */}
          <p className="mb-4 text-xs font-normal leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-[13px]">
            {hasCompletedAutoAction
              ? currentStep.afterCreatedInstruction
              : currentStep.initialInstruction}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {/* Step Counter */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
                {currentStep.stepNumber} / {currentStep.totalSteps}
              </span>
              <button
                onClick={handleSkip}
                className="text-[11px] text-neutral-400 underline underline-offset-2 transition-colors hover:text-black dark:hover:text-white"
              >
                Skip
              </button>
            </div>

            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="rounded-lg border border-neutral-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Pointer Arrow (pointing down) */}
        {popupPosition.arrowPlacement === 'bottom' && (
          <div
            style={{ left: `${popupPosition.arrowLeft}px` }}
            className="relative -bottom-2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-black dark:border-t-white"
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowGuide;
