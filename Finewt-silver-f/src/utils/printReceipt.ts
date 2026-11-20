import toast from 'react-hot-toast';

export interface ReceiptPrintItem {
  item?: string;
  size?: string;
  purity?: number | string;
  grossWeight?: number | string;
  grossWt?: number | string;
  srp?: number | string;
  finWt?: number | string;
  fineWt?: number | string;
  fineWeight?: number | string;
  laborRate?: number | string;
}

export interface ReceiptPrintData {
  clientName?: string;
  phoneNumber?: string;
  dateTime?: string;
  date?: string | Date;
  dateStr?: string;
  items?: ReceiptPrintItem[];
  totalFineWt?: number | string;
  totalGrossWt?: number | string;
  totalSRP?: number | string;
  totalLabor?: number | string;
  receive?: number | string;
  customerWeight?: number | string;
  pending?: number | string;
  total?: number | string;
  totalBill?: number | string;
  remainingWeight?: number | string;
  dueBalance?: number | string;
  remainingBalance?: number | string;
  headerInfo?: any;
  /** Advance rows the customer gave (item, purity, gross, fine) */
  advanceItems?: { item?: string; purity?: number | string; grossWt?: number | string; fineWt?: number | string }[];
}

const format3Decimals = (value: number | string | undefined | null): string => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '0';
  return parseFloat(num.toFixed(3)).toString();
};

const format2Decimals = (value: number | string | undefined | null): string => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

export const printReceipt = (
  receiptData: ReceiptPrintData,
  headerDataQuery?: any,
) => {
  if (!receiptData) {
    toast.error('No receipt data to print');
    return;
  }

  const phoneNumber = receiptData.phoneNumber || 'N/A';

  let dateFormatted = receiptData.dateStr || receiptData.dateTime;
  if (!dateFormatted && receiptData.date) {
    const d = new Date(receiptData.date);
    dateFormatted = isNaN(d.getTime())
      ? String(receiptData.date)
      : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
  }
  if (!dateFormatted) {
    dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const items = receiptData.items || [];

  const totalFineWt =
    receiptData.totalFineWt !== undefined
      ? Number(receiptData.totalFineWt)
      : items.reduce((sum, i) => {
        const fine = i.finWt ?? i.fineWt ?? i.fineWeight ?? 0;
        return sum + Number(fine || 0);
      }, 0);

  const receive =
    receiptData.receive !== undefined
      ? Number(receiptData.receive)
      : receiptData.customerWeight !== undefined
        ? Number(receiptData.customerWeight)
        : 0;

  const dueBalance =
    receiptData.dueBalance !== undefined ? Number(receiptData.dueBalance) : 0;

  const remainingBalance =
    receiptData.totalBill !== undefined &&
      receiptData.totalBill !== null &&
      !isNaN(Number(receiptData.totalBill))
      ? Number(receiptData.totalBill)
      : receiptData.remainingBalance !== undefined &&
        receiptData.remainingBalance !== null &&
        !isNaN(Number(receiptData.remainingBalance))
        ? Number(receiptData.remainingBalance)
        : receiptData.remainingWeight !== undefined &&
          receiptData.remainingWeight !== null &&
          !isNaN(Number(receiptData.remainingWeight))
          ? Number(receiptData.remainingWeight)
          : receiptData.pending !== undefined &&
            receiptData.pending !== null &&
            !isNaN(Number(receiptData.pending))
            ? Number(receiptData.pending)
            : receiptData.total !== undefined &&
              receiptData.total !== null &&
              !isNaN(Number(receiptData.total))
              ? Number(receiptData.total)
              : 0;

  let itemsRows = '';
  items.forEach((item) => {
    const itemName = (item.item || '-') + ((item as any).productCode ? `<br/><span style="font-family:monospace;font-size:8px;">${(item as any).productCode}</span>` : '');
    const itemDesign = [(item as any).design, (item as any).stamp].filter(Boolean).join(' / ') || '-';
    const purity = format3Decimals(item.purity);
    const gross = format3Decimals(item.grossWeight ?? item.grossWt ?? 0);
    const srp = format2Decimals(item.srp ?? 0);
    const fine = format3Decimals(
      item.finWt ?? item.fineWt ?? item.fineWeight ?? 0,
    );
    const labor = (item as any).laborType === 'AMOUNT'
      ? `₹ ${format2Decimals(item.laborRate ?? 0)}`
      : `${format2Decimals(item.laborRate ?? 0)} G`;

    itemsRows += `
      <tr>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;color:#000;">${itemName}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;color:#000;">${itemDesign}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${purity}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${gross}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${srp}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-family:monospace;font-weight:bold;font-size:10px;color:#000;">${fine}</td>
        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${labor}</td>
      </tr>
    `;
  });

  const advanceRows = (receiptData.advanceItems || []).filter(
    (r) => r && (r.item || Number(r.grossWt) > 0 || Number(r.fineWt) > 0),
  );
  const cell = 'border:1px solid #d6c08a;padding:3px 6px;text-align:center;font-size:10px;color:#000;';
  const advanceHtml = advanceRows.length
    ? `<div style="flex:1;min-width:0;border:1px solid #d6c08a;border-radius:4px;overflow:hidden;">
        <div style="padding:3px 8px;font-size:10px;font-weight:bold;color:#785600;background:#f4f0e5 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;">ADVANCE</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="${cell}font-size:9px;">Sr</th><th style="${cell}font-size:9px;">Item</th><th style="${cell}font-size:9px;">Purity(%)</th><th style="${cell}font-size:9px;">Gross Wt(G)</th><th style="${cell}font-size:9px;">Fine Wt(G)</th>
          </tr></thead>
          <tbody>${advanceRows
            .map(
              (r, i) => `<tr><td style="${cell}">${i + 1}</td><td style="${cell}">${r.item || '-'}</td><td style="${cell}font-family:monospace;">${format3Decimals(r.purity)}</td><td style="${cell}font-family:monospace;">${format3Decimals(r.grossWt)}</td><td style="${cell}font-family:monospace;font-weight:bold;">${format3Decimals(r.fineWt)}</td></tr>`,
            )
            .join('')}
            <tr><td colspan="4" style="${cell}text-align:right;font-weight:bold;">Total Advance</td><td style="${cell}font-family:monospace;font-weight:bold;">${format3Decimals(advanceRows.reduce((s, r) => s + (Number(r.fineWt) || 0), 0))}</td></tr>
          </tbody>
        </table>
      </div>`
    : '';

  const headerSource = receiptData.headerInfo || headerDataQuery;
  const headerInfo =
    headerSource?.data?.data ||
    (headerSource?.data?.factoryName ? headerSource.data : headerSource || {});

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
    headerInfo.Description ||
    'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const DescriptionColor = headerInfo.DescriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '18px';
  const DescriptionFontSize = headerInfo.DescriptionFontSize
    ? `${headerInfo.DescriptionFontSize
    }px`
    : '10px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${headerInfo.proprietorFontSize}px`
    : '10px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${headerInfo.phoneFontSize}px`
    : '10px';

  const receiptHtml = `
  <!DOCTYPE html >
    <html>
    <head>
    <title>Receipt - ${receiptData.clientName || 'Client'} </title>
      <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
  font-family: Arial, Helvetica, sans-serif;
  background: #ffffff;
  padding: 0!important;
  margin: 0!important;
  display: block!important;
  -webkit-print-color-adjust: exact!important;
  print-color-adjust: exact!important;
}
          .receipt-container {
  width: 100%;
  max-width: 120mm;
  margin: 0 auto!important;
  background: #ffffff;
  padding: 2mm 3mm 5mm 3mm;
  box-sizing: border-box;
  color: #111111;
}
@page {
  size: portrait;
  margin: 2mm 3mm;
}
@media print {
            body {
    background: #ffffff!important;
    padding: 0!important;
    margin: 0!important;
    display: block!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
            .receipt-container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 2mm 3mm 3mm 3mm!important;
    margin: 0 auto!important;
    box-shadow: none!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
            table {
    width: 100% !important;
    page-break-inside: avoid!important;
    break-inside: avoid!important;
  }
            tr {
    page-break-inside: avoid!important;
    break-inside: avoid!important;
  }
}
</style>
  </head>
  <body>
  <div class="receipt-container" >
    <!--HEADER -->
      <div style="width:100%;text-align:center;" >
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:0;" >
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};white-space:nowrap;" >
            ${leftInvocation}
</span>
  <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};line-height:1.1;white-space:nowrap;" >
    ${factoryName}
</span>
  <span style="font-size:11px;font-weight:bold;color:${invocationColor};white-space:nowrap;" >
    ${rightInvocation}
</span>
  </div>

  <div style="margin:4px 0 0;font-size:${DescriptionFontSize};font-weight:bold;color:${DescriptionColor
}; line-height: 1.2; " >
    ${ Description }
</div>

  <div style="margin:4px 0 0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;" >
    ${ proprietorName }&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};" > ${ phoneNumbers } </span>
      </div>

      <div style="border-bottom:2px solid ${factoryNameColor};margin:6px 0 8px;" > </div>
        </div>

        <!--RECEIPT TITLE-->
          <div style="display:flex;align-items:center;justify-content:center;margin:0 0 6px;" >
            <h2 style="margin:0;text-align:center;font-size:15px;font-weight:bold;letter-spacing:2px;color:#111111;" >
              RECEIPT
              </h2>
              </div>

              <!--CLIENT & RECEIPT INFO-->
                <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;padding:0 2px;font-size:11px;line-height:1.4;" >
                  <div>
                  <span style="font-weight:bold;" > Client: </span> ${receiptData.clientName || 'N/A'}
                    <span style="margin-left:20px;font-weight:bold;" > Phone: </span> ${phoneNumber}
                      </div>
                      <div style="text-align:right;" >
                        <span style="font-weight:bold;" > Date: </span> ${dateFormatted}
                          </div>
                          </div>

                          <!--ITEM TABLE-->
                            <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0 0 8px;" >
                              <thead>
                              <tr style="background:#785600 !important;color:#ffffff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;" >
                                <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Item </th>
                                  <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Design / Stamp </th>
                                    <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Purity(%) </th>
                                      <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Gross Wt(G) </th>
                                        <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Wastage(G) </th>
                                          <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Fine Wt(G) </th>
                                            <th style="border:1px solid #785600;padding:4px 6px;text-align:center;font-size:9.5px;color:#ffffff;background:#785600 !important;" > Labour </th>
                                              </tr>
                                              </thead>
                                              <tbody>
              ${ itemsRows || '<tr><td colspan="7" style="text-align:center;padding:8px;border:1px solid #333;">No items</td></tr>' }
</tbody>
  </table>

  <!--PAYMENT SUMMARY-->
    <div style="display:flex;justify-content:flex-end;align-items:flex-start;gap:10px;margin-top:4px;" >
      ${advanceHtml}
      <div style="width:45%;min-width:210px;flex-shrink:0;border:1px solid #d6c08a;border-radius:4px;background:#fffdf7 !important;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;" >
        <div style="display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px dashed #dddddd;font-size:10px;" >
          <span style="font-weight:bold;color:#666666;" > Total Fine Wt </span>
            <span style="font-family:monospace;font-weight:bold;color:#111111;" > ${ format3Decimals(totalFineWt) } G </span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px dashed #dddddd;font-size:10px;" >
                <span style="font-weight:bold;color:#666666;" > Advance </span>
                  <span style="font-family:monospace;font-weight:bold;color:#111111;" > ${ format3Decimals(receive) } G </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px dashed #dddddd;font-size:10px;" >
                      <span style="font-weight:bold;color:#666666;" > Due Balance </span>
                        <span style="font-family:monospace;font-weight:bold;color:#111111;" > ${ format3Decimals(dueBalance) } G </span>
                          </div>
                          <div style="display:flex;justify-content:space-between;padding:4px 8px;background:#f4f0e5 !important;font-size:11px;-webkit-print-color-adjust:exact;print-color-adjust:exact;" >
                            <span style="font-weight:bold;color:#111111;" > Total Balance </span>
                              <span style="font-family:monospace;font-weight:bold;color:#785600;" > ${ format3Decimals(remainingBalance) } G </span>
                                </div>
                                </div>
                                </div>

                                <!--FOOTER -->
                                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:4px;border-top:1px dashed #aaaaaa;font-size:10px;line-height:1;color:#444444;" >
                                    <div>Contact For Support: 9511640351(FineWT) </div>
                                      </div>
                                      </div>
                                      </body>
                                      </html>
                                        `;

  // Use iframe approach to avoid extra window
  try {
    // Remove any existing print iframe
    const existingIframe = document.getElementById('print-receipt-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-receipt-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(receiptHtml);
      iframeDoc.close();

      // Print after content loads
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          // Fallback to window.open if iframe print fails
          const printWindow = window.open(
            '',
            '_blank',
            'width=1100,height=800',
          );
          if (printWindow) {
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
          } else {
            toast.error('Please allow pop-ups to print the receipt');
          }
        }
      }, 500);

      // Clean up iframe after printing
      const checkPrintDone = setInterval(() => {
        if (!iframe.contentWindow || iframe.contentWindow.closed) {
          clearInterval(checkPrintDone);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      }, 1000);

      // Force cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkPrintDone);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 10000);
    }
  } catch (error) {
    // Fallback to window.open
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    } else {
      toast.error('Please allow pop-ups to print the receipt');
    }
  }
};
