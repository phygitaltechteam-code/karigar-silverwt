// store/manufacturingStore.ts
export interface ManufacturingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  // Tar fields
  fine?: number;
  tar?: number;
  scrap?: number;
  lossWeight?: number;
  // Box fields
  tarWeight?: number;
  chainWeight?: number;
  // Soldering fields
  chainGiven?: number;
  chainReceived?: number;
  powder?: number;
  increase?: number;
  // Joint fields
  powderReceived?: number;
  srp?: number;
  // Cutting fields
  cuttingLoss?: number;
  finalWeight?: number;
  isEditing?: boolean;
  isSaved?: boolean;
}



// Initial entries for trial or standard
const createInitialEntries = (): ManufacturingEntry[] => {
  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });



  return [
    {
      id: '1',
      srNo: 1,
      dateTime: now,
      item: 'Bracelet',
      size: '16',
      purity: '22K',
      fine: 5.0,
      tar: 4.5,
      scrap: 0.05,
      lossWeight: 0.5,
      tarWeight: 4.5,
      chainWeight: 0,
      chainGiven: 0,
      chainReceived: 0,
      powder: 0,
      increase: 0,
      powderReceived: 0,
      srp: 0,
      isEditing: false,
      isSaved: false,
    },
  ];
};

// Store state
let entries: ManufacturingEntry[] = createInitialEntries();

export const manufacturingStore = {
  getEntries: (): ManufacturingEntry[] => {
    return entries;
  },

  addEntry: (entry: ManufacturingEntry): void => {
    entries = [...entries, {...entry, id: `entry-${Date.now()}`}];
  },

  updateEntry: (id: string, data: Partial<ManufacturingEntry>): void => {
    entries = entries.map((entry) =>
      entry.id === id ? {...entry, ...data} : entry,
    );
    console.log('📦 Store updated:', entries);
  },

  getLastEntry: (): ManufacturingEntry | null => {
    return entries.length > 0 ? entries[entries.length - 1] : null;
  },

  clearEntries: (): void => {
    entries = [];
  },

  reset: (): void => {
    entries = createInitialEntries();
  },
};
