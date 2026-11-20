import React from 'react';

/**
 * Code 128 (set B) barcode drawn as SVG — readable by standard barcode scanners.
 * No external library needed.
 */

// Bar/space widths for symbol values 0–106 (106 = stop, has 7 elements)
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const START_B = 104;
const STOP = 106;

/** Module widths (bar, space, bar, …) for a Code 128-B symbol of `text` */
export function code128Widths(text: string): number[] {
  const values = [START_B];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    // Set B covers printable ASCII 32–127; anything else becomes '?'
    values.push(code >= 32 && code <= 127 ? code - 32 : '?'.charCodeAt(0) - 32);
  }
  const checksum =
    values.reduce((sum, v, i) => sum + v * (i === 0 ? 1 : i), 0) % 103;
  values.push(checksum, STOP);
  return values.flatMap((v) => PATTERNS[v].split('').map(Number));
}

interface Barcode128Props {
  value: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
}

export const Barcode128: React.FC<Barcode128Props> = ({
  value,
  height = 36,
  moduleWidth = 1.2,
  showText = true,
}) => {
  const widths = code128Widths(value);
  const quiet = 10; // quiet zone (modules) each side
  const totalModules = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  const width = totalModules * moduleWidth;

  let x = quiet * moduleWidth;
  const bars: React.ReactNode[] = [];
  widths.forEach((w, i) => {
    const wPx = w * moduleWidth;
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y={0} width={wPx} height={height} fill="#000" />);
    x += wPx;
  });

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Barcode ${value}`}
        style={{ background: '#fff' }}
      >
        {bars}
      </svg>
      {showText && (
        <span className="mt-0.5 font-mono text-[10px] font-bold tracking-wider text-[#785600] dark:text-amber-400">
          {value}
        </span>
      )}
    </div>
  );
};

/** Short product code shown on the barcode, from a stock row id */
export const productCodeFromId = (id: string) =>
  /^[0-9a-f-]{36}$/i.test(id) ? `PRD-${id.slice(0, 8).toUpperCase()}` : id;

export default Barcode128;
