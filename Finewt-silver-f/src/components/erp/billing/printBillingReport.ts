import toast from 'react-hot-toast';
import {
  BillGroup,
  formatNumberWithDecimals,
  formatNumberWith2Decimals,
} from './billingTypes';

export const printBillingTableReport = (
  filteredGroups: BillGroup[],
  fromDate: Date[],
  toDate: Date[],
  getpdfheaderdata: any,
) => {
  if (!filteredGroups || filteredGroups.length === 0) {
    toast.error('No records available to print');
    return;
  }

  // HEADER DATA
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
  const Description =
    headerInfo.description ||
    'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const DescriptionColor = headerInfo.DescriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';

  // FONT SIZES
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '16px';
  const DescriptioFontSize = headerInfo.DescriptionFontSize
    ? `${headerInfo.DescriptionFontSize
    }px`
    : '8px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${headerInfo.proprietorFontSize}px`
    : '8px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${headerInfo.phoneFontSize}px`
    : '8px';

  // DATE FORMAT
  const formatDateStr = (d: Date | null) => {
    if (!d) return '-';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fromStr = fromDate.length > 0 ? formatDateStr(fromDate[0]) : '';
  const toStr = toDate.length > 0 ? formatDateStr(toDate[0]) : '';

  // CREATE TABLE ROWS
  const rows = filteredGroups
    .map((group, index) => {
      const items =
        group.items && group.items.length > 0
          ? group.items
          : [
            {
              item: group.displayItems || '-',
              size: group.displaySizes || '-',
              purity: Number(group.displayPurity) || 0,
              finWt: group.totalFinWt || 0,
              srp: group.totalSRP || 0,
              grossWeight: 0,
            },
          ];

      const rowCount = items.length;

      return items
        .map((item, itemIdx) => {
          if (itemIdx === 0) {
            return `
  <tr>
  <td rowspan="${rowCount}" class="sr-col" > ${index + 1} </td>
    <td rowspan="${rowCount}" class="date-col" > ${group.dateTime} </td>
      <td rowspan="${rowCount}" class="bill-col" > ${group.billNo} </td>
        <td rowspan="${rowCount}" class="client-col" > ${group.clientName} </td>
          <td rowspan="${rowCount}" class="phone-col" > ${group.phoneNumber || '-'} </td>
            <td class="item-col" > ${item.item || '-'} </td>
              <td class="purity-col" > ${item.purity ? `${formatNumberWithDecimals(item.purity)}%` : '-'} </td>
                <td class="number-col fine-col" > ${item.finWt !== undefined && item.finWt !== null ? formatNumberWithDecimals(item.finWt) : '-'} </td>
                  <td class="number-col" > ${item.srp !== undefined && item.srp !== null && Number(item.srp) > 0 ? formatNumberWith2Decimals(item.srp) : '-'} </td>
                    <td rowspan="${rowCount}" class="number-col" > ${formatNumberWithDecimals(group.receive)} </td>
                      <td rowspan="${rowCount}" class="number-col pending-col" > ${formatNumberWithDecimals(group.remainingWeight !== undefined && group.remainingWeight !== null ? group.remainingWeight : group.pending)} </td>
                        </tr>
                          `;
          }

          return `
                        <tr>
                        <td class="item-col" > ${item.item || '-'} </td>
                          <td class="purity-col" > ${item.purity ? `${formatNumberWithDecimals(item.purity)}%` : '-'} </td>
                            <td class="number-col fine-col" > ${item.finWt !== undefined && item.finWt !== null ? formatNumberWithDecimals(item.finWt) : '-'} </td>
                              <td class="number-col" > ${item.srp !== undefined && item.srp !== null && Number(item.srp) > 0 ? formatNumberWith2Decimals(item.srp) : '-'} </td>
                                </tr>
                                  `;
        })
        .join('');
    })
    .join('');

  const totalFineAll = filteredGroups.reduce(
    (s, g) => s + (g.totalFinWt || 0),
    0,
  );
  const totalReceiveAll = filteredGroups.reduce(
    (s, g) => s + (g.receive || 0),
    0,
  );
  const totalPendingAll = filteredGroups.reduce(
    (s, g) =>
      s +
      (g.remainingWeight !== undefined && g.remainingWeight !== null
        ? g.remainingWeight
        : g.pending || 0),
    0,
  );

  const reportHtml = `
                                <!DOCTYPE html >
                                  <html>
                                  <head>
                                  <title>Billing Report </title>
                                    <meta charset="utf-8" />
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                        <style>
        * {
                                          margin: 0;
                                          padding: 0;
                                          box-sizing: border-box;
        }
html, body {
  width: 100%;
  margin: 0;
  padding: 0;
}
        body {
  font-family: Arial, sans-serif;
  background: #ffffff;
  -webkit-print-color-adjust: exact!important;
  print-color-adjust: exact!important;
}
@page {
  size: A4 portrait;
  margin: 5mm;
}
        .report-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 1mm;
  box-sizing: border-box;
}
        .header-section {
  width: 100%;
  text-align: center;
  margin: 0;
  padding: 0;
}
        .header-top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  margin: 0 0 1px 0;
  padding: 0;
}
        .invocation {
  font-size: 8px;
  font-weight: bold;
  color: ${invocationColor};
  white-space: nowrap;
  flex-shrink: 0;
}
        .factory-name {
  font-size: ${factoryFontSize};
  font-weight: bold;
  color: ${factoryNameColor};
  text-align: center;
  white-space: nowrap;
  flex: 1;
}
        .description {
  margin: 1px 0 0 0;
  padding: 0;
  font-size: ${DescriptioFontSize};
  font-weight: bold;
  color: ${DescriptionColor};
  line-height: 1.1;
}
        .proprietor {
  margin: 1px 0 0 0;
  padding: 0;
  font-size: ${proprietorFontSize};
  font-weight: bold;
  color: ${proprietorColor};
  line-height: 1.1;
}
        .phone {
  color: ${phoneColor};
  font-size: ${phoneFontSize};
}
        .header-line {
  border-bottom: 1.5px solid ${factoryNameColor};
  margin: 2px 0 3px 0;
}
        .title-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1px 0 3px 0;
  padding: 0;
}
        .title-left {
  flex: 1;
}
        .report-title {
  flex: 1;
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-weight: bold;
  color: #000;
  text-align: center;
  white-space: nowrap;
}
        .date-range {
  flex: 1;
  font-size: 7px;
  color: #000;
  font-weight: bold;
  text-align: right;
  white-space: nowrap;
}
        table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  margin: 0;
  padding: 0;
  font-size: 7px;
}
th: nth-child(1), td: nth-child(1) { width: 4%; }
th: nth-child(2), td: nth-child(2) { width: 10%; }
th: nth-child(3), td: nth-child(3) { width: 10%; }
th: nth-child(4), td: nth-child(4) { width: 12%; }
th: nth-child(5), td: nth-child(5) { width: 11%; }
th: nth-child(6), td: nth-child(6) { width: 14%; }
th: nth-child(7), td: nth-child(7) { width: 7%; }
th: nth-child(8), td: nth-child(8) { width: 8%; }
th: nth-child(9), td: nth-child(9) { width: 7%; }
th: nth-child(10), td: nth-child(10) { width: 8.5%; }
th: nth-child(11), td: nth-child(11) { width: 8.5%; }
th, td {
  border: 1px solid #000;
  padding: 1.5px 2px;
  vertical-align: middle;
  line-height: 1.1;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: anywhere;
}
        thead {
  display: table-header-group;
}
        thead tr {
  background: #785600;
  color: #ffffff;
  font-weight: 600;
}
        thead th {
  border: 1px solid #785600;
  padding: 2px;
  text-align: center;
  font-size: 7px;
  font-weight: bold;
  color: #ffffff;
  white-space: normal;
  vertical-align: middle;
}
        tbody td {
  font-size: 7px;
  color: #000;
  background: #fff;
}
        .sr-col { text-align: center; font-weight: bold; }
        .date-col { text-align: center; font-size: 6.5px; white-space: normal; }
        .bill-col { text-align: center; font-weight: bold; font-size: 6.5px; word-break: break-all; }
        .client-col { text-align: left; font-weight: 600; font-size: 7px; }
        .phone-col { text-align: center; font-size: 6.5px; word-break: break-all; }
        .item-col { text-align: center; font-size: 7px; }
        .purity-col { text-align: center; font-size: 7px; white-space: nowrap; }
        .number-col { text-align: right; font-family: monospace; font-size: 7px; white-space: nowrap; }
        .fine-col { font-weight: bold; }
        .pending-col { font-weight: bold; }
        tfoot {
  display: table-footer-group;
}
        tfoot tr {
  background: #fef3c7;
  color: #000;
  font-weight: bold;
  font-size: 7px;
}
        tfoot td {
  border: 1px solid #000;
  padding: 2px 3px;
  color: #000;
}
@media print {
  html, body {
    width: 210mm;
    min-height: 297mm;
    margin: 0!important;
    padding: 0!important;
    background: white!important;
  }
          body {
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
          .report-container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 1mm!important;
    margin: 0!important;
  }
          table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed!important;
    border-collapse: collapse!important;
  }
  th, td { padding: 1.5px 2px!important; }
          thead { display: table-header-group!important; }
          tfoot { display: table-footer-group!important; }
          tr { page-break-inside: avoid!important; break-inside: avoid!important; }
          thead tr, thead tr th {
    background: #785600!important;
    color: #ffffff!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
          tfoot tr {
    background: #fef3c7!important;
    color: #000!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
          :: -webkit-scrollbar { display: none!important; width: 0!important; height: 0!important; }
          * { scrollbar-width: none!important; -ms-overflow-style: none!important;
}
        }
</style>
  </head>
  <body>
  <div class="report-container" >
    <div class="header-section" >
      <div class="header-top" >
        <span class="invocation" > ${leftInvocation} </span>
          <span class="factory-name" > ${factoryName} </span>
            <span class="invocation" > ${rightInvocation} </span>
              </div>
              <div class="description" > ${Description} </div>
                <div class="proprietor" > ${proprietorName}&nbsp;&nbsp; <span class="phone" > ${phoneNumbers} </span></div>
                  <div class="header-line" > </div>
                    </div>

                    <div class="title-row" >
                      <div class="title-left" > </div>
                        <h2 class="report-title" > Billing Report </h2>
                          <div class="date-range" >
                            ${fromStr && toStr ? `From: ${fromStr}&nbsp;&nbsp;To: ${toStr}` : ''}
</div>
  </div>

  <table>
  <thead>
  <tr>
  <th>Sr </th>
  <th> Date & Time </th>
  <th> Bill No </th>
    <th> Client </th>
    <th> Phone </th>
    <th> Item </th>
    <th> Purity </th>
    <th> Fine Wt </th>
      <th> Wastage </th>
      <th> Receive </th>
      <th> Pending </th>
      </tr>
      </thead>
      <tbody>
            ${rows}
</tbody>
  <tfoot>
  <tr>
  <td colspan="7" style="border:1px solid #000;padding:2px 3px;text-align:right;color:#000;font-weight:bold;" > Total: </td>
    <td style="border:1px solid #000;padding:2px 3px;text-align:right;font-family:monospace;color:#000;font-weight:bold;" > ${formatNumberWithDecimals(totalFineAll)} </td>
      <td style="border:1px solid #000;padding:2px 3px;text-align:right;color:#000;font-weight:bold;" > -</td>
        <td style="border:1px solid #000;padding:2px 3px;text-align:right;font-family:monospace;color:#000;font-weight:bold;" > ${formatNumberWithDecimals(totalReceiveAll)} </td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:right;font-family:monospace;color:#000;font-weight:bold;" > ${formatNumberWithDecimals(totalPendingAll)} </td>
            </tr>
            </tfoot>
            </table>
            </div>
            </body>
            </html>
              `;

  try {
    const existingIframe = document.getElementById('print-report-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-report-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      iframe.remove();
      toast.error('Unable to prepare print');
      return;
    }

    iframeDoc.open();
    iframeDoc.write(reportHtml);
    iframeDoc.close();

    setTimeout(() => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        iframe.remove();
        return;
      }

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            iframe.remove();
          }
        }, 100);
      };

      printWindow.onafterprint = () => {
        cleanup();
      };

      printWindow.print();

      setTimeout(() => {
        cleanup();
      }, 60000);
    }, 700);
  } catch (error) {
    console.error('Print error:', error);
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.onafterprint = () => {
          setTimeout(() => {
            try {
              printWindow.close();
            } catch (e) {
              console.error('Unable to close print window:', e);
            }
          }, 100);
        };
        printWindow.print();
      }, 500);
    };
  }
};
