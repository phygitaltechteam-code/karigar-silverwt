import React, {useState} from 'react';
import {Gem, Plus, MapPin, CheckCircle} from 'lucide-react';
import {erpStore} from '@/store/erpStore';
import {validateWeightGram, formatGramWithUnit} from '@/utils/weightValidation';
import toast from 'react-hot-toast';

export const FinishedStock: React.FC = () => {
  const [data, setData] = useState(erpStore.getData());
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const readyForFinished = data.batches.filter(
    (b) => b.stage === 'CUTTING' || b.stage === 'FINISHED_STOCK',
  );

  const selectedBatch = data.batches.find((b) => b.id === selectedBatchId);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    location: 'Main Vault - Tray A1',
    status: 'Available' as 'Available' | 'Reserved' | 'Billed',
  });

  const refresh = () => setData(erpStore.getData());

  const handleTransferToFinished = (batchId: string) => {
    erpStore.updateBatchStage(batchId, 'FINISHED_STOCK', {
      location: formData.location,
      status: 'Completed',
    });
    toast.success('Batch moved to Finished Stock vault');
    refresh();
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="font-serif flex items-center gap-2 text-2xl font-bold text-amber-400">
          <Gem className="h-6 w-6" />
          Finished Stock Inventory
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manufacturing Flow: Cutting → Finished Stock (Vault Location & Ready
          to Bill Items)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 font-semibold uppercase tracking-wider text-amber-400/90">
            <tr>
              <th className="p-4">Sr No</th>
              <th className="p-4">Lot Batch No</th>
              <th className="p-4">Date</th>
              <th className="p-4">Item Name</th>
              <th className="p-4">Size</th>
              <th className="p-4">Purity</th>
              <th className="p-4">Final Weight (g)</th>
              <th className="p-4">Vault Location</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {readyForFinished.map((b, index) => (
              <tr
                key={b.id}
                className="transition-colors hover:bg-slate-800/40"
              >
                <td className="font-mono p-4 text-slate-400">{index + 1}</td>
                <td className="font-mono p-4 font-bold text-amber-300">
                  {b.lotNo}
                </td>
                <td className="p-4 text-slate-400">{b.date}</td>
                <td className="p-4 font-medium text-slate-100">{b.item}</td>
                <td className="p-4 text-slate-300">{b.size} Inch</td>
                <td className="p-4 font-semibold text-amber-400">{b.purity}</td>
                <td className="font-mono p-4 font-bold text-emerald-400">
                  {formatGramWithUnit(b.currentWeight)}
                </td>
                <td className="flex items-center gap-1 p-4 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  {b.location || 'Main Vault - Tray A1'}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      b.stage === 'FINISHED_STOCK'
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {b.stage === 'FINISHED_STOCK'
                      ? 'Ready to Sell'
                      : 'In Cutting'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {b.stage !== 'FINISHED_STOCK' && (
                    <button
                      onClick={() => handleTransferToFinished(b.id)}
                      className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      Approve Vault Entry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
