import {Search, UserPlus, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import z from 'zod';

// Client Schema for validation
const ClientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
});

interface ClientSearchClient {
  id: string;
  fullName?: string;
  fullname?: string;
  phoneNumber?: string;
  address?: string;
}

interface ClientSearchProps {
  selectedClient: ClientSearchClient | null;
  onSelectClient: (client: ClientSearchClient) => void;
  onClearClient: () => void;
  clients: ClientSearchClient[];
  isLoading?: boolean;
  onAddNewClient?: () => void;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  selectedClient,
  onSelectClient,
  onClearClient,
  clients,
  isLoading = false,
  onAddNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getClientName = (client: ClientSearchClient) =>
    client.fullname || client.fullName || '';

  const filteredClients = clients.filter((client) => {
    const name = getClientName(client).toLowerCase();
    const phone = client.phoneNumber || '';
    const query = searchQuery.toLowerCase();

    return name.includes(query) || phone.includes(searchQuery);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  const handleSelectClient = (client: ClientSearchClient) => {
    onSelectClient(client);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAddClient = () => {
    onAddNewClient?.();
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <div ref={dropdownRef} className="relative w-full">
        <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />

        {selectedClient ? (
          <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 md:py-4 md:pl-12 md:pr-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white">
                {getClientName(selectedClient)}
                {selectedClient.phoneNumber && (
                  <> - {selectedClient.phoneNumber}</>
                )}
              </p>

              {selectedClient.address && (
                <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                  {selectedClient.address}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClearClient}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-[#e8e8e6] dark:hover:bg-slate-700"
              title="Clear client"
            >
              <X size={16} className="text-[#4f4535] dark:text-slate-300" />
            </button>
          </div>
        ) : (
          <>
            <input
              autoComplete="off"
              data-lpignore="true"
              ref={inputRef}
              type="search"
              value={searchQuery}
              placeholder="Search by client name or phone..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full rounded-lg border-0 bg-[#f4f4f2] py-3 pl-10 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white md:py-4 md:pl-12 md:pr-4"
            />

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {isLoading && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-[#4f4535] dark:text-slate-400">
                      Loading Clients...
                    </p>
                  </div>
                )}

                {!isLoading && filteredClients.length > 0 && (
                  <>
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="cursor-pointer border-b border-[#f4f4f2] p-3 transition-colors hover:bg-[#f4f4f2] dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <p className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                          {getClientName(client)}
                        </p>

                        {client.phoneNumber && (
                          <p className="text-xs text-[#4f4535] dark:text-slate-400">
                            {client.phoneNumber}
                          </p>
                        )}

                        {client.address && (
                          <p className="mt-1 truncate text-xs text-[#4f4535] dark:text-slate-400">
                            {client.address}
                          </p>
                        )}
                      </div>
                    ))}

                    {onAddNewClient && (
                      <div
                        onClick={handleAddClient}
                        className="cursor-pointer border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 transition-colors hover:bg-[#f4f4f2] dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2 text-[#785600] dark:text-amber-400">
                          <UserPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Add New Client
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isLoading && filteredClients.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-[#4f4535] dark:text-slate-400">
                      {searchQuery ? 'No Client found' : 'No clients added yet'}
                    </p>

                    {onAddNewClient && (
                      <button
                        type="button"
                        onClick={handleAddClient}
                        className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#785600] transition-colors hover:bg-amber-100 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>+ Add New Client</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
