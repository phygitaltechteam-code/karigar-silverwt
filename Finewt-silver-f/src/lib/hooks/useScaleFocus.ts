import {useEffect, useRef} from 'react';
import {weightScaleService} from '@/lib/services/weightScaleService';

/**
 * Hook to automatically receive weighing scale reading into a single focused input field.
 * @param onWeight Callback function receiving the weight in grams
 */
export function useScaleFocus(onWeight: (weight: number) => void) {
  const onWeightRef = useRef(onWeight);
  onWeightRef.current = onWeight;
  const isFocusedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = weightScaleService.onReading((reading) => {
      if (isFocusedRef.current) {
        const weight = reading.liveWeight;
        if (weight !== undefined && weight !== null && !isNaN(weight)) {
          console.log(
            '%c[Scale AutoFill] Weight received for focused input:',
            'color: #059669; font-weight: bold;',
            weight,
            'G',
            reading,
          );
          onWeightRef.current(weight);
        }
      }
    });
    return unsubscribe;
  }, []);

  return {
    onFocus: () => {
      isFocusedRef.current = true;
      console.log(
        '%c[Scale AutoFill] Input focused - listening for scale reading',
        'color: #d97706;',
      );
    },
    onBlur: () => {
      isFocusedRef.current = false;
    },
  };
}

/**
 * Hook to automatically receive weighing scale reading into focused table inputs by row index and field name.
 * @param onRowFieldWeight Callback function receiving (rowIndex, fieldName, weight)
 */
export function useTableScaleFocus<T extends string = string>(
  onRowFieldWeight: (index: number, field: T, weight: number) => void,
) {
  const activeRef = useRef<{index: number; field: T} | null>(null);
  const onWeightRef = useRef(onRowFieldWeight);
  onWeightRef.current = onRowFieldWeight;

  useEffect(() => {
    const unsubscribe = weightScaleService.onReading((reading) => {
      if (activeRef.current) {
        const weight = reading.liveWeight;
        if (weight !== undefined && weight !== null && !isNaN(weight)) {
          console.log(
            `%c[Scale AutoFill] Table Row [${activeRef.current.index}] Field [${String(activeRef.current.field)}] received weight:`,
            'color: #059669; font-weight: bold;',
            weight,
            'G',
            reading,
          );
          onWeightRef.current(
            activeRef.current.index,
            activeRef.current.field,
            weight,
          );
        }
      }
    });
    return unsubscribe;
  }, []);

  const getScaleProps = (index: number, field: T) => ({
    onFocus: () => {
      activeRef.current = {index, field};
      console.log(
        `%c[Scale AutoFill] Table Row [${index}] Field [${String(field)}] focused - listening for scale reading`,
        'color: #d97706;',
      );
    },
    onBlur: () => {
      if (
        activeRef.current?.index === index &&
        activeRef.current?.field === field
      ) {
        activeRef.current = null;
      }
    },
  });

  return {getScaleProps};
}
