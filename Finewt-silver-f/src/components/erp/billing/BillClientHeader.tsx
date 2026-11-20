import React from 'react';
import {ClientSearch} from '@/components/reciept/ClientSearch';
import {User, Phone, MapPin} from 'lucide-react';

interface BillClientHeaderProps {
  clients: any[];
  selectedClientId: string;
  clientName?: string;
  isReadOnly?: boolean;
  onSelectClient: (client: any) => void;
  onClearClient: () => void;
  onAddNewClient: () => void;
  /** Optional content shown on the same row, right of the client search */
  rightSlot?: React.ReactNode;
}

export const BillClientHeader: React.FC<BillClientHeaderProps> = ({
  clients,
  selectedClientId,
  clientName,
  isReadOnly = false,
  onSelectClient,
  onClearClient,
  onAddNewClient,
  rightSlot,
}) => {
  const selectedClient =
    clients.find((client: any) => client.id === selectedClientId) || null;

  if (isReadOnly) {
    const displayName = selectedClient?.fullName || clientName || 'N/A';
    const phone = selectedClient?.phoneNumber || 'N/A';
    const address = selectedClient?.address || '';

    return (
      <div className={`mb-4 grid grid-cols-1 gap-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${rightSlot ? 'md:grid-cols-2' : ''}`}>
        <div>
        <label className="mb-2 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
          Client Details
        </label>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="font-bold text-[#1a1c1b] dark:text-white">
              {displayName}
            </span>
          </div>
          {phone && phone !== 'N/A' && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Phone className="h-4 w-4 text-[#817563]" />
              <span>{phone}</span>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-[#817563]" />
              <span>{address}</span>
            </div>
          )}
        </div>
        </div>
        {rightSlot && <div className="min-w-0">{rightSlot}</div>}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={`grid grid-cols-1 gap-4 ${rightSlot ? 'md:grid-cols-2' : ''}`}>
        <div className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
            Client <span className="text-red-500">*</span>
          </label>

          <ClientSearch
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={onSelectClient}
            onClearClient={onClearClient}
            isLoading={false}
            onAddNewClient={onAddNewClient}
          />
        </div>
        {rightSlot && <div className="relative">{rightSlot}</div>}
      </div>
    </div>
  );
};

export default BillClientHeader;
