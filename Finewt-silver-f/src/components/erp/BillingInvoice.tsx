import React, { useState } from 'react';
import { ReceiptCheck, Plus, Printer, X, ShieldAlert, Gem } from 'lucide-react';
import { erpStore, InvoiceItem } from '@/store/erpStore';
import { validateWeightGram, formatGramWithUnit } from '@/utils/weightValidation';
import toast from 'react-hot-toast';

export const BillingInvoice: React.FC = () => {
  const [data, setData] = useState(erpStore.getData());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(
    null,
  );

  const activeRates = data.rates[0] || {
    rate22k: 7250,
    rate24k: 7910,
    makingCharge: 450,
    gstPercent: 3,
  };

  const [formData, setFormData] = useState({
    customerName: data.customers[0]?.name || 'Kalyan Jewellers',
    date: new Date().toISOString().substring(0, 10),
    item: 'Chain',
    size: '20',
    purity: '22K',
    grossWeight: '',
    ratePerGram: activeRates.rate22k.toString(),
    makingChargePerGram: activeRates.makingCharge.toString(),
    gstPercent: activeRates.gstPercent.toString(),
  });

  const [weightError, setWeightError] = useState<string | null>(null);

  const refresh = () => setData(erpStore.getData());

  const handleWeightChange = (val: string) => {
    setFormData({ ...formData, grossWeight: val });
    const res = validateWeightGram(val, 'Gross Weight');
    setWeightError(res.isValid ? null : res.error || 'Invalid weight');
  };

  const grossWtNum = Number(formData.grossWeight) || 0;
  const rateNum = Number(formData.ratePerGram) || 0;
  const mcNum = Number(formData.makingChargePerGram) || 0;
  const gstPctNum = Number(formData.gstPercent) || 3;

  const goldAmount = grossWtNum * rateNum;
  const mcAmount = grossWtNum * mcNum;
  const taxableAmount = goldAmount + mcAmount;
  const gstAmount = (taxableAmount * gstPctNum) / 100;
  const totalAmount = taxableAmount + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wtRes = validateWeightGram(formData.grossWeight, 'Gross Weight');
    if (!wtRes.isValid) {
      setWeightError(wtRes.error || 'Invalid weight precision');
      toast.error('Gold Weight supports maximum 3 decimal places');
      return;
    }

    const selectedCust = data.customers.find(
      (c) => c.name === formData.customerName,
    );

    const newInv = erpStore.addInvoice({
      date: formData.date,
      customerName: formData.customerName,
      customerGst: selectedCust?.gst || '27AAAAA0000A1Z5',
      item: `${formData.item} ${formData.purity} (${formData.size} Inch)`,
      size: formData.size,
      purity: formData.purity,
      grossWeight: wtRes.parsedValue!,
      ratePerGram: rateNum,
      makingChargePerGram: mcNum,
      goldAmount,
      makingChargeAmount: mcAmount,
      taxableAmount,
      gstPercent: gstPctNum,
      gstAmount,
      totalAmount,
      paymentStatus: 'Paid',
    });

    toast.success(`Invoice created: ${newInv.invoiceNo}`);
    setIsModalOpen(false);
    setSelectedInvoice(newInv);
    refresh();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif flex items-center gap-2 text-2xl font-bold text-amber-400">
            <ReceiptCheck className="h-6 w-6" />
            Jeweller Billing & Tax Invoice
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Generate Customer Invoices • Gold Weight in 3 Decimals • Automatic
            Tax & Making Charges
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />+ Create New Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 font-semibold uppercase tracking-wider text-amber-400/90">
            <tr>
              <th className="p-4">Invoice No</th>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Item & Size</th>
              <th className="p-4">Gross Wt (g)</th>
              <th className="p-4">Gold Rate</th>
              <th className="p-4">Making Chg</th>
              <th className="p-4">GST (3%)</th>
              <th className="p-4">Total Amount (₹)</th>
              <th className="p-4 text-right">Invoice PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {data.invoices.map((inv) => (
              <tr
                key={inv.id}
                className="transition-colors hover:bg-slate-800/40"
              >
                <td className="font-mono p-4 font-bold text-amber-400">
                  {inv.invoiceNo}
                </td>
                <td className="p-4 text-slate-400">{inv.date}</td>
                <td className="p-4 font-semibold text-slate-100">
                  {inv.customerName}
                </td>
                <td className="p-4 text-slate-300">{inv.item}</td>
                <td className="font-mono p-4 font-bold text-amber-300">
                  {formatGramWithUnit(inv.grossWeight)}
                </td>
                <td className="font-mono p-4">
                  ₹{inv.ratePerGram.toFixed(2)}/g
                </td>
                <td className="font-mono p-4 text-slate-400">
                  ₹{inv.makingChargePerGram.toFixed(2)}/g
                </td>
                <td className="font-mono p-4 text-purple-400">
                  ₹{inv.gstAmount.toFixed(2)}
                </td>
                <td className="font-mono p-4 text-sm font-bold text-emerald-400">
                  ₹
                  {inv.totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500 hover:text-slate-950"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    View PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Invoice Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl space-y-5 rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-400">
                <ReceiptCheck className="h-5 w-5" />
                Generate Jeweller Invoice
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Customer (Jeweller) *
                  </label>
                  <select
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {data.customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Item Category
                  </label>
                  <select
                    value={formData.item}
                    onChange={(e) =>
                      setFormData({ ...formData, item: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {data.items.map((it) => (
                      <option key={it.id} value={it.name}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {data.sizes.map((sz) => (
                      <option key={sz.id} value={sz.size}>
                        {sz.size} Inch
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Purity
                  </label>
                  <select
                    value={formData.purity}
                    onChange={(e) =>
                      setFormData({ ...formData, purity: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {data.purities.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-400">
                  Gross Weight (Grams){' '}
                  <span className="text-amber-500">* [Strict 3 Decimals]</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45.250"
                  value={formData.grossWeight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className={`font-mono w-full rounded-lg border bg-slate-950 p-2.5 text-slate-100 focus:outline-none ${weightError
                      ? 'border-rose-500'
                      : 'border-slate-700 focus:border-amber-500'
                    }`}
                />
                {weightError && (
                  <p className="mt-1 text-[10px] text-rose-400">
                    {weightError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Rate (₹/g)
                  </label>
                  <input
                    type="number"
                    value={formData.ratePerGram}
                    onChange={(e) =>
                      setFormData({ ...formData, ratePerGram: e.target.value })
                    }
                    className="font-mono w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    Making Chg (₹/g)
                  </label>
                  <input
                    type="number"
                    value={formData.makingChargePerGram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        makingChargePerGram: e.target.value,
                      })
                    }
                    className="font-mono w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-400">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gstPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, gstPercent: e.target.value })
                    }
                    className="font-mono w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
                  />
                </div>
              </div>

              {/* Calculated Summary */}
              <div className="space-y-2 rounded-xl border border-amber-500/30 bg-slate-950 p-4 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gold Amount:</span>
                  <span className="font-mono text-slate-200">
                    ₹{goldAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Making Charges:</span>
                  <span className="font-mono text-slate-200">
                    ₹{mcAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({gstPctNum}%):</span>
                  <span className="font-mono text-purple-400">
                    ₹{gstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-emerald-400">
                  <span>Total Payable:</span>
                  <span className="font-mono">
                    ₹
                    {totalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
                >
                  Save & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice PDF Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl space-y-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-white p-8 text-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Gem className="h-7 w-7 text-amber-600" />
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">
                    SONA GOLD ERP
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    Gold Chain Manufacturing & Wholesale Tax Invoice
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono block text-lg font-bold text-amber-600">
                  {selectedInvoice.invoiceNo}
                </span>
                <span className="text-xs text-slate-500">
                  Date: {selectedInvoice.date}
                </span>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <div>
                <span className="block font-semibold uppercase text-slate-500">
                  Billed To (Jeweller):
                </span>
                <span className="mt-1 block text-sm font-bold text-slate-800">
                  {selectedInvoice.customerName}
                </span>
                <span className="block text-slate-600">
                  GSTIN: {selectedInvoice.customerGst}
                </span>
              </div>
              <div className="text-right">
                <span className="block font-semibold uppercase text-slate-500">
                  Payment Status:
                </span>
                <span className="mt-1 inline-block rounded border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {selectedInvoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-left text-xs">
              <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                <tr>
                  <th className="border-b p-3">Item Description (तपशील)</th>
                  <th className="border-b p-3 text-right">Gross Wt (g)</th>
                  <th className="border-b p-3 text-right">Rate / g</th>
                  <th className="border-b p-3 text-right">Making / g</th>
                  <th className="border-b p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-slate-200">
                <tr>
                  <td className="font-sans p-3 font-medium text-slate-800">
                    {selectedInvoice.item}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatGramWithUnit(selectedInvoice.grossWeight)}
                  </td>
                  <td className="p-3 text-right">
                    ₹{selectedInvoice.ratePerGram.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    ₹{selectedInvoice.makingChargePerGram.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    ₹{selectedInvoice.taxableAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Invoice Totals */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount:</span>
                  <span className="font-mono">
                    ₹{selectedInvoice.taxableAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({selectedInvoice.gstPercent}%):</span>
                  <span className="font-mono">
                    ₹{selectedInvoice.gstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-bold text-amber-700">
                  <span>Invoice Total:</span>
                  <span className="font-mono">
                    ₹
                    {selectedInvoice.totalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-semibold text-white shadow transition-all hover:from-[#6b4c00] hover:to-[#875f00] hover:shadow-md h-9 px-4 text-xs sm:text-[13px]"
              >
                <Printer className="h-4 w-4" />
                Print / Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
