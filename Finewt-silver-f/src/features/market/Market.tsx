import {useNavigate} from '@tanstack/react-router';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  MdArrowDropDown,
  MdArrowDropUp,
  MdClose,
  MdMenu,
  MdNotifications,
  MdSearch,
  MdShowChart,
  MdTrendingDown,
  MdTrendingUp,
  MdTune,
} from 'react-icons/md';

import {api} from '@/utils/axios';

// Types
interface Instrument {
  id: string;
  name: string;
  market: string;
  sub: string;
  price: number;
  previousPrice: number;
  change: string;
  changePercent: number;
  up: boolean;
  volume?: number;
  openInterest?: number;
  category: 'futures' | 'spot' | 'etf' | 'options';
  symbol: string;
}

interface MarketIndices {
  title: string;
  price: string;
  change: string;
  up: boolean;
}

interface MarketDataResponse {
  instruments: Instrument[];
  indices: MarketIndices[];
}

// Temporary mock data (will be replaced by API response)
const TEMP_MARKET_DATA: MarketDataResponse = {
  instruments: [
    {
      id: '1',
      name: 'GOLD-26MAR-FUT',
      symbol: 'GOLD_FUT_MAR24',
      market: 'MCX',
      sub: 'Exp: 26 Mar 2024',
      price: 59240.0,
      previousPrice: 58975.0,
      change: '+0.45%',
      changePercent: 0.45,
      up: true,
      volume: 12500,
      openInterest: 45000,
      category: 'futures',
    },
    {
      id: '2',
      name: 'GOLD-05JUN-FUT',
      symbol: 'GOLD_FUT_JUN24',
      market: 'MCX',
      sub: 'Exp: 05 Jun 2024',
      price: 59810.0,
      previousPrice: 59620.0,
      change: '+0.32%',
      changePercent: 0.32,
      up: true,
      volume: 8900,
      openInterest: 32000,
      category: 'futures',
    },
    {
      id: '3',
      name: 'SILVER-05MAR-FUT',
      symbol: 'SILVER_FUT_MAR24',
      market: 'MCX',
      sub: 'Exp: 05 Mar 2024',
      price: 71450.0,
      previousPrice: 71365.0,
      change: '-0.12%',
      changePercent: -0.12,
      up: false,
      volume: 5600,
      openInterest: 18000,
      category: 'futures',
    },
    {
      id: '4',
      name: 'GCJ4',
      symbol: 'GOLD_COMEX_APR24',
      market: 'COMEX',
      sub: 'Volume: 125K',
      price: 2054.3,
      previousPrice: 2031.0,
      change: '+1.15%',
      changePercent: 1.15,
      up: true,
      volume: 125000,
      openInterest: 89000,
      category: 'futures',
    },
    {
      id: '5',
      name: 'GCM4',
      symbol: 'GOLD_COMEX_JUN24',
      market: 'COMEX',
      sub: 'Volume: 45K',
      price: 2068.1,
      previousPrice: 2046.0,
      change: '+1.08%',
      changePercent: 1.08,
      up: true,
      volume: 45000,
      openInterest: 56000,
      category: 'futures',
    },
    {
      id: '6',
      name: 'CRUDEOIL-20MAR-FUT',
      symbol: 'CRUDE_FUT_MAR24',
      market: 'MCX',
      sub: 'Exp: 20 Mar 2024',
      price: 6250.0,
      previousPrice: 6280.0,
      change: '-0.48%',
      changePercent: -0.48,
      up: false,
      volume: 45000,
      openInterest: 120000,
      category: 'futures',
    },
    {
      id: '7',
      name: 'NATURALGAS-27MAR-FUT',
      symbol: 'NG_FUT_MAR24',
      market: 'MCX',
      sub: 'Exp: 27 Mar 2024',
      price: 185.5,
      previousPrice: 182.3,
      change: '+1.75%',
      changePercent: 1.75,
      up: true,
      volume: 28000,
      openInterest: 75000,
      category: 'futures',
    },
    {
      id: '8',
      name: 'GOLD SPOT',
      symbol: 'GOLD_SPOT',
      market: 'MCX',
      sub: 'Spot Price',
      price: 58950.0,
      previousPrice: 58800.0,
      change: '+0.25%',
      changePercent: 0.25,
      up: true,
      volume: 50000,
      category: 'spot',
    },
    {
      id: '9',
      name: 'SILVER SPOT',
      symbol: 'SILVER_SPOT',
      market: 'MCX',
      sub: 'Spot Price',
      price: 71200.0,
      previousPrice: 71350.0,
      change: '-0.21%',
      changePercent: -0.21,
      up: false,
      volume: 35000,
      category: 'spot',
    },
    {
      id: '10',
      name: 'GOLD ETF',
      symbol: 'GOLD_ETF',
      market: 'NSE',
      sub: 'Gold BeES',
      price: 58.5,
      previousPrice: 58.2,
      change: '+0.52%',
      changePercent: 0.52,
      up: true,
      volume: 250000,
      category: 'etf',
    },
    {
      id: '11',
      name: 'SILVER ETF',
      symbol: 'SILVER_ETF',
      market: 'NSE',
      sub: 'Silver BeES',
      price: 72.3,
      previousPrice: 72.8,
      change: '-0.69%',
      changePercent: -0.69,
      up: false,
      volume: 180000,
      category: 'etf',
    },
  ],
  indices: [
    {title: 'Gold Index', price: '2,041.50', change: '+0.8%', up: true},
    {title: 'Silver Spot', price: '22.84', change: '-0.3%', up: false},
    {title: 'Volatility (VIX)', price: '14.20', change: '+1.2%', up: true},
    {title: 'Dollar Index', price: '103.45', change: '-0.15%', up: false},
    {title: 'Crude Oil', price: '78.30', change: '+0.65%', up: true},
  ],
};

const CATEGORIES = [
  {id: 'futures', name: 'Derivatives (Futures)'},
  {id: 'spot', name: 'Spot Gold'},
  {id: 'etf', name: 'ETFs'},
  {id: 'options', name: 'Options'},
];

// Flag to use mock data instead of API (set to true for development)
const USE_MOCK_DATA = true;

const Market: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('futures');
  const [allInstruments, setAllInstruments] = useState<Instrument[]>([]);
  const [indices, setIndices] = useState<MarketIndices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [realtimeData, setRealtimeData] = useState<Map<string, any>>(new Map());
  const [usingMockData, setUsingMockData] = useState(USE_MOCK_DATA);

  const wsRef = useRef<WebSocket | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load saved selection from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedInstruments');
    if (saved) {
      try {
        setSelectedInstruments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved selection:', e);
      }
    }
  }, []);

  // Fetch all market data from single API endpoint or use mock data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (USE_MOCK_DATA) {
          // Use temporary mock data
          console.log('Using temporary mock data for development');
          setTimeout(() => {
            setAllInstruments(TEMP_MARKET_DATA.instruments);
            setIndices(TEMP_MARKET_DATA.indices);
            setLoading(false);
          }, 1000); // Simulate network delay
          return;
        }

        // Real API call (will be used when backend is ready)
        const response = await api.get('/market-data');

        if (response.success) {
          setAllInstruments(response.data.instruments);
          setIndices(response.data.indices);
          setUsingMockData(false);
        } else {
          throw new Error('Failed to fetch market data');
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        // Fallback to mock data if API fails
        setAllInstruments(TEMP_MARKET_DATA.instruments);
        setIndices(TEMP_MARKET_DATA.indices);
        setError('Using demo data. API connection failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Setup WebSocket for real-time updates (optional for mock data)
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Simulate real-time updates with mock data
      const interval = setInterval(() => {
        setAllInstruments((prev) =>
          prev.map((instr) => {
            // Random price fluctuation for demo
            const fluctuation = (Math.random() - 0.5) * 2;
            const newPrice = instr.price * (1 + fluctuation / 100);
            const changePercent =
              ((newPrice - instr.previousPrice) / instr.previousPrice) * 100;
            const isUp = changePercent > 0;

            return {
              ...instr,
              price: newPrice,
              change: `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`,
              changePercent: changePercent,
              up: isUp,
            };
          }),
        );
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }

    // Real WebSocket connection for production
    const wsUrl = 'wss://api.example.com/market-data';

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current?.send(
          JSON.stringify({
            type: 'subscribe',
            symbols: allInstruments.map((i) => i.symbol),
          }),
        );
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setRealtimeData((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.symbol, data);
          return newMap;
        });
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [allInstruments]);

  // Update instrument prices from WebSocket (for real API)
  useEffect(() => {
    if (!USE_MOCK_DATA && realtimeData.size > 0) {
      setAllInstruments((prev) =>
        prev.map((instr) => {
          const realtime = realtimeData.get(instr.symbol);
          if (realtime) {
            return {
              ...instr,
              price: realtime.price,
              change: realtime.change,
              changePercent: realtime.changePercent,
              up: realtime.changePercent > 0,
            };
          }
          return instr;
        }),
      );
    }
  }, [realtimeData]);

  // Filter instruments by category
  const filteredByCategory = allInstruments.filter(
    (instrument) => instrument.category === activeCategory,
  );

  // Handle search with debounce (client-side filtering)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      // Client-side search filtering
      const results = filteredByCategory.filter(
        (instr) =>
          instr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instr.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filteredByCategory]);

  // Search results state
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);

  // Display instruments based on search or selection
  const getDisplayedInstruments = () => {
    if (searchQuery) {
      return searchResults;
    }
    return selectedInstruments.length === 0
      ? filteredByCategory
      : filteredByCategory.filter((item) =>
          selectedInstruments.includes(item.name),
        );
  };

  const displayedInstruments = getDisplayedInstruments();

  // Save selection to localStorage
  const saveSelection = useCallback((selected: string[]) => {
    setSelectedInstruments(selected);
    localStorage.setItem('selectedInstruments', JSON.stringify(selected));
  }, []);

  // Handle instrument selection toggle
  const toggleInstrument = (instrumentName: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrumentName)
        ? prev.filter((n) => n !== instrumentName)
        : [...prev, instrumentName],
    );
  };

  const clearSelection = () => {
    saveSelection([]);
    setShowSearchModal(false);
  };

  const doneSelection = () => {
    saveSelection(selectedInstruments);
    setShowSearchModal(false);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery(''); // Clear search when changing category
    setSearchResults([]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050a05]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#0df20d] border-t-transparent"></div>
          <p className="text-white">Loading market data...</p>
          {USE_MOCK_DATA && (
            <p className="text-gray-400 mt-2 text-xs">Using demo data</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#050a05] font-[Inter] text-white">
      <div className="relative flex min-h-screen w-full flex-col">
        {/* Error Notice */}
        {error && (
          <div className="mx-5 mt-2 rounded-lg border border-red-500/50 bg-red-500/20 p-2 text-center text-xs text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-[#050a05] px-5 py-4">
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-[#102210]">
              <MdMenu className="text-gray-400 text-xl" />
            </button>
            <h1 className="text-xl font-bold">Asset Universe</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative text-[#0df20d]">
              <MdNotifications className="text-xl" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div
              onClick={() => navigate({to: '/profile'})}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#0df20d]/40 bg-[#102210]"
            >
              <span className="text-xs">👤</span>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="px-5 pb-4 pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MdSearch className="text-gray-500 absolute left-3 top-3" />
              <input
                readOnly
                placeholder={
                  selectedInstruments.length > 0
                    ? `${selectedInstruments.length} instrument${selectedInstruments.length > 1 ? 's' : ''} selected`
                    : 'Search Symbol, ISIN... (tap to select)'
                }
                onClick={() => setShowSearchModal(true)}
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a140a] py-3 pl-10 pr-4 text-sm focus:border-[#0df20d]"
              />
            </div>

            <button className="rounded-lg border border-white/10 bg-[#0a140a] px-3 hover:bg-[#102210]">
              <MdTune />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto px-5 pb-2">
          <div className="flex gap-2 border-b border-white/10 text-xs">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`whitespace-nowrap pb-3 transition-colors ${
                  activeCategory === category.id
                    ? 'border-b-2 border-[#0df20d] font-semibold text-[#0df20d]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Market Cards */}
        <div className="flex gap-4 overflow-x-auto px-5 py-4">
          {indices.map((index, idx) => (
            <MarketCard
              key={idx}
              title={index.title}
              price={index.price}
              change={index.change}
              up={index.up}
              icon={
                idx === 0 ? (
                  <MdTrendingUp />
                ) : idx === 1 ? (
                  <MdTrendingDown />
                ) : (
                  <MdShowChart />
                )
              }
            />
          ))}
        </div>

        {/* Table Header */}
        <div className="text-gray-500 flex justify-between border-b border-white/10 px-5 py-2 text-xs uppercase">
          <span>Instrument</span>
          <div className="flex gap-8">
            <span>LTP</span>
            <span>Chg%</span>
          </div>
        </div>

        {/* Instruments */}
        <main className="flex-1 space-y-3 overflow-y-auto px-5 pb-24 pt-3">
          {displayedInstruments.length > 0 ? (
            displayedInstruments.map((item) => (
              <InstrumentItem
                key={item.id}
                id={item.id}
                name={item.name}
                market={item.market}
                sub={item.sub}
                price={item.price}
                change={item.change}
                up={item.up}
                volume={item.volume}
                openInterest={item.openInterest}
              />
            ))
          ) : (
            <div className="text-gray-500 py-10 text-center">
              {searchQuery
                ? 'No instruments found'
                : selectedInstruments.length > 0
                  ? 'No instruments selected in this category'
                  : `No ${activeCategory} instruments available`}
            </div>
          )}
        </main>

        {/* Selection Modal */}
        {showSearchModal && (
          <SelectionModal
            instruments={filteredByCategory}
            selectedInstruments={selectedInstruments}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleInstrument={toggleInstrument}
            onClearAll={clearSelection}
            onDone={doneSelection}
            onClose={() => {
              setShowSearchModal(false);
              setSearchQuery('');
            }}
          />
        )}
      </div>
    </div>
  );
};

// Selection Modal Component (same as before)
const SelectionModal: React.FC<{
  instruments: Instrument[];
  selectedInstruments: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleInstrument: (name: string) => void;
  onClearAll: () => void;
  onDone: () => void;
  onClose: () => void;
}> = ({
  instruments,
  selectedInstruments,
  searchQuery,
  onSearchChange,
  onToggleInstrument,
  onClearAll,
  onDone,
  onClose,
}) => {
  const filteredInstruments = searchQuery
    ? instruments.filter(
        (instr) =>
          instr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instr.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : instruments;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a140a] px-5 py-4">
        <h2 className="text-lg font-semibold">Select Instruments</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-[#102210]"
        >
          <MdClose className="text-gray-300 text-xl" />
        </button>
      </div>

      <div className="border-b border-white/10 bg-[#0a140a] p-4">
        <div className="relative">
          <MdSearch className="text-gray-500 absolute left-3 top-3" />
          <input
              autoComplete="off"
              data-lpignore="true"
            autoFocus
            type="search"
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="placeholder-gray-500 w-full rounded-lg border border-white/10 bg-[#102210] py-3 pl-10 pr-4 text-sm text-white focus:border-[#0df20d] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredInstruments.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">
            {searchQuery ? 'No instruments found' : 'No instruments available'}
          </div>
        ) : (
          filteredInstruments.map((item) => {
            const isSelected = selectedInstruments.includes(item.name);
            return (
              <div
                key={item.id}
                onClick={() => onToggleInstrument(item.name)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-[#0df20d] bg-[#102210]/70 shadow-lg shadow-[#0df20d]/10'
                    : 'border-white/5 bg-[#0a140a] hover:bg-[#102210]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-gray-400 rounded border border-white/10 bg-[#102210] px-1.5 py-0.5 text-[8px]">
                      {item.market}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1 text-xs">{item.sub}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {item.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={`flex items-center justify-end text-xs ${
                      item.up ? 'text-[#0df20d]' : 'text-red-400'
                    }`}
                  >
                    {item.up ? <MdArrowDropUp /> : <MdArrowDropDown />}
                    {item.change}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-3 border-t border-white/10 bg-[#0a140a] p-4">
        <button
          onClick={onClearAll}
          className="flex-1 rounded-lg border border-white/20 py-3 text-sm transition-colors hover:bg-white/5"
        >
          Clear All
        </button>
        <button
          onClick={onDone}
          className="flex-1 rounded-lg bg-[#0df20d] py-3 text-sm font-medium text-black transition-colors hover:bg-[#0be30b]"
        >
          Done ({selectedInstruments.length})
        </button>
      </div>
    </div>
  );
};

// Market Card Component
const MarketCard = ({
  title,
  price,
  change,
  icon,
  up,
}: {
  title: string;
  price: string;
  change: string;
  icon: React.ReactNode;
  up?: boolean;
}) => (
  <div className="min-w-[140px] rounded-xl border border-white/5 bg-gradient-to-br from-[#0a140a] to-[#102210] p-3 transition-all hover:scale-105 hover:border-[#0df20d]/30">
    <div className="text-gray-500 mb-1 text-xs">{title}</div>
    <div className="font-mono mb-2 text-lg font-bold">{price}</div>
    <div
      className={`flex items-center text-xs font-medium ${
        up ? 'text-[#0df20d]' : 'text-red-400'
      }`}
    >
      {up ? <MdArrowDropUp /> : <MdArrowDropDown />}
      {change}
    </div>
  </div>
);

// Instrument Item Component
const InstrumentItem = ({
  id,
  name,
  market,
  sub,
  price,
  change,
  up,
  volume,
  openInterest,
}: {
  id: string;
  name: string;
  market: string;
  sub: string;
  price: number;
  change: string;
  up?: boolean;
  volume?: number;
  openInterest?: number;
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate({to: '/marketdetails', state: {instrumentId: id}})
      }
      className="flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-[#0a140a] p-4 transition-all hover:border-[#0df20d]/30 hover:bg-[#102210]"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-gray-400 rounded border border-white/10 bg-[#102210] px-1.5 py-0.5 text-[8px]">
            {market}
          </span>
        </div>
        <div className="text-gray-500 mt-1 text-xs">
          {sub}
          {volume && (
            <span className="ml-2">Vol: {volume.toLocaleString()}</span>
          )}
          {openInterest && (
            <span className="ml-2">OI: {openInterest.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono text-sm">
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className={`flex items-center justify-end text-xs ${
            up ? 'text-[#0df20d]' : 'text-red-400'
          }`}
        >
          {up ? <MdArrowDropUp /> : <MdArrowDropDown />}
          {change}
        </div>
      </div>
    </div>
  );
};

export default Market;
