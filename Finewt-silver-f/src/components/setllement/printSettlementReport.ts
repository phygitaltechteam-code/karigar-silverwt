import { SettlementEntry, formatNumber } from './settlementUtils';
import toast from 'react-hot-toast';

interface PrintSettlementReportParams {
  filteredSettlements: SettlementEntry[];
  getpdfheaderdata: any;
  dateRange: Date[];
}

export const printSettlementReport = ({
  filteredSettlements,
  getpdfheaderdata,
  dateRange,
}: PrintSettlementReportParams) => {
  if (!filteredSettlements || filteredSettlements.length === 0) {
    toast.error('No records available to print');
    return;
  }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container-settlement';
  printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    padding: 0;
    z-index: 9999;
  `;
  document.body.appendChild(printContainer);

  const formatDateForDisplay = (date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const rows = filteredSettlements
    .map((entry, index) => {
      return `
        <tr>
          <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
          <td style="border:1px solid #000;padding:3px 5px;text-align:left;font-size:8px;color:#000;">${entry.clientName}</td>
          <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${entry.phoneNumber}</td>
          <td style="border:1px solid #000;padding:3px 5px;text-align:right;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumber(Math.abs(entry.goldBalance))}</td>
          <td style="border:1px solid #000;padding:3px 5px;text-align:center;font-size:8px;color:#000;">${entry.totalBills || 0}</td>
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
    : '20px';
  const DescriptionFontSize = headerInfo.DescriptionFontSize
    ? `${headerInfo.DescriptionFontSize}px`
    : '9px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${ headerInfo.proprietorFontSize } px`
    : '9px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${ headerInfo.phoneFontSize } px`
    : '9px';

  printContainer.innerHTML = `
  <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;" >
    <div>
    <div style="width:100%;text-align:center;margin:0;padding:1px 0;" >
      <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;" >
        <span style="font-size:11px;font-weight:bold;color:${invocationColor};" > ${ leftInvocation } </span>
          <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};" > ${ factoryName } </span>
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};" > ${ rightInvocation } </span>
              </div>
              <div style="margin:1px 0 0 0;padding:0;font-size:${DescriptionFontSize};font-weight:bold;color:${DescriptionColor};line-height:1.2;" >
                ${ Description }
</div>
  <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;" >
    ${ proprietorName }&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};" > ${ phoneNumbers } </span>
      </div>
      <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;" > </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;" >
          <div style="flex:1;" > </div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;" >
              Settlement Report
                </h2>
          ${
  dateRange && dateRange[0] && dateRange[1]
    ? `
          <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
            From: ${formatDateForDisplay(dateRange[0])} 
            &nbsp;&nbsp; To: ${formatDateForDisplay(dateRange[1])}
          </div>
          `
    : `<div style="flex:1;"></div>`
}
</div>

  <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;" >
    <thead>
    <tr style="background:#785600;color:white;font-weight:600;" >
      <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;" > Sr </th>
        <th style="border:1px solid #785600;padding:4px 5px;text-align:left;font-size:7.5px;" > Client Name </th>
          <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;" > Phone </th>
            <th style="border:1px solid #785600;padding:4px 5px;text-align:right;font-size:7.5px;" > Due Balance(g) </th>
              <th style="border:1px solid #785600;padding:4px 5px;text-align:center;font-size:7.5px;" > Total Bills </th>
                </tr>
                </thead>
                <tbody>
            ${ rows }
</tbody>
  </table>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:4px;border-top:1px dashed #000;font-size:9px;" >
    <span style="font-weight:bold;color:#000;" > Print Date: ${ new Date().toLocaleDateString('en-IN') } </span>
      <span style="font-weight:bold;color:#000;" > Authorized Signatory </span>
        </div>
        </div>
          `;

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
    doc.write(`
        <html >
        <head>
        <title>Settlement Report </title>
          <style>
@page {
  size: A4 portrait;
  margin: 4mm 5mm 4mm 5mm;
}
            body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact!important;
  print-color-adjust: exact!important;
}
</style>
  </head>
  <body>
          ${ printContainer.innerHTML }
</body>
  </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        const el = document.getElementById('print-container-settlement');
        if (el) document.body.removeChild(el);
      }, 1000);
    }, 500);
  }
};
