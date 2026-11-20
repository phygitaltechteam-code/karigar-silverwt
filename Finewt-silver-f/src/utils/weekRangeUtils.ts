export interface WeekCycleConfig {
  startDay: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDay: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  cycleId: string;
}

export const WEEK_DAYS = [
  {value: 0, label: 'Sunday'},
  {value: 1, label: 'Monday'},
  {value: 2, label: 'Tuesday'},
  {value: 3, label: 'Wednesday'},
  {value: 4, label: 'Thursday'},
  {value: 5, label: 'Friday'},
  {value: 6, label: 'Saturday'},
];

export const WEEK_CYCLE_OPTIONS = [
  {
    startDay: 1,
    endDay: 0,
    cycleId: 'monday_to_sunday',
    label: 'Monday (Monday to Sunday)',
  },
  {
    startDay: 2,
    endDay: 1,
    cycleId: 'tuesday_to_monday',
    label: 'Tuesday (Tuesday to Monday)',
  },
  {
    startDay: 3,
    endDay: 2,
    cycleId: 'wednesday_to_tuesday',
    label: 'Wednesday (Wednesday to Tuesday)',
  },
  {
    startDay: 4,
    endDay: 3,
    cycleId: 'thursday_to_wednesday',
    label: 'Thursday (Thursday to Wednesday)',
  },
  {
    startDay: 5,
    endDay: 4,
    cycleId: 'friday_to_thursday',
    label: 'Friday (Friday to Thursday)',
  },
  {
    startDay: 6,
    endDay: 5,
    cycleId: 'saturday_to_friday',
    label: 'Saturday (Saturday to Friday)',
  },
  {
    startDay: 0,
    endDay: 6,
    cycleId: 'sunday_to_saturday',
    label: 'Sunday (Sunday to Saturday)',
  },
];

export const WEEK_CYCLE_PRESETS = WEEK_CYCLE_OPTIONS;

export const getSavedWeekCycle = (): WeekCycleConfig => {
  try {
    const saved = localStorage.getItem('app_week_cycle');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.startDay === 'number' &&
        typeof parsed.endDay === 'number'
      ) {
        const calculatedEndDay =
          parsed.startDay === parsed.endDay
            ? (parsed.startDay - 1 + 7) % 7
            : parsed.endDay;
        return {
          ...parsed,
          endDay: calculatedEndDay,
        };
      }
    }
  } catch (e) {
    console.error('Error reading week cycle from localStorage:', e);
  }
  return {startDay: 1, endDay: 0, cycleId: 'monday_to_sunday'};
};

export const saveWeekCycle = (config: WeekCycleConfig) => {
  try {
    localStorage.setItem('app_week_cycle', JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent('app_week_cycle_changed', {detail: config}),
    );
  } catch (e) {
    console.error('Error saving week cycle:', e);
  }
};

/**
 * Calculates current week's from and to Date objects based on the configured cycle.
 */
export const getCurrentAppWeekRange = (referenceDate = new Date()) => {
  const {startDay, endDay, cycleId} = getSavedWeekCycle();
  const now = new Date(referenceDate);
  const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)

  // Calculate difference to the start day of the current week cycle
  const diffToStart = (currentDay - startDay + 7) % 7;
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - diffToStart);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(fromDate);
  if (startDay === endDay) {
    // If e.g. Sunday to Sunday, span 7 days
    toDate.setDate(fromDate.getDate() + 7);
  } else {
    // Difference between startDay and endDay
    const span = (endDay - startDay + 7) % 7;
    toDate.setDate(fromDate.getDate() + (span === 0 ? 6 : span));
  }
  toDate.setHours(23, 59, 59, 999);

  const formatStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    fromDate,
    toDate,
    fromStr: formatStr(fromDate),
    toStr: formatStr(toDate),
    startDay,
    endDay,
    cycleId,
  };
};

/** Default History date range for every manufacturing stage: last 7 days up to today */
export const getHistoryDefaultRange = () => {
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  fromDate.setHours(0, 0, 0, 0);
  return { fromDate, toDate };
};
