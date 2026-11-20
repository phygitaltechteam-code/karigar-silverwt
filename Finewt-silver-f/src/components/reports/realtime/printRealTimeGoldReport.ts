import {
  CategoryGroup,
  formatNumberDisplay,
  calculateAvgPurity,
  getItemPrintName,
  getItemPurity,
  formatDateForDisplay,
} from './realTimeGoldUtils';

interface PrintReportParams {
  headerInfo: any;
  filteredGroups: CategoryGroup[];
  grandTotals: {
    grandTotalWeight: number;
    grandTotalFineWeight: number;
    avgPurity: string;
    stockGrossWeight?: number;
    stockFineWeight?: number;
    stockAvgPurity?: string;
    processGrossWeight?: number;
    processFineWeight?: number;
    processAvgPurity?: string;
    clientDueFineWeight?: number;
  };
  fromDate?: Date | null;
  toDate?: Date | null;
}

export const printRealTimeGoldReport = ({
  headerInfo,
  filteredGroups,
  grandTotals,
  fromDate,
  toDate,
}: PrintReportParams) => {
  const header = headerInfo || {};
  const factoryName = header.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const proprietorName = header.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = header.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const leftInvocation = header.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation = header.rightInvocation || '॥ श्री साई प्रसन्न ॥';
  const description =
    header.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const invocationColor = header.invocationColor || '#a84b20';
  const factoryNameColor = header.factoryNameColor || '#c43d5c';
  const descriptionColor = header.descriptionColor || '#8b451f';
  const proprietorColor = header.proprietorColor || '#a84b20';
  const phoneColor = header.phoneColor || '#a84b20';
  const factoryFontSize = header.factoryFontSize
    ? `${header.factoryFontSize}px`
    : '20px';
  const descriptionFontSize = header.descriptionFontSize
    ? `${header.descriptionFontSize}px`
    : '9px';
  const proprietorFontSize = header.proprietorFontSize
    ? `${header.proprietorFontSize}px`
    : '9px';
  const phoneFontSize = header.phoneFontSize
    ? `${header.phoneFontSize}px`
    : '9px';

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';

  const stockGroups = filteredGroups.filter(
    (g) => g.type === 'Stock' && g.id !== 'client-due',
  );
  const processGroups = filteredGroups.filter((g) => g.type === 'Process');
  const clientDueGroup = filteredGroups.find((g) => g.id === 'client-due');

  // Same layout as the dashboard: category row + its items (opened), then total
  const td = 'border:1px solid #d3c4af;padding:3px 4px;text-align:center;color:#000;';
  const th = 'border:1px solid #d3c4af;padding:4px;text-align:center;font-size:8px;font-weight:700;text-transform:uppercase;color:#000;background:#f4f1ea;';
  const groupTable = (title: string, firstCol: string, groups: CategoryGroup[], totalLabel: string) => {
    const gross = groups.reduce((t, g) => t + g.totalGrossWeight, 0);
    const fine = groups.reduce((t, g) => t + g.totalFineWeight, 0);
    const rows = groups
      .map(
        (g) => `
        <tr style="background:#faf8f3;">
          <td style="${td}font-weight:700;font-size:9px;">${g.name}</td>
          <td style="${td}font-weight:700;font-size:9px;">${formatNumberDisplay(g.totalGrossWeight)}</td>
          <td style="${td}font-weight:700;font-size:9px;">${formatNumberDisplay(g.totalFineWeight)}</td>
        </tr>
        ${g.items
          .map(
            (item) => `
        <tr>
          <td style="${td}font-size:8px;">${getItemPrintName(item)}${(() => {
            const p = getItemPurity(item);
            return p === null ? '' : ` (${formatNumberDisplay(p, 2)}%)`;
          })()}</td>
          <td style="${td}font-size:8px;">${formatNumberDisplay(item.grossWeight)}</td>
          <td style="${td}font-size:8px;">${formatNumberDisplay(item.fineWeight)}</td>
        </tr>`,
          )
          .join('')}`,
      )
      .join('');
    return `
      <div style="flex:1;border:1px solid #d3c4af;border-radius:6px;overflow:hidden;">
        <div style="padding:5px;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#000;background:#f9f9f7;border-bottom:1px solid #d3c4af;">${title}</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="${th}">${firstCol}</th><th style="${th}">Gross WT (G)</th><th style="${th}">Fine WT (G)</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="3" style="${td}font-size:8px;">No data</td></tr>`}</tbody>
          <tfoot><tr style="background:#f4f1ea;">
            <td style="${td}font-weight:800;font-size:9px;">${totalLabel}</td>
            <td style="${td}font-weight:800;font-size:9px;">${formatNumberDisplay(gross)}</td>
            <td style="${td}font-weight:800;font-size:9px;">${formatNumberDisplay(fine)}</td>
          </tr></tfoot>
        </table>
      </div>`;
  };

  const dueItems = clientDueGroup?.items || [];
  const dueTotal = clientDueGroup ? clientDueGroup.totalFineWeight : 0;
  const clientDueHtml = `
      <div style="flex:1;border:1px solid #d3c4af;border-radius:6px;overflow:hidden;">
        <div style="padding:5px;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#000;background:#f9f9f7;border-bottom:1px solid #d3c4af;">Customer Due</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="${th}width:28px;">Sr.</th><th style="${th}">Client Name</th><th style="${th}">Due WT (G)</th></tr></thead>
          <tbody>${
            dueItems.length
              ? dueItems
                  .map(
                    (item, idx) => `<tr><td style="${td}font-size:8px;">${idx + 1}</td><td style="${td}font-size:8px;font-weight:700;">${item.name}</td><td style="${td}font-size:8px;font-weight:700;">${formatNumberDisplay(item.fineWeight)}</td></tr>`,
                  )
                  .join('')
              : `<tr><td colspan="3" style="${td}font-size:8px;">No client due records found.</td></tr>`
          }</tbody>
          <tfoot><tr style="background:#f4f1ea;"><td colspan="2" style="${td}font-weight:800;font-size:9px;">Total Due</td><td style="${td}font-weight:800;font-size:9px;">${formatNumberDisplay(dueTotal)}</td></tr></tfoot>
        </table>
      </div>`;

  const card = (label: string, value: string) => `
      <div style="flex:1;border:1px solid #d3c4af;border-radius:6px;padding:6px;text-align:center;">
        <div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#000;">${label}</div>
        <div style="font-size:12px;font-weight:900;color:#000;margin-top:2px;">${value}</div>
      </div>`;
  const cardsHtml = `
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        ${card('Total Gross WT', `${formatNumberDisplay(grandTotals.grandTotalWeight)} G`)}
        ${card('Avg Purity', `${grandTotals.avgPurity}%`)}
        ${card('Total Fine WT', `${formatNumberDisplay(grandTotals.grandTotalFineWeight)} G`)}
      </div>`;
  void calculateAvgPurity;

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Real-Time Stock Report</title>
        <style>
          @page {
            size: A4;
            margin: 4mm 5mm 4mm 5mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            font-size: 8.5px;
          }
          .header-container {
            width: 100%;
            text-align: center;
            border-bottom: 2px solid ${factoryNameColor};
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1px;
          }
          .summary-card {
            background: #fffdfa;
            border: 1px solid #785600;
            padding: 4px 6px;
            border-radius: 4px;
            margin-bottom: 8px;
            page-break-inside: avoid;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            text-align: center;
          }
          .summary-item {
            padding: 3px 2px;
            background: #fdfbf7;
            border: 1px solid #e2d7c3;
            border-radius: 3px;
          }
          .summary-label {
            font-size: 7.5px;
            font-weight: 700;
            color: #785600;
            text-transform: uppercase;
          }
          .summary-val {
            font-size: 8.5px;
            font-weight: bold;
            color: #000;
            margin-top: 1px;
          }
          table {
            border: 1px solid #785600;
          }
          th {
            border: 1px solid #785600;
          }
          td {
            border: 1px solid #785600;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="title-row">
            <span style="font-size:9.5px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:9.5px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};margin-top:1px;">
            ${description}
          </div>
          <div style="font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};margin-top:1px;">
            ${proprietorName} &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:1px solid #785600;padding-bottom:2px;">
          <span style="font-size:11px;font-weight:bold;color:#785600;letter-spacing:1px;text-transform:uppercase;">
            REAL TIME GOLD DASHBOARD
          </span>
          <span style="font-size:8px;font-weight:bold;color:#555;">
            ${fromDate || toDate ? `Period: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)} | ` : ''}Printed: ${new Date().toLocaleString('en-IN')}
          </span>
        </div>

        ${cardsHtml}
        <div style="display:flex;gap:6px;align-items:flex-start;">
          ${groupTable('Gold & Chain Stock', 'Category', stockGroups, 'Total Stock')}
          ${groupTable('Manufacturing Stock', 'Process', processGroups, 'Total Process')}
          ${clientDueHtml}
        </div>
      </body>
    </html>
  `;

  printContainer.innerHTML = printContent;
  document.body.appendChild(printContainer);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        const el = document.getElementById('print-container');
        if (el) document.body.removeChild(el);
      }, 1000);
    }, 500);
  }
};
