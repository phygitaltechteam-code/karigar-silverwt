import {
  ClientReportEntry,
  formatIndianDate,
  formatNumber,
} from './clientReportUtils';

interface PrintClientReportOptions {
  filteredData: ClientReportEntry[];
  currentClientName: string;
  fromDate: Date | null;
  toDate: Date | null;
  headerData?: any;
  openingBalance?: number;
}

export const printClientReportDoc = ({
  filteredData,
  currentClientName,
  fromDate,
  toDate,
  headerData,
  openingBalance = 0,
}: PrintClientReportOptions) => {
  if (!filteredData || filteredData.length === 0) {
    return;
  }

  const totalChainWt = filteredData.reduce(
    (sum, item) => sum + (item.chainWt || 0),
    0,
  );
  const totalGoldWt = filteredData.reduce(
    (sum, item) => sum + (item.goldWt || 0),
    0,
  );
  const totalPending = filteredData.reduce(
    (sum, item) =>
      item.isFirstInGroup && item.pending !== null && item.pending !== undefined
        ? sum + item.pending
        : sum,
    0,
  );
  const pendingValue =
    totalPending !== 0 ? totalPending : totalChainWt + totalGoldWt;
  const finalBalance = openingBalance + pendingValue;

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 100%;
    background: white;
    padding: 4px;
    z-index: 9999;
  `;
  document.body.appendChild(printContainer);

  const printGroupedData: {[key: string]: ClientReportEntry[]} = {};
  filteredData.forEach((entry) => {
    if (!printGroupedData[entry.groupId]) {
      printGroupedData[entry.groupId] = [];
    }
    printGroupedData[entry.groupId].push(entry);
  });

  let rows = '';

  Object.keys(printGroupedData).forEach((groupId) => {
    const entries = printGroupedData[groupId];

    entries.forEach((entry) => {
      rows += `
        <tr>
          ${
            entry.isFirstInGroup
              ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;vertical-align:middle;" rowspan="${entry.groupRowSpan}">${entry.srNo}</td>`
              : ''
          }
          ${
            entry.isFirstInGroup
              ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;vertical-align:middle;" rowspan="${entry.groupRowSpan}">
                  ${entry.dateTime || ' '}
                </td>`
              : ''
          }
          ${
            entry.isFirstInGroup
              ? `<td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;vertical-align:middle;" rowspan="${entry.groupRowSpan}">
                  ${
                    entry.billNo
                      ? `<div style="font-weight:bold;font-size:11px;">${entry.billNo}</div>
                         ${
                           (entry.totalWeight !== null &&
                             entry.totalWeight !== undefined) ||
                           (entry.fineWeight !== null &&
                             entry.fineWeight !== undefined)
                             ? `<div style="font-size:9px;color:#333;margin-top:1px;">Total Wt: <b>${formatNumber(
                                 entry.totalWeight ?? entry.fineWeight,
                               )} G</b></div>`
                             : ''
                         }
                         ${
                           entry.given !== null && entry.given !== undefined
                             ? `<div style="font-size:9px;color:#1b5e20;margin-top:1px;">Given: <b>${formatNumber(
                                 entry.given,
                               )} G</b></div>`
                             : ''
                         }
                         ${
                           entry.pending !== null && entry.pending !== undefined
                             ? `<div style="font-size:9px;color:#785600;margin-top:1px;">Pending: <b>${formatNumber(
                                 entry.pending,
                               )} G</b></div>`
                             : ''
                         }`
                      : (entry.remark || '').toLowerCase().includes('opening')
                        ? `<div style="font-size:9px;color:#785600;font-weight:bold;">Pending: ${formatNumber(
                            Math.abs(
                              entry.wt ??
                                entry.goldWt ??
                                entry.chainWt ??
                                openingBalance ??
                                0,
                            ),
                          )} G</div>`
                        : '-'
                  }
                </td>`
              : ''
          }
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
            ${entry.item}${entry.size ? ` (${entry.size})` : ''}
          </td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${entry.remark || 'N/A'}</td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
            ${entry.chainWt !== null && entry.chainWt !== undefined ? `${entry.chainWt > 0 ? '+' : ''}${formatNumber(entry.chainWt)}` : '-'}
          </td>
          <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">
            ${entry.goldWt !== null && entry.goldWt !== undefined ? `${entry.goldWt > 0 ? '+' : ''}${formatNumber(entry.goldWt)}` : '-'}
          </td>
        </tr>
      `;
    });
  });

  const headerInfo =
    headerData?.data?.data ||
    (headerData?.data?.factoryName ? headerData.data : {});
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

  printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
            ${description}
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
            ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>
          <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
          <div style="font-size:11px;color:#000;font-weight:bold;flex:1;text-align:left;">
            ${currentClientName ? `Client: <span style="font-size:12px;font-weight:bold;">${currentClientName}</span>` : ''}
          </div>
          <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
            Client Report
          </h2>
          <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
            From: ${formatIndianDate(fromDate)} &nbsp; To: ${formatIndianDate(toDate)}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Sr</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Bill No</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Item (Size)</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Remark</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Chain WT (G)</th>
              <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;">Gold WT (G)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background:#fef3c7;font-weight:bold;font-size:11px;">
              <td style="border:1px solid #000;padding:2px 3px;text-align:center;">Total</td>
              <td style="border:1px solid #000;padding:2px 3px;text-align:center;"></td>
              <td style="border:1px solid #000;padding:2px 3px;text-align:left;font-size:10px;">
                Opening: <b>${formatNumber(openingBalance)} G</b>
              </td>
              <td colspan="2" style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;"></td>
              <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-family:monospace;">
                ${totalChainWt > 0 ? '+' : ''}${formatNumber(totalChainWt)} G
              </td>
              <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-family:monospace;">
                ${totalGoldWt > 0 ? '+' : ''}${formatNumber(totalGoldWt)} G
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @page {
      margin: 3mm;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #print-container, #print-container * {
        visibility: visible;
      }
      #print-container {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
        padding: 4px !important;
        overflow: auto !important;
        z-index: 9999 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container table {
        width: 100% !important;
      }
      #print-container tr {
        page-break-inside: avoid !important;
      }
      #print-container thead tr {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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
