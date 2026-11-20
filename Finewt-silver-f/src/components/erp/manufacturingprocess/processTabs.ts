import {
  Box,
  Building2,
  CheckCircle,
  Cpu,
  CreditCard,
  Droplets,
  Flame,
  Layers,
  type LucideIcon,
  Package,
  Scissors,
  TrendingUp,
  Vibrate,
  Zap,
} from 'lucide-react';

/**
 * Manufacturing stages in flow order. Used by the Manufacturing page tabs and the
 * sidebar's Manufacturing dropdown, so both always list the same stages and icons.
 * Galai → Company → Press → Sutt → Bharni → Cutting → Wash → Soldering
 *   → Meena → Tass → Polishing → Vibrator → Packaging
 */
export interface ProcessTab {
  id: string;
  name: string;
  Icon: LucideIcon;
}

export const PROCESS_TABS: ProcessTab[] = [
  { id: 'galai', name: 'Galai', Icon: Flame },
  { id: 'company', name: 'Company', Icon: Building2 },
  { id: 'press', name: 'Press', Icon: Cpu },
  { id: 'sutt', name: 'Sutt', Icon: Layers },
  { id: 'bharni', name: 'Bharni', Icon: Box },
  { id: 'cutting', name: 'Cutting', Icon: Scissors },
  { id: 'wash', name: 'Wash', Icon: Droplets },
  { id: 'soldering', name: 'Soldering', Icon: Zap },
  { id: 'meena', name: 'Meena', Icon: CheckCircle },
  { id: 'tass', name: 'Tass', Icon: CreditCard },
  { id: 'polishing', name: 'Polishing', Icon: TrendingUp },
  { id: 'vibrator', name: 'Vibrator', Icon: Vibrate },
  { id: 'packaging', name: 'Packaging', Icon: Package },
];

export const MANUFACTURING_PATH = '/manufacturingprocess/process';
