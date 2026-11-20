import { extendTrack, trackOf } from './processTrack';

/**
 * Reads the manufacturing stages kept in browser storage and returns:
 *  - work in progress: pending table rows + available stock cards, per stage
 *  - scrap: scrap recorded on saved rows, per stage and purity
 * Galai lives on the server and is added by the caller.
 */

const STAGES: { name: string; entries: string[]; cards: string[] }[] = [
  { name: 'Company', entries: ['chain_company_process_entries_v2'], cards: ['chain_company_stock_cards_v2'] },
  { name: 'Press', entries: ['chain_press_process_entries_v2'], cards: ['chain_press_stock_cards_v2'] },
  { name: 'Sutt', entries: ['chain_sutt_process_entries_v2'], cards: ['chain_sutt_stock_cards_v2'] },
  { name: 'Bharni', entries: ['chain_bharni_process_entries_v1'], cards: ['chain_bharni_stock_cards_v1'] },
  { name: 'Wash', entries: ['chain_wash_process_entries_v2'], cards: ['chain_wash_stock_cards_v2'] },
  { name: 'Cutting', entries: ['chain_cutting_process_entries_v2'], cards: ['chain_cutting_stock_cards_v2'] },
  { name: 'Soldering', entries: ['chain_soldering_process_entries_v2'], cards: ['chain_soldering_stock_cards_v2'] },
  { name: 'Meena', entries: ['chain_meena_process_entries_v2'], cards: [] },
  { name: 'Tass', entries: ['chain_tass_process_entries_v2'], cards: ['chain_tass_stock_cards_v2'] },
  { name: 'Polishing', entries: ['chain_polishing_process_entries_v2'], cards: ['chain_polishing_stock_cards_v2'] },
  { name: 'Vibrator', entries: ['chain_vibrator_process_entries_v2'], cards: ['chain_vibrator_stock_cards_v2'] },
  { name: 'Packaging', entries: ['chain_packaging_entries_v2'], cards: [] },
];

export interface WipRow {
  id: string;
  stage: string;
  kind: 'In process' | 'Ready (stock card)';
  design: string;
  size: string;
  stamp: string;
  purity: number;
  weight: number;
  qty?: string | number;
  processTrack: string[];
}

export interface ScrapRow {
  id: string;
  stage: string;
  purity: number;
  weight: number;
  count: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const readList = (key: string): any[] => {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const isDone = (r: any) =>
  r?.status === 'completed' ||
  r?.status === 'soldering' ||
  r?.status === 'reverted' ||
  r?.isCompleted === true ||
  r?.isSaved === true;

const givenOf = (r: any) =>
  num(r.netWeightGiven ?? r.netWeight ?? r.grossWt ?? r.chainGiven ?? r.chainWeight);
const scrapOf = (r: any) => num(r.scrap ?? r.scrapWeight);

export function collectWorkInProgress(): WipRow[] {
  const rows: WipRow[] = [];
  STAGES.forEach((stage) => {
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && !isDone(r) && givenOf(r) > 0)
        .forEach((r) =>
          rows.push({
            id: `${key}-${r.id}`,
            stage: stage.name,
            kind: 'In process',
            design: r.design || r.designName || r.description || '',
            size: r.size || '',
            stamp: r.stamp || r.Stamp || '',
            purity: num(r.purity),
            weight: round3(givenOf(r)),
            qty: r.qty,
            processTrack: extendTrack(trackOf(r), stage.name),
          }),
        ),
    );
    stage.cards.forEach((key) =>
      readList(key)
        .filter((c) => c && num(c.availableWeight ?? c.totalWeight ?? c.weight) > 0)
        .forEach((c) =>
          rows.push({
            id: `${key}-${c.id}`,
            stage: stage.name,
            kind: 'Ready (stock card)',
            design: c.design || c.description || '',
            size: c.size || '',
            stamp: c.stamp || c.Stamp || '',
            purity: num(c.purity),
            weight: round3(num(c.availableWeight ?? c.totalWeight ?? c.weight)),
            qty: c.qty,
            processTrack: extendTrack(trackOf(c), stage.name),
          }),
        ),
    );
  });
  return rows;
}

export function collectScrap(): ScrapRow[] {
  const map = new Map<string, ScrapRow>();
  STAGES.forEach((stage) =>
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && isDone(r) && scrapOf(r) > 0)
        .forEach((r) => {
          const purity = num(r.purity);
          const id = `${stage.name}-${purity}`;
          const cur = map.get(id) || { id, stage: stage.name, purity, weight: 0, count: 0 };
          cur.weight = round3(cur.weight + scrapOf(r));
          cur.count += 1;
          map.set(id, cur);
        }),
    ),
  );
  return [...map.values()];
}

/* -------------------------------------------------------------------------- */
/*            Jobs done by one karigar (for the Karigar page ledger)           */
/* -------------------------------------------------------------------------- */

export interface KarigarJob {
  id: string;
  jobNo: string;
  itemName: string;
  design: string;
  stamp: string;
  purity: string;
  rate: number;
  processName: string;
  metal: string;
  giveM: number;
  issueDate: string;
  takenWt: number;
  returnDate: string | null;
  expectedLoss: number;
  loss: number;
  differenceLoss: number;
  labourAmount: number | null;
  payment: number;
  paidAmount: number;
  pendingAmount: number;
  /** Paid more than the labour for this job */
  advanceAmount: number;
  status: string;
}

const receivedOf = (r: any) =>
  num(r.netWeightReceived ?? r.receivedWeight ?? r.receivedWt ?? r.fineWeight);

/**
 * Every manufacturing row (any stage) given to this karigar.
 * Amount due = rate (₹/kg) × weight / 1000, using received weight once returned.
 * `paidByJob` maps a job id to the amount already paid against it.
 */
export function collectKarigarJobs(
  karigarName: string,
  paidByJob: Record<string, number> = {},
): KarigarJob[] {
  const name = karigarName.trim().toLowerCase();
  if (!name) return [];
  const jobs: KarigarJob[] = [];
  STAGES.forEach((stage) =>
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && String(r.karigar || '').trim().toLowerCase() === name)
        .forEach((r) => {
          const given = givenOf(r);
          const received = receivedOf(r);
          const done = isDone(r);
          const wt = received > 0 ? received : given;
          const rate = num(r.rate);
          const payment = Math.round(((rate * wt) / 1000) * 100) / 100;
          const loss =
            r.loss !== undefined && r.loss !== null
              ? num(r.loss)
              : done
                ? Math.max(0, round3(given - received - scrapOf(r)))
                : 0;
          const jobId = `${stage.name}-${r.id}`;
          const paid = paidByJob[jobId] || 0;
          jobs.push({
            id: jobId,
            jobNo: String(r.id).slice(-6).toUpperCase(),
            itemName: stage.name,
            design: r.design || r.designName || r.description || '-',
            stamp: r.stamp || r.Stamp || '-',
            purity: String(num(r.purity)),
            rate,
            processName: stage.name,
            metal: 'Silver',
            giveM: round3(given),
            issueDate: r.createdAt || r.dateTime || new Date().toISOString(),
            takenWt: round3(received),
            returnDate: done ? r.completedAt || r.updatedAt || r.createdAt || null : null,
            expectedLoss: 0,
            loss,
            differenceLoss: 0,
            labourAmount: payment,
            payment,
            paidAmount: paid,
            pendingAmount: Math.max(0, Math.round((payment - paid) * 100) / 100),
            advanceAmount: Math.max(0, Math.round((paid - payment) * 100) / 100),
            status: payment > 0 && paid >= payment ? 'PAID' : done ? 'RETURNED' : 'IN_PROGRESS',
          });
        }),
    ),
  );
  return jobs.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

/** Saved rows with a loss, per stage (Loss report) */
export function collectLosses() {
  const rows: {
    id: string;
    createdAt: string;
    process: string;
    particular: string;
    purity: number;
    grossWt: number;
    loss: number;
  }[] = [];
  STAGES.forEach((stage) =>
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && isDone(r))
        .forEach((r) => {
          const given = givenOf(r);
          const loss =
            r.loss !== undefined && r.loss !== null
              ? num(r.loss)
              : Math.max(0, round3(given - receivedOf(r) - scrapOf(r)));
          if (loss <= 0.0005) return;
          rows.push({
            id: `${key}-${r.id}`,
            createdAt: r.completedAt || r.updatedAt || r.createdAt || new Date().toISOString(),
            process: stage.name,
            particular: r.design || r.designName || r.description || stage.name,
            purity: num(r.purity),
            grossWt: round3(given),
            loss: round3(loss),
          });
        }),
    ),
  );
  return rows;
}

/** Rows started or saved on a given day, per stage (Daily report) */
export function collectDayProcess(date: Date) {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  const inDay = (v?: string) => {
    if (!v) return false;
    const d = new Date(v);
    return !isNaN(d.getTime()) && d >= from && d <= to;
  };
  const rows: any[] = [];
  STAGES.forEach((stage) =>
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && (inDay(r.createdAt) || inDay(r.completedAt)))
        .forEach((r) => {
          const given = givenOf(r);
          const received = receivedOf(r);
          rows.push({
            id: `${key}-${r.id}`,
            name: r.design || r.designName || r.description || stage.name,
            processName: stage.name,
            grossWeight: round3(given),
            fineWeight: round3(((received > 0 ? received : given) * num(r.purity)) / 100),
            purity: num(r.purity),
            isCompleted: isDone(r),
            createdAt: r.createdAt,
            scrap: scrapOf(r),
            loss: num(r.loss),
          });
        }),
    ),
  );
  return rows;
}

/* -------------------------------------------------------------------------- */
/*          Process flow: Galai → … → Packaging, one summary row per stage     */
/* -------------------------------------------------------------------------- */

export interface ProcessFlowRow {
  stage: string;
  /** Completed rows in the period */
  count: number;
  given: number;
  received: number;
  scrap: number;
  loss: number;
  /** Loss as % of given weight */
  lossPct: number;
  /** Fine silver lost (loss × purity) */
  fineLoss: number;
  /** Labour charged: rate (₹/kg) × weight / 1000 */
  labour: number;
  /** Labour per kg over the weight worked (₹/kg) */
  avgRate: number;
  karigars: string[];
}

/** Rows shaped like a stage row, for stages kept elsewhere (Galai on the server) */
export interface FlowInputRow {
  createdAt?: string;
  completedAt?: string;
  purity?: number;
  given: number;
  received: number;
  scrap: number;
  loss?: number;
  rate?: number;
  karigar?: string;
}

const PACKS_KEY = 'chain_packaging_packs_v1';

export function collectProcessFlow(
  from: Date | null,
  to: Date | null,
  galaiRows: FlowInputRow[] = [],
): ProcessFlowRow[] {
  const start = from ? new Date(from) : null;
  start?.setHours(0, 0, 0, 0);
  const end = to ? new Date(to) : null;
  end?.setHours(23, 59, 59, 999);
  const inRange = (v?: string) => {
    if (!v) return !start && !end;
    const d = new Date(v);
    if (isNaN(d.getTime())) return true;
    return (!start || d >= start) && (!end || d <= end);
  };

  const build = (stage: string, rows: FlowInputRow[]): ProcessFlowRow => {
    const acc = { given: 0, received: 0, scrap: 0, loss: 0, fineLoss: 0, labour: 0, worked: 0 };
    const karigars = new Set<string>();
    rows.forEach((r) => {
      const loss =
        r.loss !== undefined && r.loss !== null ? num(r.loss) : Math.max(0, round3(r.given - r.received - r.scrap));
      const wt = r.received > 0 ? r.received : r.given;
      acc.given += r.given;
      acc.received += r.received;
      acc.scrap += r.scrap;
      acc.loss += loss;
      acc.fineLoss += (loss * num(r.purity)) / 100;
      acc.labour += (num(r.rate) * wt) / 1000;
      if (num(r.rate) > 0) acc.worked += wt;
      const k = String(r.karigar || '').trim();
      if (k) karigars.add(k);
    });
    return {
      stage,
      count: rows.length,
      given: round3(acc.given),
      received: round3(acc.received),
      scrap: round3(acc.scrap),
      loss: round3(acc.loss),
      lossPct: acc.given > 0 ? Math.round((acc.loss / acc.given) * 10000) / 100 : 0,
      fineLoss: round3(acc.fineLoss),
      labour: Math.round(acc.labour * 100) / 100,
      avgRate: acc.worked > 0 ? Math.round(((acc.labour * 1000) / acc.worked) * 100) / 100 : 0,
      karigars: [...karigars],
    };
  };

  const result: ProcessFlowRow[] = [
    build(
      'Galai',
      galaiRows.filter((r) => inRange(r.completedAt || r.createdAt)),
    ),
  ];

  STAGES.forEach((stage) => {
    if (stage.name === 'Packaging') {
      // Packaging: each pack is one row; wastage is its loss
      const packs = readList(PACKS_KEY).filter((p) => p && inRange(p.packedAt));
      result.push(
        build(
          'Packaging',
          packs.map((p) => ({
            given: num(p.baseWeight) || num(p.packedWeight) + num(p.wastage),
            received: num(p.packedWeight),
            scrap: 0,
            loss: num(p.wastage),
          })),
        ),
      );
      return;
    }
    const rows: FlowInputRow[] = [];
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && isDone(r) && r.status !== 'reverted')
        .filter((r) => inRange(r.completedAt || r.updatedAt || r.createdAt))
        .forEach((r) =>
          rows.push({
            purity: num(r.purity),
            given: givenOf(r),
            received: receivedOf(r),
            scrap: scrapOf(r),
            loss: r.loss !== undefined && r.loss !== null ? num(r.loss) : undefined,
            rate: num(r.rate),
            karigar: r.karigar,
          }),
        ),
    );
    result.push(build(stage.name, rows));
  });

  return result;
}

/** Saved (completed) rows of every browser-side stage, shaped for the Manufacturing report */
export function collectManufacturingHistory() {
  const rows: any[] = [];
  STAGES.forEach((stage) =>
    stage.entries.forEach((key) =>
      readList(key)
        .filter((r) => r && isDone(r))
        .forEach((r) => {
          const given = givenOf(r);
          const received = receivedOf(r);
          const scrap = scrapOf(r);
          const design = r.design || r.designName || r.description || '';
          const name = design ? `${stage.name} · ${design}` : stage.name;
          rows.push({
            id: `${key}-${r.id}`,
            createdAt: r.completedAt || r.updatedAt || r.createdAt || new Date().toISOString(),
            itemId: name,
            item: { name },
            sizeId: r.size || '',
            size: { size: r.size || 'N/A' },
            purity: num(r.purity),
            weight: round3(given),
            currentWeight: round3(received),
            scrap: round3(scrap),
            loss:
              r.loss !== undefined && r.loss !== null
                ? num(r.loss)
                : Math.max(0, round3(given - received - scrap)),
          });
        }),
    ),
  );
  return rows;
}
