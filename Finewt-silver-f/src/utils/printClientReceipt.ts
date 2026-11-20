import toast from 'react-hot-toast';

export interface ClientReceiptItem {
  item?: string;
  size?: string;
  purity?: number | string;
  weight?: number | string;
  grossWeight?: number | string;
  fineWeight?: number | string;
  remark?: string;
}

export interface ClientReceiptData {
  clientName: string;
  phoneNumber?: string;
  address?: string;
  dateStr?: string;
  dateTime?: string;
  billNumber?: string;
  transactionType?: 'receive' | 'give' | 'bill' | 'settlement';
  amount?: number;
  previousBalance?: number;
  newBalance?: number;
  items?: ClientReceiptItem[];
  remark?: string;
  headerInfo?: any;
}

const formatNumber = (val: any, decimals: number = 3): string => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  const str = Math.abs(num).toFixed(decimals);
  return str.replace(/\.?0+$/, '');
};

export const generateClientReceiptHtml = (
  receiptData: ClientReceiptData,
  headerInfo?: any,
): string => {
  const headerSource = receiptData.headerInfo || headerInfo;
  const header =
    headerSource?.data?.data ||
    (headerSource?.data?.factoryName
      ? headerSource.data
      : headerSource || {}) ||
    {};

  const leftInvocation =
    header.leftInvocation || header.leftInovation || '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation =
    header.rightInvocation || header.rightInovation || '॥ श्री साई प्रसन्न ॥';
  const factoryName = header.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const Description =
    header.Description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = header.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = header.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

  const invocationColor = header.invocationColor || '#a84b20';
  const factoryNameColor = header.factoryNameColor || '#c43d5c';
  const DescriptionColor = header.DescriptionColor || '#8b451f';
  const proprietorColor = header.proprietorColor || '#a84b20';
  const phoneColor = header.phoneColor || '#a84b20';
  const factoryFontSize = header.factoryFontSize
    ? `${header.factoryFontSize}px`
    : '18px';
  const DescriptionFontSize = header.DescriptionFontSize
    ? `${header.DescriptionFontSize}px`
    : '10px';
  const proprietorFontSize = header.proprietorFontSize
    ? `${ header.proprietorFontSize } px`
    : '10px';
  const phoneFontSize = header.phoneFontSize
    ? `${ header.phoneFontSize } px`
    : '10px';

  let dateFormatted = receiptData.dateStr || receiptData.dateTime;
  if (!dateFormatted) {
    dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  const phoneNumber = receiptData.phoneNumber || 'N/A';

  return `
  <!DOCTYPE html >
    <html>
    <head>
    <title>Receipt - ${ receiptData.clientName || 'Client' } </title>
      <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
          * {
            margin: 0;
            padding: 0;
            box- sizing: border-box;
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
}
</style>
  </head>
  <body >
  <div class="receipt-container" >
    <!--HEADER -->
      <div style="width:100%;text-align:center;" >
        <div style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:0;" >
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};white-space:nowrap;" >
            ${ leftInvocation }
</span>
  <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};line-height:1.1;white-space:nowrap;" >
    ${ factoryName }
</span>
  <span style="font-size:11px;font-weight:bold;color:${invocationColor};white-space:nowrap;" >
    ${ rightInvocation }
</span>
  </div>

  <div style="margin:4px 0 0;font-size:${DescriptionFontSize};font-weight:bold;color:${DescriptionColor};line-height:1.2;" >
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
              GIVE RECEIPT
                </h2>
                </div>

                <!--CLIENT & RECEIPT INFO - ALL IN ONE LINE-->
                  <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;padding:0 2px;font-size:11px;line-height:1.4;" >
                    <div>
                    <span style="font-weight:bold;" > Client: </span> ${receiptData.clientName || 'N/A'}
                      <span style="margin-left:15px;font-weight:bold;" > Phone: </span> ${phoneNumber}
              ${ receiptData.address ? `<span style="margin-left:15px;font-weight:bold;">Address:</span> ${receiptData.address}` : '' }
              ${ receiptData.billNumber ? `<span style="margin-left:15px;font-weight:bold;">Bill No:</span> ${receiptData.billNumber}` : '' }
</div>
  <div style="text-align:right;white-space:nowrap;" >
    <span style="font-weight:bold;" > Date: </span> ${dateFormatted}
      </div>
      </div>

      <!--ITEMS TABLE(3 COLUMNS: ITEM, PURITY, FINE WT)-->
        ${
          (() => {
            const rawItems =
              receiptData.items && receiptData.items.length > 0
                ? receiptData.items
                : [
                  {
                    item: 'Gold',
                    purity: '100%',
                    fineWeight: receiptData.amount ?? 0,
                    weight: receiptData.amount ?? 0,
                  },
                ];

            const rowsHtml = rawItems
              .map((it) => {
                const itemName = it.item || 'Gold';
                const isGold =
                  itemName.trim().toLowerCase() === 'gold' ||
                  itemName.trim().toLowerCase().includes('gold');
                const purityStr =
                  it.purity != null && it.purity !== ''
                    ? String(it.purity).includes('%')
                      ? it.purity
                      : `${it.purity}%`
                    : isGold
                      ? '100%'
                      : '100%';
                const fineWtVal =
                  it.fineWeight ?? it.weight ?? receiptData.amount ?? 0;
                return `
                  <tr>
                    <td style="padding:4px 6px;text-align:left;border:1px solid #d6c08a;font-weight:bold;color:#111111;">
                      ${itemName}${it.size ? ` (${it.size})` : ''}
                    </td>
                    <td style="padding:4px 6px;text-align:center;border:1px solid #d6c08a;color:#111111;">
                      ${purityStr}
                    </td>
                    <td style="padding:4px 6px;text-align:right;border:1px solid #d6c08a;font-family:monospace;font-weight:bold;color:#785600;">
                      ${formatNumber(Math.abs(Number(fineWtVal)))} G
                    </td>
                  </tr>
                `;
              })
              .join('');

            return `
              <div style="margin:8px 0 6px 0;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #785600;">
                  <thead>
                    <tr style="background-color:#785600;color:#ffffff;">
                      <th style="padding:4px 6px;text-align:left;border:1px solid #785600;font-weight:bold;width:45%;">Item</th>
                      <th style="padding:4px 6px;text-align:center;border:1px solid #785600;font-weight:bold;width:25%;">Purity</th>
                      <th style="padding:4px 6px;text-align:right;border:1px solid #785600;font-weight:bold;width:30%;">Fine Wt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            `;
          })()
}

<!--PAYMENT SUMMARY CARD-->
  <div style="display:flex;justify-content:flex-end;margin-top:8px;" >
    <div style="width:45%;min-width:210px;border:1px solid #d6c08a;border-radius:4px;background:#fffdf7 !important;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;" >
      ${
  receiptData.previousBalance !== undefined
    ? `
                <div style="display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px dashed #dddddd;font-size:10px;">
                  <span style="font-weight:bold;color:#666666;">Previous Due Balance</span>
                  <span style="font-family:monospace;font-weight:bold;color:#111111;">${formatNumber(receiptData.previousBalance)} G</span>
                </div>
              `
    : ''
}
              ${
  receiptData.amount !== undefined
    ? `
                <div style="display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px dashed #dddddd;font-size:10px;">
                  <span style="font-weight:bold;color:#666666;">
                    ${receiptData.transactionType === 'give'
      ? 'Given Weight (+)'
      : receiptData.transactionType === 'receive'
        ? 'Received Weight (-)'
        : 'Total Weight'
    }
                  </span>
                  <span style="font-family:monospace;font-weight:bold;color:#111111;">
                    ${receiptData.transactionType === 'give' ? '+' : receiptData.transactionType === 'receive' ? '-' : ''}${formatNumber(Math.abs(Number(receiptData.amount || 0)))} G
                  </span>
                </div>
              `
    : ''
}
              ${
  receiptData.newBalance !== undefined
    ? `
                <div style="display:flex;justify-content:space-between;padding:4px 8px;background:#f4f0e5 !important;font-size:11px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                  <span style="font-weight:bold;color:#111111;">Total Balance</span>
                  <span style="font-family:monospace;font-weight:bold;color:#785600;">${formatNumber(receiptData.newBalance)} G</span>
                </div>
              `
    : ''
}
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
};

export const printClientReceipt = (
  receiptData: ClientReceiptData,
  headerInfo?: any,
) => {
  if (!receiptData) {
    toast.error('No receipt data to print');
    return;
  }

  const receiptHtml = generateClientReceiptHtml(receiptData, headerInfo);

  try {
    const existingIframe = document.getElementById(
      'print-client-receipt-iframe',
    );
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-client-receipt-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(receiptHtml);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print failed:', e);
        }
      }, 300);
    }
  } catch (error) {
    console.error('Print error:', error);
    toast.error('Failed to print receipt');
  }
};
