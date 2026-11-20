/**
 * Manufacturing track: the ordered list of stages an item has passed through,
 * e.g. ['Galai', 'Company', 'Press']. Rows and stock cards carry it as `processTrack`.
 */
export type ProcessTrack = string[];

const clean = (stage: unknown) =>
  String(stage || '')
    .replace(/\s*Process$/i, '')
    .trim();

/** Track of a row or card; older records without one fall back to their source stage */
export function trackOf(record: any): ProcessTrack {
  if (record && Array.isArray(record.processTrack) && record.processTrack.length > 0) {
    return record.processTrack.map(clean).filter(Boolean);
  }
  const source = clean(record?.sourceProcess || record?.source);
  return source ? [source] : [];
}

/** Append a stage unless it is already the last one */
export function extendTrack(track: ProcessTrack | undefined, stage: string): ProcessTrack {
  const base = (track || []).map(clean).filter(Boolean);
  const next = clean(stage);
  if (!next) return base;
  return base[base.length - 1] === next ? base : [...base, next];
}

/** "Ga › Co › Pr" (first two letters of each stage) */
export function formatTrackShort(track: ProcessTrack): string {
  return track.length > 0 ? track.map((t) => t.slice(0, 2)).join(' › ') : '-';
}

/** "Galai › Company › Press" */
export function formatTrack(track: ProcessTrack): string {
  return track.length > 0 ? track.join(' › ') : '-';
}

/** Find a stage's stock card in browser storage (used to read its track when dispatching) */
export function findStageCard(stage: string, cardId: string): any | null {
  const key = clean(stage).toLowerCase();
  for (const suffix of ['v2', 'v1']) {
    try {
      const raw = localStorage.getItem(`chain_${key}_stock_cards_${suffix}`);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const found = list.find((c: any) => String(c?.id) === String(cardId));
        if (found) return found;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return null;
}

/** Find a stage's table row in browser storage (stages like Meena dispatch from a row) */
export function findStageRow(stage: string, rowId: string): any | null {
  const key = clean(stage).toLowerCase();
  for (const suffix of ['v2', 'v1']) {
    try {
      const raw = localStorage.getItem(`chain_${key}_process_entries_${suffix}`);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const found = list.find((r: any) => String(r?.id) === String(rowId));
        if (found) return found;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return null;
}
