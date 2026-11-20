import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Search, Printer, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericDatePicker';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';
import { useGetHeader } from '@/lib/api/headerapi';
import { useGetStock } from '@/lib/api/stock';
import { useGetLossReport } from '@/lib/api/lossreport';
import {
  useGetStockLedgerReport,
  StockSummaryData,
  StockTableItem,
  StockMovementItem,
} from '@/lib/api/stockledger';
import GenericButton from '../Forms/Buttons/GenericButton';

const formatNumberDisplay = (value: unknown, decimals = 2): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatDateForDisplay = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateToISO = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StockLedgerReport() {
  const navigate = useNavigate();
  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);
  const getpdfheaderdata = useGetHeader();

  // Date filters (Defaulted to current app week range from admin settings)
  const initialDateRange = useMemo(() => {
    const range = getCurrentAppWeekRange();
    return { from: range.fromDate, to: range.toDate };
  }, []);

  const [fromDate, setFromDate] = useState<Date | null>(initialDateRange.from);
  const [toDate, setToDate] = useState<Date | null>(initialDateRange.to);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch API data from POST /admin/stock/report with fromDate and toDate
  const fromDateStr = useMemo(() => (isTrial && !isDateFilterActive) ? '2000-01-01' : formatDateToISO(fromDate), [fromDate, isTrial, isDateFilterActive]);
  const toDateStr = useMemo(() => (isTrial && !isDateFilterActive) ? '2100-12-31' : formatDateToISO(toDate), [toDate, isTrial, isDateFilterActive]);

  const {
    data: apiLedgerData,
    isLoading: isLedgerLoading,
    isFetching: isLedgerFetching,
    refetch: refetchLedger,
  } = useGetStockLedgerReport(fromDateStr, toDateStr);

  // Summary State
  const [summaryData, setSummaryData] = useState<StockSummaryData>({
    opening: {
      gold: 0.0,
      raw: 0.0,
      openingChain: 0.0,
      srp: 0.0,
      openingClientDue: 0.0,
      inward: 0.0,
    },
    closing: {
      gold: 0.0,
      raw: 0.0,
      closingChain: 0.0,
      closingClientDue: 0.0,
      loss: 0.0,
      outward: 0.0,
      profitLoss: 0.0,
    },
  });

  // Manufacturing Stock Items
  const [rawStockList, setRawStockList] = useState<StockTableItem[]>([]);

  // Chain Stock Items
  const [chainStockList, setChainStockList] = useState<StockTableItem[]>([]);

  // Client Items
  const [clientList, setClientList] = useState<StockTableItem[]>([]);

  // Inward Outward History Items
  const [movementList, setMovementList] = useState<StockMovementItem[]>([]);

  // Integrate API response from POST /admin/stock/report
  useEffect(() => {
    if (apiLedgerData) {
      const data = apiLedgerData?.data || apiLedgerData;

      // 1. Summary / Opening / Closing mapping (handles section1/section2 and overview)
      const sec1 = data?.section1;
      const sec2 = data?.section2;
      const ovOpening = data?.overview?.opening;
      const ovClosing = data?.overview?.closing;
      const sumOpening = data?.summary?.opening;
      const sumClosing = data?.summary?.closing;

      if (sec1 || sec2 || ovOpening || ovClosing || sumOpening || sumClosing) {
        setSummaryData({
          opening: {
            gold: Number(
              sec1?.openingGold ?? ovOpening?.gold ?? sumOpening?.gold ?? 0,
            ),
            raw: Number(
              sec1?.openingRaw ?? ovOpening?.raw ?? sumOpening?.raw ?? 0,
            ),
            openingChain: Number(
              sec1?.openingChain ??
              ovOpening?.chain ??
              sumOpening?.openingChain ??
              0,
            ),
            srp: Number(sec1?.srp ?? ovOpening?.srp ?? sumOpening?.srp ?? 0),
            openingClientDue: Number(
              sec1?.openingClientDue ??
              ovOpening?.clientDue ??
              sumOpening?.openingClientDue ??
              0,
            ),
            inward: Number(
              sec1?.inward ?? ovOpening?.inward ?? sumOpening?.inward ?? 0,
            ),
          },
          closing: {
            gold: Number(
              sec2?.closingGold ?? ovClosing?.gold ?? sumClosing?.gold ?? 0,
            ),
            raw: Number(
              sec2?.closingRaw ?? ovClosing?.raw ?? sumClosing?.raw ?? 0,
            ),
            closingChain: Number(
              sec2?.closingChain ??
              ovClosing?.chain ??
              sumClosing?.closingChain ??
              0,
            ),
            closingClientDue: Number(
              sec2?.closingClientDue ??
              ovClosing?.clientDue ??
              sumClosing?.closingClientDue ??
              0,
            ),
            loss: Number(
              sec2?.loss ?? ovClosing?.loss ?? sumClosing?.loss ?? 0,
            ),
            outward: Number(
              sec2?.outward ?? ovClosing?.outward ?? sumClosing?.outward ?? 0,
            ),
            profitLoss: Number(
              sec2?.profitLoss ??
              ovClosing?.profitLoss ??
              data?.summary?.profitLoss ??
              0,
            ),
          },
        });
      }

      // 2. Chain Stock mapping (from section3.chainStock or chainStock)
      const chainStock = data?.section3?.chainStock || data?.chainStock;
      if (Array.isArray(chainStock) && chainStock.length > 0) {
        setChainStockList(
          chainStock.map((item: any, idx: number) => ({
            id: item.id || `chain-${idx}`,
            name: `${item.name || 'Chain'}${item.size ? ` (${item.size})` : ''}${item.purity ? ` ${item.purity}%` : ''}`,
            opening: Number(item.opening ?? item.openingFine ?? 0),
            closing: Number(item.closing ?? item.closingFine ?? 0),
            due: Number(
              item.difference ?? item.differenceFine ?? item.closing ?? 0,
            ),
          })),
        );
      }

      // 3. Raw Stock mapping (from section3.rawStock, rawStock, or items without size/Gold)
      const rawStock = data?.section3?.rawStock || data?.rawStock;
      const allItems = data?.section3?.items || data?.items;
      if (Array.isArray(rawStock) && rawStock.length > 0) {
        setRawStockList(
          rawStock.map((item: any, idx: number) => ({
            id: item.id || `raw-${idx}`,
            name: item.name || item.item || item.itemName || 'GOLD',
            opening: Number(item.opening ?? item.openingStock ?? 0),
            closing: Number(
              item.closing ?? item.closingStock ?? item.weight ?? 0,
            ),
            due: Number(item.due ?? item.difference ?? item.closing ?? 0),
          })),
        );
      } else if (Array.isArray(allItems) && allItems.length > 0) {
        const rawItems = allItems.filter(
          (i: any) => !i.sizeName || i.itemName?.toUpperCase() === 'GOLD',
        );
        if (rawItems.length > 0) {
          setRawStockList(
            rawItems.map((item: any, idx: number) => ({
              id: item.stockId || item.itemId || item.id || `raw-${idx}`,
              name: item.itemName || item.name || 'GOLD',
              opening: Number(
                item.openingStock ?? item.openingStockFine ?? item.opening ?? 0,
              ),
              closing: Number(
                item.closingStock ?? item.closingStockFine ?? item.closing ?? 0,
              ),
              due: Number(
                item.netChange ?? item.netChangeFine ?? item.closingStock ?? 0,
              ),
            })),
          );
        }
      }

      // 4. Client mapping (from section3.clients or clients)
      const clients = data?.section3?.clients || data?.clients || data?.client;
      if (Array.isArray(clients) && clients.length > 0) {
        setClientList(
          clients.map((item: any, idx: number) => ({
            id: item.id || `client-${idx}`,
            name: item.name || item.clientName || 'Client',
            opening: Number(item.opening ?? 0),
            closing: Number(item.closing ?? 0),
            difference: Number(item.difference ?? 0),
          })),
        );
      } else {
        setClientList([]);
      }

      // 5. Stock Movement mapping (paired from section3.stockMovement inwards and outwards)
      const stockMovement =
        data?.section3?.stockMovement || data?.stockMovement;
      if (stockMovement) {
        const inwards = Array.isArray(stockMovement.inwards)
          ? stockMovement.inwards
          : [];
        const outwards = Array.isArray(stockMovement.outwards)
          ? stockMovement.outwards
          : [];
        const maxLen = Math.max(inwards.length, outwards.length);

        if (maxLen > 0) {
          const movementRows: StockMovementItem[] = [];
          for (let i = 0; i < maxLen; i++) {
            const inItem = inwards[i];
            const outItem = outwards[i];
            const inVal =
              inItem && (inItem.fineWeight != null || inItem.weight != null)
                ? Number(inItem.fineWeight ?? inItem.weight ?? 0)
                : null;
            const outVal =
              outItem && (outItem.fineWeight != null || outItem.weight != null)
                ? Number(outItem.fineWeight ?? outItem.weight ?? 0)
                : null;
            movementRows.push({
              id: inItem?.id || outItem?.id || `mov-${i}`,
              inwardName: inItem
                ? `${inItem.name}${inItem.sizeName ? ` (${inItem.sizeName})` : ''}`
                : '',
              inwardSubtext: inItem?.remark || '',
              inward: inVal !== null && inVal > 0 ? inVal : null,
              outwardName: outItem
                ? `${outItem.name}${outItem.sizeName ? ` (${outItem.sizeName})` : ''}`
                : '',
              outwardSubtext: outItem?.remark || '',
              outward: outVal !== null && outVal > 0 ? outVal : null,
            });
          }
          setMovementList(movementRows);
        } else {
          setMovementList([]);
        }
      } else {
        setMovementList([]);
      }
    }
  }, [apiLedgerData]);

  // Date change handlers
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(0, 0, 0, 0);
      setFromDate(selected);
    } else {
      setFromDate(null);
    }
  };

  const handleToDateChange = (selectedDates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(23, 59, 59, 999);
      setToDate(selected);
    } else {
      setToDate(null);
    }
  };

  // Search filtering
  const query = searchTerm.toLowerCase().trim();

  const filteredRawStock = useMemo(() => {
    if (!query) return rawStockList;
    return rawStockList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.due !== undefined && item.due.toString().includes(query)),
    );
  }, [rawStockList, query]);

  const filteredChainStock = useMemo(() => {
    if (!query) return chainStockList;
    return chainStockList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.due !== undefined && item.due.toString().includes(query)),
    );
  }, [chainStockList, query]);

  const filteredClient = useMemo(() => {
    if (!query) return clientList;
    return clientList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.opening.toString().includes(query) ||
        item.closing.toString().includes(query) ||
        (item.difference !== undefined &&
          item.difference.toString().includes(query)),
    );
  }, [clientList, query]);

  const filteredMovement = useMemo(() => {
    if (!query) return movementList;
    return movementList.filter(
      (item) =>
        item.inwardName.toLowerCase().includes(query) ||
        (item.inwardSubtext &&
          item.inwardSubtext.toLowerCase().includes(query)) ||
        item.inward.toString().includes(query) ||
        item.outwardName.toLowerCase().includes(query) ||
        (item.outwardSubtext &&
          item.outwardSubtext.toLowerCase().includes(query)) ||
        item.outward.toString().includes(query),
    );
  }, [movementList, query]);

  // Date range formatted label for display
  const dateRangeLabel = useMemo(() => {
    if (fromDate && toDate) {
      return `${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
    }
    if (fromDate) {
      return `From: ${formatDateForDisplay(fromDate)}`;
    }
    if (toDate) {
      return `To: ${formatDateForDisplay(toDate)}`;
    }
    return formatDateForDisplay(new Date());
  }, [fromDate, toDate]);

  const handlePrint = () => {
    // ============================================================
    // REMOVE EXISTING PRINT CONTAINER / STYLE
    // ============================================================

    const existingContainer = document.getElementById(
      'stock-ledger-print-container',
    );

    if (existingContainer) {
      existingContainer.remove();
    }

    const existingStyle = document.getElementById('stock-ledger-print-style');

    if (existingStyle) {
      existingStyle.remove();
    }

    // ============================================================
    // CREATE PRINT CONTAINER
    // ============================================================

    const printContainer = document.createElement('div');

    printContainer.id = 'stock-ledger-print-container';

    printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    padding: 0;
    margin: 0 auto;
    z-index: 999999;
    overflow: visible;
    display: block;
    box-sizing: border-box;
  `;

    document.body.appendChild(printContainer);

    // ============================================================
    // HEADER DATA
    // ============================================================

    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});

    const leftInvocation = headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';

    const rightInvocation =
      headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';

    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';

    const Description_detailed =
      headerInfo.Description_detailed ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';

    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';

    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

    const invocationColor = headerInfo.invocationColor || '#a84b20';

    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';

    const DescriptioColor = headerInfo.DescriptionColor || '#8b451f';

    const proprietorColor = headerInfo.proprietorColor || '#a84b20';

    const phoneColor = headerInfo.phoneColor || '#a84b20';

    // ============================================================
    // TOTALS
    // ============================================================

    const rawTotalOpening = filteredRawStock.reduce(
      (sum, item) => sum + (item.opening || 0),
      0,
    );

    const rawTotalClosing = filteredRawStock.reduce(
      (sum, item) => sum + (item.closing || 0),
      0,
    );

    const rawTotalDifference = filteredRawStock.reduce(
      (sum, item) => sum + (item.due || 0),
      0,
    );

    const chainTotalOpening = filteredChainStock.reduce(
      (sum, item) => sum + (item.opening || 0),
      0,
    );

    const chainTotalClosing = filteredChainStock.reduce(
      (sum, item) => sum + (item.closing || 0),
      0,
    );

    const chainTotalDifference = filteredChainStock.reduce(
      (sum, item) => sum + (item.due || 0),
      0,
    );

    const clientTotalOpening = filteredClient.reduce(
      (sum, item) => sum + (item.opening || 0),
      0,
    );

    const clientTotalClosing = filteredClient.reduce(
      (sum, item) => sum + (item.closing || 0),
      0,
    );

    const clientTotalDifference = filteredClient.reduce(
      (sum, item) => sum + (item.difference || 0),
      0,
    );

    // ============================================================
    // MANUFACTURING STOCK ROWS
    // ============================================================

    const rawRows =
      filteredRawStock.length > 0
        ? filteredRawStock
          .map(
            (item) => `
              <tr class="data-row">
                <td class="center-cell name-cell">${item.name}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.opening,
            )}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.closing,
            )}</td>
                <td class="center-cell number-cell bold-cell">${formatNumberDisplay(
              item.due,
            )}</td>
              </tr>
            `,
          )
          .join('')
        : `
          <tr>
            <td colspan="4" class="no-data">No data</td>
          </tr>
        `;

    // ============================================================
    // CHAIN STOCK ROWS
    // ============================================================

    const chainRows =
      filteredChainStock.length > 0
        ? filteredChainStock
          .map(
            (item) => `
              <tr class="data-row">
                <td class="center-cell name-cell">${item.name}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.opening,
            )}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.closing,
            )}</td>
                <td class="center-cell number-cell bold-cell">${formatNumberDisplay(
              item.due,
            )}</td>
              </tr>
            `,
          )
          .join('')
        : `
          <tr>
            <td colspan="4" class="no-data">No data</td>
          </tr>
        `;

    // ============================================================
    // CLIENT ROWS
    // ============================================================

    const clientRows =
      filteredClient.length > 0
        ? filteredClient
          .map(
            (item) => `
              <tr class="data-row">
                <td class="center-cell name-cell">${item.name}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.opening,
            )}</td>
                <td class="center-cell number-cell">${formatNumberDisplay(
              item.closing,
            )}</td>
                <td class="center-cell number-cell bold-cell">${formatNumberDisplay(
              item.difference,
            )}</td>
              </tr>
            `,
          )
          .join('')
        : `
          <tr>
            <td colspan="4" class="no-data">No data</td>
          </tr>
        `;

    // ============================================================
    // INWARD / OUTWARD HISTORY ROWS
    // ============================================================

    const movementRows =
      filteredMovement.length > 0
        ? filteredMovement
          .map(
            (item) => `
              <tr class="movement-row">
                <td class="movement-name center-cell">
                  <div class="movement-main">
                    ${item.inwardName || '-'}
                  </div>

                  ${item.inwardSubtext
                ? `<div class="movement-subtext">${item.inwardSubtext}</div>`
                : ''
              }
                </td>

                <td class="movement-number center-cell inward-number">
                  ${item.inwardName && item.inward != null && item.inward > 0
                ? formatNumberDisplay(item.inward)
                : '-'
              }
                </td>

                <td class="movement-name center-cell">
                  <div class="movement-main">
                    ${item.outwardName || '-'}
                  </div>

                  ${item.outwardSubtext
                ? `<div class="movement-subtext">${item.outwardSubtext}</div>`
                : ''
              }
                </td>

                <td class="movement-number center-cell outward-number">
                  ${item.outwardName && item.outward != null && item.outward > 0
                ? formatNumberDisplay(item.outward)
                : '-'
              }
                </td>
              </tr>
            `,
          )
          .join('')
        : `
          <tr>
            <td colspan="4" class="no-data">No data</td>
          </tr>
        `;

    // ============================================================
    // COMPLETE PRINT HTML
    // ============================================================

    printContainer.innerHTML = `
    <div class="print-page">

      <!-- COMPANY HEADER -->
      <div class="company-header">

        <div class="company-header-row">

          <span class="invocation">
            ${leftInvocation}
          </span>

          <span class="factory-name">
            ${factoryName}
          </span>

          <span class="invocation">
            ${rightInvocation}
          </span>

        </div>

        <div class="description">
          ${Description_detailed}
        </div>

        <div class="proprietor">
          ${proprietorName}
          &nbsp;&nbsp;
          <span class="phone">
            ${phoneNumbers}
          </span>
        </div>

        <div class="header-line"></div>

      </div>

      <!-- REPORT TITLE -->
      <div class="report-title">

        <div class="report-title-main">
          BUSINESS 360 REPORT
        </div>

        <div class="report-date">
          Date: ${dateRangeLabel}
        </div>

      </div>

      <!-- SUMMARY SECTION -->
      <div class="summary-section">

        <table class="summary-table">

          <thead>
            <tr>
              <th class="summary-heading">
                OPENING
              </th>

              <th class="summary-heading">
                CLOSING
              </th>
            </tr>
          </thead>

          <tbody>

            <tr>

              <!-- OPENING -->
              <td class="summary-column">

                <table class="summary-inner-table">

                  <tbody>

                    <tr>
                      <td class="summary-label">
                        Gold Stock
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.opening.gold)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Manufacturing
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.opening.raw)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Chain Stock
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.opening.openingChain)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Client Due
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(
      summaryData.opening.openingClientDue,
    )}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        SRP
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.opening.srp)}
                      </td>
                    </tr>

                    <tr class="summary-total-row">

                      <td class="summary-label bold">
                        Inward
                      </td>

                      <td class="summary-value green bold">
                        ${formatNumberDisplay(summaryData.opening.inward)}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </td>

              <!-- CLOSING -->
              <td class="summary-column">

                <table class="summary-inner-table">

                  <tbody>

                    <tr>
                      <td class="summary-label">
                        Gold Stock
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.closing.gold)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Manufacturing
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.closing.raw)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Chain Stock
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.closing.closingChain)}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Client Due
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(
      summaryData.closing.closingClientDue,
    )}
                      </td>
                    </tr>

                    <tr>
                      <td class="summary-label">
                        Loss
                      </td>

                      <td class="summary-value">
                        ${formatNumberDisplay(summaryData.closing.loss)}
                      </td>
                    </tr>

                    <tr class="summary-total-row">

                      <td class="summary-label bold">
                        Outward
                      </td>

                      <td class="summary-value orange bold">
                        ${formatNumberDisplay(summaryData.closing.outward)}
                      </td>

                    </tr>

                    <tr class="profit-loss-row">

                      <td class="summary-label profit">
                        Profit / Loss
                      </td>

                      <td class="summary-value profit">
                        ${formatNumberDisplay(
      summaryData.closing.profitLoss ?? 0,
    )}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <!-- THREE STOCK TABLES -->
      <div class="three-stock-wrapper">

        <!-- MANUFACTURING STOCK -->
        <div class="stock-column stock-column-left">

          <div class="stock-title">
            MANUFACTURING STOCK
          </div>

          <table class="stock-table">

            <thead>
              <tr>

                <th class="stock-header">
                  Name
                </th>

                <th class="stock-header">
                  Opening
                </th>

                <th class="stock-header">
                  Closing
                </th>

                <th class="stock-header">
                  Diff
                </th>

              </tr>
            </thead>

            <tbody>

              ${rawRows}

              <tr class="total-row">

                <td class="center-cell total-cell">
                  TOTAL
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(rawTotalOpening)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(rawTotalClosing)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(rawTotalDifference)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

        <!-- CHAIN STOCK -->
        <div class="stock-column stock-column-middle">

          <div class="stock-title">
            CHAIN STOCK
          </div>

          <table class="stock-table">

            <thead>
              <tr>

                <th class="stock-header">
                  Name
                </th>

                <th class="stock-header">
                  Opening
                </th>

                <th class="stock-header">
                  Closing
                </th>

                <th class="stock-header">
                  Diff
                </th>

              </tr>
            </thead>

            <tbody>

              ${chainRows}

              <tr class="total-row">

                <td class="center-cell total-cell">
                  TOTAL
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(chainTotalOpening)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(chainTotalClosing)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(chainTotalDifference)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

        <!-- CLIENT -->
        <div class="stock-column stock-column-right">

          <div class="stock-title">
            CLIENT
          </div>

          <table class="stock-table">

            <thead>
              <tr>

                <th class="stock-header">
                  Name
                </th>

                <th class="stock-header">
                  Opening
                </th>

                <th class="stock-header">
                  Closing
                </th>

                <th class="stock-header">
                  Diff
                </th>

              </tr>
            </thead>

            <tbody>

              ${clientRows}

              <tr class="total-row">

                <td class="center-cell total-cell">
                  TOTAL
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(clientTotalOpening)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(clientTotalClosing)}
                </td>

                <td class="center-cell total-cell">
                  ${formatNumberDisplay(clientTotalDifference)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      <!-- INWARD / OUTWARD HISTORY -->
      <div class="movement-section">

        <div class="movement-title">
          INWARD OUTWARD HISTORY
        </div>

        <table class="movement-table">

          <thead>

            <tr>

              <th class="movement-header movement-inward-name">
                INWARD NAME
              </th>

              <th class="movement-header movement-inward-value">
                INWARD
              </th>

              <th class="movement-header movement-outward-name">
                OUTWARD NAME
              </th>

              <th class="movement-header movement-outward-value">
                OUTWARD
              </th>

            </tr>

          </thead>

          <tbody>

            ${movementRows}

          </tbody>

        </table>

      </div>

    </div>
  `;

    // ============================================================
    // PRINT STYLE
    // ============================================================

    const style = document.createElement('style');

    style.id = 'stock-ledger-print-style';

    style.textContent = `
    /* ==========================================================
       A4 PAGE
    ========================================================== */

    @page {
      size: A4 portrait;
      margin: 3mm;
    }

    /* ==========================================================
       PRINT CONTAINER
    ========================================================== */

    #stock-ledger-print-container {
      width: 100%;
      min-height: 100%;
      height: auto;
      background: white;
      overflow: visible;
      box-sizing: border-box;
    }

    #stock-ledger-print-container * {
      box-sizing: border-box;
    }

    /* ==========================================================
       MAIN PAGE
    ========================================================== */

    .print-page {
      width: 100%;
      max-width: 210mm;

      /*
       * Same type of spacing as Loss Report.
       * LEFT padding is reduced so right-side columns
       * get more available space.
       */
      margin: 0 auto;
      padding: 3mm 2mm 3mm 1mm;

      background: white;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9px;
      line-height: 1.15;
      box-sizing: border-box;
    }

    /* ==========================================================
       COMPANY HEADER
    ========================================================== */

    .company-header {
      width: 100%;
      text-align: center;
      margin-bottom: 5px;
    }

    .company-header-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invocation {
      font-size: 10px;
      font-weight: bold;
      color: ${invocationColor};
      white-space: nowrap;
    }

    .factory-name {
      font-size: 18px;
      font-weight: bold;
      color: ${factoryNameColor};
      white-space: nowrap;
    }

    .description {
      margin-top: 2px;
      font-size: 9px;
      font-weight: bold;
      color: ${DescriptioColor}
  };
} 

    .proprietor {
  margin-top: 2px;
  font-size: 9px;
  font-weight: bold;
  color: ${ proprietorColor };
}

    .phone {
  color: ${ phoneColor };
}

    .header-line {
  border-bottom: 2px solid ${ factoryNameColor };
  margin: 4px 0 5px 0;
}

    /* ==========================================================
       REPORT TITLE
    ========================================================== */

    .report-title {
  width: 100%;
  text-align: center;
  margin-bottom: 6px;
}

    .report-title-main {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #000;
}

    .report-date {
  margin-top: 1px;
  font-size: 10px;
  font-weight: bold;
  color: #444;
}

    /* ==========================================================
       SUMMARY
    ========================================================== */

    .summary-section {
  width: 100%;
  margin-bottom: 7px;
  page -break-inside: avoid;
  break-inside: avoid;
}

    .summary-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 8px;
}

    .summary-table th,
    .summary-table td {
  border: 1px solid #ccc;
}

    .summary-heading {
  width: 50%;
  padding: 3px 4px;
  background: #785600!important;
  color: white!important;
  text-align: center;
  font-weight: 600;
  font-size: 8.5px;
  border: 1px solid #785600!important;
}

    .summary-column {
  padding: 0;
  vertical-align: top;
}

    .summary-inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
}

    .summary-inner-table td {
  border: 0;
  border-bottom: 1px solid #d3c4af;
}

    .summary-inner-table tr:last-child td {
  border-bottom: 0;
}

    .summary-label {
  padding: 3px 4px;
  color: #000;
  text-align: left;
  font-size: 8px;
}

    .summary-value {
  padding: 3px 4px;
  color: #000;
  text-align: center;
  font-family: monospace;
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

    .summary-total-row td {
  border-top: 1px solid #785600!important;
  background: #fff8e6;
  font-weight: bold;
}

    .profit-loss-row td {
  border-top: 1px solid #785600!important;
  background: #fff8e6;
  font-weight: bold;
}

    .bold {
  font-weight: bold;
}

    .green {
  color: #15803d!important;
}

    .orange {
  color: #b91c1c!important;
}

    .profit {
  color: #15803d!important;
  font-weight: bold;
}

    /* ==========================================================
       THREE STOCK TABLES
    ========================================================== */

    .three-stock-wrapper {
  display: table;
  width: 100%;
  margin-bottom: 7px;
  table-layout: fixed;
  page -break-inside: auto;
  break-inside: auto;
}

    .stock-column {
  display: table-cell;
  vertical-align: top;
  width: 33.333%;
}

    .stock-column-left {
  padding-right: 4px;
  border-right: 1px solid #d3c4af;
}

    .stock-column-middle {
  padding-left: 4px;
  padding-right: 4px;
  border-right: 1px solid #d3c4af;
}

    .stock-column-right {
  padding-left: 4px;
}

    .stock-title {
  text-align: center;
  margin: 3px 0 0 0;
  font-weight: bold;
  font-size: 9.5px;
  letter-spacing: 0.5px;
  color: #785600;
  background: #fff8e6;
  padding: 2.5px 4px;
  border: 1px solid #785600;
  border-bottom: none;
}

    /* ==========================================================
       STOCK TABLE
    ========================================================== */

    .stock-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 8px;
  border: 1px solid #785600;
  page -break-inside: auto;
  break-inside: auto;
}

    .stock-table thead {
  display: table-header-group;
}

    .stock-table tbody {
  display: table-row-group;
}

    .stock-table tr {
  page -break-inside: avoid;
  break-inside: avoid;
}

    .stock-table th,
    .stock-table td {
  border: 1px solid #d3c4af;
}

    .stock-header {
  padding: 3px;
  text-align: center;
  font-weight: 600;
  color: white!important;
  font-size: 8px;
  background: #785600!important;
  border: 1px solid #785600!important;
}

    .center-cell {
  text-align: center!important;
  vertical-align: middle;
}

    .name-cell {
  padding: 3px;
  color: #000;
  font-size: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

    .number-cell {
  padding: 3px;
  color: #000;
  font-size: 8px;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
}

    .bold-cell {
  font-weight: bold;
}

    .data-row {
  page -break-inside: avoid;
  break-inside: avoid;
}

    .total-row {
  page -break-inside: avoid;
  break-inside: avoid;
  background: #fff8e6;
  font-weight: bold;
  border-top: 1px solid #785600!important;
}

    .total-cell {
  padding: 3px;
  color: #000;
  font-size: 8px;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
  font-weight: bold;
}

    /* ==========================================================
       MOVEMENT HISTORY
    ========================================================== */

    .movement-section {
  width: 100%;
  margin-top: 8px;

  /*
   * IMPORTANT:
   * Do NOT prevent this section from splitting.
   * This allows the history table to continue
   * naturally onto Page 2, Page 3, etc.
   */
  page -break-inside: auto!important;
  break-inside: auto!important;
}

    .movement-title {
  text-align: center;
  margin: 6px 0 0 0;
  font-weight: bold;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: #785600;
  background: #fff8e6;
  border: 1px solid #785600;
  border-bottom: none;
  padding: 3px 4px;
  page -break-after: avoid;
  break-after: avoid;
}

    .movement-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 8px;
  border: 1px solid #785600;

  /*
   * Allow table to continue across pages.
   */
  page -break-inside: auto!important;
  break-inside: auto!important;
}

    /*
     * Repeat the history header on every printed page.
     */
    .movement-table thead {
  display: table-header-group!important;
}

    .movement-table tbody {
  display: table-row-group!important;
}

    /*
     * Keep individual history rows together.
     */
    .movement-table tr {
  page -break-inside: avoid!important;
  break-inside: avoid!important;
}

    .movement-table th,
    .movement-table td {
  border: 1px solid #d3c4af;
}

    .movement-header {
  padding: 3px 4px;
  text-align: center;
  font-weight: 600;
  color: white!important;
  font-size: 8px;
  background: #785600!important;
  border: 1px solid #785600!important;
}

    .movement-inward-name {
  width: 35%;
}

    .movement-inward-value {
  width: 15%;
}

    .movement-outward-name {
  width: 35%;
}

    .movement-outward-value {
  width: 15%;
}

    .movement-row {
  page -break-inside: avoid!important;
  break-inside: avoid!important;
}

    .movement-name {
  padding: 3px 4px;
  width: 35%;
  font-size: 8px;
  text-align: center!important;
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

    .movement-number {
  padding: 3px 4px;
  width: 15%;
  font-family: monospace;
  font-size: 8px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  text-align: center!important;
  vertical-align: middle;
}

    .movement-main {
  font-weight: bold;
  color: #000;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

    .movement-subtext {
  margin-top: 1px;
  font-size: 7px;
  color: #666;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

    .inward-number {
  color: #15803d;
}

    .outward-number {
  color: #b91c1c;
}

    .no-data {
  padding: 4px;
  text-align: center!important;
  color: #666;
  font-size: 9px;
}

/* ==========================================================
   PRINT MEDIA
========================================================== */

@media print {

      html {
    width: 100% !important;
    height: auto!important;
    margin: 0!important;
    padding: 0!important;
    overflow: visible!important;
  }

      body {
    width: 100% !important;
    height: auto!important;
    min-height: 0!important;
    margin: 0!important;
    padding: 0!important;
    overflow: visible!important;
    background: white!important;
  }

  /*
   * Hide the complete React application.
   * Only our print container is visible.
   */
  body > *: not(#stock-ledger-print-container) {
    display: none!important;
  }

  #stock-ledger-print-container {
    display: block!important;

    position: absolute!important;
    left: 0!important;
    top: 0!important;

    width: 100% !important;
    height: auto!important;
    min-height: 0!important;

    margin: 0!important;
    padding: 0!important;

    overflow: visible!important;

    background: white!important;
    visibility: visible!important;
    z-index: 999999!important;

    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }

  #stock-ledger-print-container,
    #stock-ledger-print-container * {
      visibility: visible!important;
    }

      /*
       * Same centered A4 layout as Loss Report.
       * LEFT = 1mm
       * RIGHT = 2mm
       */
      .print-page {
    width: 100% !important;
    max-width: 210mm!important;

    margin: 0 auto!important;

    padding: 3mm 2mm 3mm 1mm!important;

    box-sizing: border-box!important;
    background: white!important;
  }

  #stock-ledger-print-container,
      .print-page {
    overflow: visible!important;
  }

      /*
       * Remove all browser scrollbars.
       */
      :: -webkit-scrollbar {
    display: none!important;
    width: 0!important;
    height: 0!important;
  }

      * {
    scrollbar- width: none!important;
  -ms-overflow-style: none!important;
}

      /* ========================================================
         PAGINATION
      ======================================================== */

      /*
       * HISTORY TABLE CAN CONTINUE TO NEXT PAGE.
       */
      .movement-section {
  page -break-inside: auto!important;
  break-inside: auto!important;
}

      .movement-table {
  page -break-inside: auto!important;
  break-inside: auto!important;
  width: 100% !important;
}

      /*
       * REPEAT HISTORY HEADER ON EVERY PAGE.
       */
      .movement-table thead {
  display: table-header-group!important;
}

      /*
       * DO NOT SPLIT INDIVIDUAL ROWS.
       */
      .movement-table tbody tr {
  page -break-inside: avoid!important;
  break-inside: avoid!important;
}

      /* ========================================================
         STOCK TABLE PAGINATION
      ======================================================== */

      .stock-table {
  page -break-inside: auto!important;
  break-inside: auto!important;
  width: 100% !important;
}

      .stock-table thead {
  display: table-header-group!important;
}

      .stock-table tbody tr {
  page -break-inside: avoid!important;
  break-inside: avoid!important;
}

      /* ========================================================
         SUMMARY
      ======================================================== */

      .summary-section {
  page -break-inside: avoid!important;
  break-inside: avoid!important;
}

/* ========================================================
   NO BODY PSEUDO ELEMENTS
======================================================== */

body:: before,
  body::after {
  display: none!important;
  content: none!important;
}
    }
`;

    document.head.appendChild(style);

    // ============================================================
    // CLEANUP
    // ============================================================

    let cleanedUp = false;

    const cleanupPrint = () => {
      if (cleanedUp) return;

      cleanedUp = true;

      if (document.body.contains(printContainer)) {
        printContainer.remove();
      }

      if (document.head.contains(style)) {
        style.remove();
      }

      window.onafterprint = null;
    };

    // ============================================================
    // TRIGGER BROWSER PRINT PREVIEW
    // ============================================================

    window.onafterprint = cleanupPrint;

    setTimeout(() => {
      window.focus();
      window.print();
    }, 300);
  };
  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Top Navigation / Filter Bar */}
      <div className="sticky top-0 z-20 border-b border-[#d3c4af]/20 bg-[#f9f9f7]/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 lg:flex-row">
          {/* Back & Title */}
          <div className="flex w-full min-w-0 items-center gap-2.5 lg:w-auto">
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/40 dark:bg-slate-700" />
            <div>
              <h1 className="font-headline text-xl font-black italic tracking-tight text-[#1a1a2e] dark:text-white sm:text-2xl lg:text-3xl">
                Business 360 Report
              </h1>
            </div>
          </div>

          {/* Right Controls: Search, From Date, To Date, Print Button */}
          <div className="flex w-full flex-wrap items-center justify-end gap-2.5 lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:py-2"
              />
            </div>

            {/* From Date */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
              <span className="hidden text-xs font-bold uppercase text-[#785600] dark:text-[#b8860b] lg:inline">
                From:
              </span>
              <GenericDatePicker
                id="stock-ledger-from-date"
                placeholder="From Date"
                initialDate={fromDate || undefined}
                onDateChange={handleFromDateChange}
                className="w-full sm:w-32 md:w-36"
              />
            </div>

            {/* To Date */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
              <span className="hidden text-xs font-bold uppercase text-[#785600] dark:text-[#b8860b] lg:inline">
                To:
              </span>
              <GenericDatePicker
                id="stock-ledger-to-date"
                placeholder="To Date"
                initialDate={toDate || undefined}
                onDateChange={handleToDateChange}
                className="w-full sm:w-32 md:w-36"
              />
            </div>

            {/* Print Button */}
            <GenericButton
              onClick={handlePrint}
              className="!bg-[#785600] !text-white hover:!bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6 sm:py-6">
        {/* Main Card Container */}
        <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/30 bg-white shadow-md transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-5 p-3 sm:p-5 md:p-6">
            {/* 1. OPENING / CLOSING Split Box */}
            <div className="overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="grid grid-cols-1 divide-y divide-[#d3c4af]/30 dark:divide-slate-800 md:grid-cols-2 md:divide-x md:divide-y-0">
                {/* Left: OPENING */}
                <div>
                  <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                    <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                      OPENING
                    </span>
                  </div>
                  <div className="divide-y divide-[#d3c4af]/20 text-xs font-semibold dark:divide-slate-800 sm:text-sm">
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Gold Stock
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.gold)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Manufacturing
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.raw)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Chain Stock
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.openingChain)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Client Due
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(
                          summaryData.opening.openingClientDue,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        SRP
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.opening.srp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[#f4f1ea]/60 px-4 py-2.5 dark:bg-slate-800/50">
                      <span className="font-bold text-[#1a1c1b] dark:text-white">
                        Inward
                      </span>
                      <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400">
                        {formatNumberDisplay(summaryData.opening.inward)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: CLOSING */}
                <div>
                  <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                    <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                      CLOSING
                    </span>
                  </div>
                  <div className="divide-y divide-[#d3c4af]/20 text-xs font-semibold dark:divide-slate-800 sm:text-sm">
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Gold Stock
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.gold)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Manufacturing
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.raw)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Chain Stock
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.closingChain)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Client Due
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(
                          summaryData.closing.closingClientDue,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40">
                      <span className="font-medium text-[#1a1c1b] dark:text-slate-200">
                        Loss
                      </span>
                      <span className="font-mono font-medium text-[#1a1c1b] dark:text-slate-300">
                        {formatNumberDisplay(summaryData.closing.loss)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[#f4f1ea]/60 px-4 py-2.5 dark:bg-slate-800/50">
                      <span className="font-bold text-[#1a1c1b] dark:text-white">
                        Outward
                      </span>
                      <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                        {formatNumberDisplay(summaryData.closing.outward)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#d3c4af]/30 bg-emerald-50/70 px-4 py-2.5 dark:bg-emerald-950/30">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        Profit / Loss
                      </span>
                      <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatNumberDisplay(
                          summaryData.closing.profitLoss ?? 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2, 3, 4: MANUFACTURING STOCK, CHAIN STOCK, & CLIENT in ONE ROW */}
            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
              {/* MANUFACTURING STOCK Table */}
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                    MANUFACTURING STOCK
                  </span>
                </div>
                <div className="flex flex-1 flex-col overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredRawStock.length > 0 ? (
                        filteredRawStock.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.due)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-gray-500 px-3.5 py-6 text-center text-xs"
                          >
                            No manufacturing stock data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CHAIN STOCK Table */}
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                    CHAIN STOCK
                  </span>
                </div>
                <div className="flex flex-1 flex-col overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredChainStock.length > 0 ? (
                        filteredChainStock.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.due)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-gray-500 px-3.5 py-6 text-center text-xs"
                          >
                            No chain stock data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CLIENT Table */}
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                    CLIENT
                  </span>
                </div>
                <div className="flex flex-1 flex-col overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="px-3.5 py-2.5">Name</th>
                        <th className="px-3.5 py-2.5 text-right">Opening</th>
                        <th className="px-3.5 py-2.5 text-right">Closing</th>
                        <th className="px-3.5 py-2.5 text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                      {filteredClient.length > 0 ? (
                        filteredClient.map((row) => (
                          <tr
                            key={row.id}
                            className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.opening)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-medium text-[#1a1c1b] dark:text-slate-300">
                              {formatNumberDisplay(row.closing)}
                            </td>
                            <td className="font-mono px-3.5 py-2.5 text-right font-bold text-[#1a1c1b] dark:text-slate-100">
                              {formatNumberDisplay(row.difference)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-gray-500 px-3.5 py-6 text-center text-xs"
                          >
                            No client records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. INWARD OUTWARD HISTORY Table */}
            <div className="overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  INWARD OUTWARD HISTORY
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="px-4 py-2.5">INWARD NAME</th>
                      <th className="px-4 py-2.5 text-right">INWARD</th>
                      <th className="px-4 py-2.5">OUTWARD NAME</th>
                      <th className="px-4 py-2.5 text-right">OUTWARD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredMovement.length > 0 ? (
                      filteredMovement.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[#1a1c1b] dark:text-white">
                              {row.inwardName ? row.inwardName : '-'}
                            </div>
                            {row.inwardSubtext && (
                              <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                                {row.inwardSubtext}
                              </div>
                            )}
                          </td>
                          <td className="font-mono px-4 py-2.5 text-right font-bold text-green-700 dark:text-green-400">
                            {row.inwardName &&
                              row.inward != null &&
                              row.inward > 0
                              ? formatNumberDisplay(row.inward)
                              : '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[#1a1c1b] dark:text-white">
                              {row.outwardName ? row.outwardName : '-'}
                            </div>
                            {row.outwardSubtext && (
                              <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                                {row.outwardSubtext}
                              </div>
                            )}
                          </td>
                          <td className="font-mono px-4 py-2.5 text-right font-bold text-amber-700 dark:text-amber-400">
                            {row.outwardName &&
                              row.outward != null &&
                              row.outward > 0
                              ? formatNumberDisplay(row.outward)
                              : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-gray-500 px-4 py-4 text-center text-xs"
                        >
                          No stock movement records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
