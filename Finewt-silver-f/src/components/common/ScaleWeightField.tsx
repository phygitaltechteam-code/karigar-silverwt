import React from 'react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { useScaleFocus } from '@/lib/hooks/useScaleFocus';

type FieldProps = React.ComponentProps<typeof GenericInputField>;

/**
 * Weight input that takes the weighing machine reading while it is focused
 * (same behaviour as the Galai / Cutting received fields). Typing still works.
 */
const ScaleWeightField: React.FC<FieldProps & { onScaleWeight: (grams: number) => void }> = ({
  onScaleWeight,
  onFocus,
  onBlur,
  ...props
}) => {
  const scale = useScaleFocus((w) => onScaleWeight(Math.round(w * 1000) / 1000));
  return (
    <GenericInputField
      {...props}
      onFocus={(e) => {
        scale.onFocus();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        scale.onBlur();
        onBlur?.(e);
      }}
    />
  );
};

export default ScaleWeightField;
