import toast from 'react-hot-toast';
import {Column} from '@/components/Forms/Table/GenericTable';
import {PackageCheck} from 'lucide-react';
import React from 'react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {
  checkProcessLossAlert,
  getProcessLossColorClass,
  AlertRule,
  ProcessLossAlertResult,
} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';
import {calculateExpectedFine} from '@/utils/calculations';

export {calculateExpectedFine};

export interface GalaiRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  updatedAt?: string;
  particular?: string;
  description?: string;
  descriptionRaw?: string;
  stamp?: string;
  stampRaw?: string;
  grossWt: number;
  grossWtRaw?: string;
  purity: number;
  purityRaw?: string;
  expectedFine: number;
  fineWeight: number;
  fineWeightRaw?: string;
  netWeight?: number;
  netWeightRaw?: string;
  scrap?: number;
  scrapRaw?: string;
  scrapWeight?: number;
  scrapWeightRaw?: string;
  loss: number;
  scrapCount?: number;
  isEditing?: boolean;
  isSaved?: boolean;
  isDirty?: boolean;
}

export interface ScrapCardData {
  purity: number;
  totalWeight: number;
  count: number;
}

export const getCurrentWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumberDisplay = (value: unknown): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(value));
};

export const formatDate = (dateString: string) => {
  if (!dateString || dateString === '-') return {date: '-', time: '-'};
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const parts = String(dateString).split(', ');
    return {date: parts[0] || dateString, time: parts[1] || ''};
  }
  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export type {AlertRule};

export const checkGalaiLossAlert = (
  grossWt: number,
  purity: number,
  fineWeight: number,
  expectedFine: number,
  alertRules?: AlertRule[],
): ProcessLossAlertResult | null => {
  const actualLoss = Math.max(
    0,
    Math.round((expectedFine - (fineWeight || 0)) * 1000) / 1000,
  );
  return checkProcessLossAlert(
    grossWt,
    purity,
    actualLoss,
    alertRules,
    fineWeight > 0,
  );
};

/** Loss cell: Act / Exp / Diff, same look as the other stages. */
export const GalaiLossCell: React.FC<{
  given: number;
  purity: number;
  loss: number;
  alertRules?: AlertRule[];
  expectedLoss?: number;
}> = ({given, purity, loss, alertRules, expectedLoss}) => {
  const details = evaluateLossDetails(
    Number(given) || 0,
    Number(purity) || 0,
    Number(loss) || 0,
    ...((alertRules && alertRules.length > 0
      ? [alertRules, 'Galai']
      : ['Galai', expectedLoss]) as [any, any]),
  );
  const exp = details.expectedLoss;
  const diff = details.diffLoss;
  return (
    <div className="flex flex-col items-center justify-center">
      <span className={`font-mono text-xs font-semibold ${exp > 0 ? details.colorClass : 'text-[#785600] dark:text-amber-400'}`}>
        Act: {formatNumberDisplay(loss)} G
      </span>
      <div className="mt-0.5 flex flex-col items-center text-[10px] leading-tight text-gray-500 dark:text-slate-400">
        <span>Exp: {formatNumberDisplay(exp)} G</span>
        <span
          className={
            diff > 0
              ? 'font-semibold text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }
        >
          Diff: {diff > 0 ? `+${formatNumberDisplay(diff)}` : formatNumberDisplay(diff)} G
        </span>
      </div>
    </div>
  );
};

export const getGalaiColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleStockClick: (index: number) => void,
  alertRules?: AlertRule[],
): Column<GalaiRow>[] => {
  return [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const {date, time} = formatDate(item.createdAt || item.dateTime);
        return (
          <div className="flex flex-col items-center text-xs">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'stamp',
      header: 'Stamp (शिक्का)',
      render: (item, index) =>
        item.isSaved ? (
          <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {item.stamp || '-'}
          </span>
        ) : (
          <div className="inline-block w-24">
            <GenericInputField
              name={`galaiStamp-${index}`}
              type="text"
              value={item.stampRaw ?? item.stamp ?? ''}
              onChange={(e) => handleInlineChange(index, 'stamp', e.target.value)}
              placeholder="Stamp"
              compact
              className="text-center text-xs"
            />
          </div>
        ),
    },
    {
      key: 'grossWt',
      header: 'Given Wt (G)',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWt)} G
        </span>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Received Wt (G)',
      render: (item, index) =>
        item.isSaved ? (
          <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.fineWeight)} G
          </span>
        ) : (
        <div className="inline-block w-24">
          <GenericInputField
            name={`galaiFineWeight-${index}`}
            type="text"
            inputMode="decimal"
            decimalScale={3}
            value={
              item.fineWeightRaw !== undefined
                ? item.fineWeightRaw
                : item.fineWeight === 0
                  ? ''
                  : item.fineWeight
            }
            {...getScaleProps(index, 'fineWeight')}
            onChange={(e) =>
              handleInlineChange(index, 'fineWeight', e.target.value)
            }
            placeholder="0.000"
            suffix="G"
            compact
            className="font-mono text-center text-xs"
          />
        </div>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) =>
        item.isSaved ? (
          <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap || item.scrapWeight || 0)} G
          </span>
        ) : (
        <div className="inline-block w-20">
          <GenericInputField
            name={`galaiScrap-${index}`}
            type="text"
            inputMode="decimal"
            decimalScale={3}
            value={
              item.scrapRaw !== undefined
                ? item.scrapRaw
                : item.scrapWeightRaw !== undefined
                  ? item.scrapWeightRaw
                  : item.scrap === 0 || item.scrapWeight === 0
                    ? ''
                    : (item.scrap || item.scrapWeight || '')
            }
            onChange={(e) =>
              handleInlineChange(index, 'scrapWeight', e.target.value)
            }
            placeholder="0.000"
            suffix="G"
            compact
            className="font-mono text-center text-xs"
          />
        </div>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const given = item.grossWt || item.expectedFine || 0;
        const fine = item.fineWeight || item.netWeight || 0;
        const scrap = item.scrap || item.scrapWeight || 0;
        const loss = item.loss !== undefined && item.loss !== null && item.loss > 0
          ? item.loss
          : Math.max(0, Math.round((given - fine - scrap) * 1000) / 1000);
        return <GalaiLossCell given={given} purity={item.purity} loss={loss} alertRules={alertRules} />;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: GalaiRow, index: number) => (
        <div className="flex items-center justify-center gap-1.5">
          {item.isSaved ? (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              Saved
            </span>
          ) : (
          <button
            type="button"
            onClick={() => handleStockClick(index)}
            className="rounded-lg bg-[#785600] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#5c4200] active:scale-95 cursor-pointer"
          >
            Save
          </button>
          )}
        </div>
      ),
    },
  ];
};

export const printGalaiHistory = (
  data: any[],
  fromDate: Date | null,
  toDate: Date | null,
  getpdfheaderdata: any,
) => {
  if (!data || data.length === 0) {
    toast.error('No history data to print');
    return;
  }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';

  const totals = data.reduce(
    (acc: any, item: any) => {
      const gross = Number(
        item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
      );
      const purity = Number(item.purity ?? 0);
      const expected = Number(
        item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
      );
      const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
      const loss =
        fine > 0
          ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
          : item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : 0;

      const lossDetails = evaluateLossDetails(
        gross,
        purity,
        loss,
        'galai',
        (item as any).expectedLoss,
      );

      acc.gross += gross;
      acc.expected += expected;
      acc.fine += fine;
      acc.expectedLoss += Number(lossDetails.expectedLoss || 0);
      acc.loss += loss;
      acc.diffLoss += Number(lossDetails.diffLoss || 0);
      return acc;
    },
    { gross: 0, expected: 0, fine: 0, expectedLoss: 0, loss: 0, diffLoss: 0 },
  );

  const rows = data
    .map((item: any, idx: number) => {
      const {date: createDate, time: createTime} = formatDate(item.createdAt);

      let updateDisplay = 'Pending';
      let updateStyle = 'color:#999;font-style:italic;';
      if (item.updatedAt) {
        const formatted = formatDate(item.updatedAt);
        if (formatted.date && formatted.time) {
          updateDisplay = `${formatted.date} ${formatted.time}`;
          updateStyle = 'color:#000;font-style:normal;';
        }
      }

      const gross = Number(
        item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
      );
      const purity = Number(item.purity ?? 0);
      const expected = Number(
        item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
      );
      const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
      const loss =
        fine > 0
          ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
          : item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : 0;

      const lossDetails = evaluateLossDetails(
        gross,
        purity,
        loss,
        'galai',
        (item as any).expectedLoss,
      );
      const expectedLoss = lossDetails.expectedLoss;
      const diffLoss = lossDetails.diffLoss;

      return `
        <tr>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${idx + 1}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;white-space:nowrap;color:#000;">${createDate} ${createTime}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${item.particular || 'Scrap Galai'}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(gross)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(purity)}%</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(expected)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;color:#000;">${formatNumberDisplay(fine)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(expectedLoss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;color:#b91c1c;">${formatNumberDisplay(loss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-family:monospace;color:#c2410c;">${formatNumberDisplay(diffLoss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;white-space:nowrap;${updateStyle}">${updateDisplay}</td>
        </tr>
      `;
    })
    .join('');

  const headerInfo =
    getpdfheaderdata?.data?.data ||
    (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
  const leftInvocation =
    headerInfo.leftInvocation ||
    headerInfo.leftInovation ||
    '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation =
    headerInfo.rightInvocation ||
    headerInfo.rightInovation ||
    '॥ श्री साई प्रसन्न ॥';
  const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const description =
    headerInfo.description ||
    'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const descriptionColor = headerInfo.descriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '20px';
  const descriptionFontSize = headerInfo.descriptionFontSize
    ? `${headerInfo.descriptionFontSize}px`
    : '9px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${headerInfo.proprietorFontSize}px`
    : '9px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${headerInfo.phoneFontSize}px`
    : '9px';

  printContainer.style.cssText =
    'position:fixed;left:-9999px;top:0;width:100%;background:white;padding:4px;z-index:9999;';
  document.body.appendChild(printContainer);

  printContainer.innerHTML = `
    <div style="width:100%;box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;">
      <!-- Header Section -->
      <div style="width:100%;text-align:center;margin:0 0 4px 0;padding:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
          <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
          ${description}
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
          ${proprietorName}&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
        </div>
        <div style="border-bottom:2px solid ${factoryNameColor};margin:3px 0 5px 0;"></div>
      </div>

      <!-- Title and Date Range in one line -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 0;padding:0;">
        <div style="font-size:10px;color:#333;font-weight:600;flex:1;text-align:left;">
          Total: <strong>${data.length}</strong>
        </div>
        <h2 style="margin:0;font-size:15px;color:#000;padding:0;font-weight:bold;text-align:center;flex:2;letter-spacing:0.5px;">
          Galai History Report
        </h2>
        <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
          ${fromDate && toDate
            ? `From: ${new Date(fromDate).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(toDate).toLocaleDateString('en-IN')}`
            : ''
          }
        </div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;table-layout:fixed;">
        <colgroup>
          <col style="width: 4%;" />
          <col style="width: 13%;" />
          <col style="width: 11%;" />
          <col style="width: 9%;" />
          <col style="width: 7%;" />
          <col style="width: 9%;" />
          <col style="width: 9%;" />
          <col style="width: 9%;" />
          <col style="width: 8%;" />
          <col style="width: 8%;" />
          <col style="width: 13%;" />
        </colgroup>
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Sr</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Date & Time</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Particular</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Gross Wt</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Purity %</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Exp Fine</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Fine Wt</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Exp Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Diff Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;color:white;">Processed Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background:#f7f5f0;font-weight:bold;">
            <td colspan="3" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.gross)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.expected)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.fine)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.expectedLoss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#b91c1c;">${formatNumberDisplay(totals.loss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#c2410c;">${totals.diffLoss > 0 ? `+${formatNumberDisplay(totals.diffLoss)}` : formatNumberDisplay(totals.diffLoss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @page {
      size: A4 portrait;
      margin: 6mm 5mm;
    }
    @media print {
      body > *:not(#print-container) { display: none !important; }
      #print-container, #print-container * { visibility: visible !important; }
      #print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }
      #print-container tr { page-break-inside: avoid !important; }
      #print-container thead tr,
      #print-container thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container tfoot tr,
      #print-container tfoot tr td {
        background: #f7f5f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container tbody td {
        color: #000 !important;
      }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 1000);
  }, 500);
};
