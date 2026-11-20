/**
 * Older builds seeded fake demo rows (sample karigars, weights, stock cards) into
 * browser storage and saved them as if they were real. This removes those rows once,
 * leaving everything the user entered untouched.
 */
const DEMO_IDS = new Set<string>([
  'sz-18',
  'sz-20',
  'sz-22',
  'sz-24',
  'sz-26',
  'sz-28',
  'sz-30',
]);

// v2: run again for screens that were still open on an older build during the first cleanup
const PURGE_FLAG = 'chain_demo_data_purged_v2';

export function purgeDemoData(): void {
  try {
    if (localStorage.getItem(PURGE_FLAG)) return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('chain_')) continue;
      const raw = localStorage.getItem(key);
      if (!raw || raw[0] !== '[') continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;
      const kept = list.filter((row: any) => !(row && DEMO_IDS.has(String(row.id))));
      if (kept.length !== list.length) localStorage.setItem(key, JSON.stringify(kept));
    }
    localStorage.setItem(PURGE_FLAG, '1');
  } catch {
    // Storage unavailable or malformed: nothing to clean
  }
}

/**
 * Galai used to fill an empty stamp with the purity (e.g. "92%"), and that copied
 * stamp then travelled to every later stage. Clear stamps that are exactly
 * "<purity>%" for that same row, once. Stamps typed by the user are left alone.
 */
const STAMP_FLAG = 'chain_auto_stamp_cleared_v1';

export function clearAutoPurityStamps(): void {
  try {
    if (localStorage.getItem(STAMP_FLAG)) return;
    const isAuto = (row: any, field: 'stamp' | 'Stamp') => {
      const v = row?.[field];
      const p = Number(row?.purity);
      return typeof v === 'string' && Number.isFinite(p) && v.trim() === `${p}%`;
    };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('chain_')) continue;
      const raw = localStorage.getItem(key);
      if (!raw || raw[0] !== '[') continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;
      let changed = false;
      const cleaned = list.map((row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        (['stamp', 'Stamp'] as const).forEach((f) => {
          if (isAuto(row, f)) {
            next[f] = '';
            changed = true;
          }
        });
        return next;
      });
      if (changed) localStorage.setItem(key, JSON.stringify(cleaned));
    }
    localStorage.setItem(STAMP_FLAG, '1');
  } catch {
    // Storage unavailable or malformed: nothing to clean
  }
}
