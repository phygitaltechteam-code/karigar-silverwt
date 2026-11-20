import {useNavigate} from '@tanstack/react-router';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {MdSearch, MdFilterList, MdClose, MdMenu} from 'react-icons/md';
import {api} from '@/utils/axios';

// Types
interface Order {
  id: string;
  symbol: string;
  type: string;
  price: number;
  priceLabel: 'Limit Price' | 'Market Price' | 'Stop Loss';
  side: 'Buy' | 'Sell';
  sideColor: string;
  filled?: number;
  total: number;
  filledQuantity?: number;
  totalQuantity: number;
  unit: string;
  status: 'Active' | 'Partial' | 'Filled' | 'Cancelled' | 'Rejected';
  statusColor: string;
  progress?: number;
  tab: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  orderType: 'limit' | 'market' | 'stop';
  leverage?: number;
  exchange: string;
}

interface OrderResponse {
  orders: Order[];
  total: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
}

// Temporary mock data (will be replaced by API response)
const TEMP_ORDERS: Order[] = [
  {
    id: '1',
    symbol: 'XAU/USD',
    type: 'Spot • Gold',
    price: 1945.5,
    priceLabel: 'Limit Price',
    side: 'Buy',
    sideColor: 'text-[#37ec13]',
    filled: 5.0,
    filledQuantity: 5.0,
    total: 10.0,
    totalQuantity: 10.0,
    unit: 'oz',
    status: 'Partial',
    statusColor: 'text-yellow-400',
    progress: 50,
    tab: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderType: 'limit',
    exchange: 'MCX',
  },
  {
    id: '2',
    symbol: 'BTC/USDT',
    type: 'Spot • Crypto',
    price: 61200,
    priceLabel: 'Market Price',
    side: 'Sell',
    sideColor: 'text-red-400',
    total: 0.5,
    totalQuantity: 0.5,
    unit: 'BTC',
    status: 'Filled',
    statusColor: 'text-green-400',
    tab: 'Completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    orderType: 'market',
    exchange: 'Binance',
  },
  {
    id: '3',
    symbol: 'ETH/USDT',
    type: 'Spot • Crypto',
    price: 3200,
    priceLabel: 'Limit Price',
    side: 'Buy',
    sideColor: 'text-[#37ec13]',
    total: 2,
    totalQuantity: 2,
    unit: 'ETH',
    status: 'Cancelled',
    statusColor: 'text-red-400',
    tab: 'Cancelled',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    orderType: 'limit',
    exchange: 'Binance',
  },
  {
    id: '4',
    symbol: 'XAG/USD',
    type: 'Spot • Silver',
    price: 24.1,
    priceLabel: 'Limit Price',
    side: 'Buy',
    sideColor: 'text-[#37ec13]',
    total: 20,
    totalQuantity: 20,
    unit: 'oz',
    status: 'Filled',
    statusColor: 'text-green-400',
    tab: 'Completed',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    orderType: 'limit',
    exchange: 'MCX',
  },
  {
    id: '5',
    symbol: 'GOLD-26MAR-FUT',
    type: 'Futures • Gold',
    price: 59240,
    priceLabel: 'Limit Price',
    side: 'Buy',
    sideColor: 'text-[#37ec13]',
    filled: 2,
    filledQuantity: 2,
    total: 5,
    totalQuantity: 5,
    unit: 'lots',
    status: 'Partial',
    statusColor: 'text-yellow-400',
    progress: 40,
    tab: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderType: 'limit',
    leverage: 10,
    exchange: 'MCX',
  },
  {
    id: '6',
    symbol: 'SILVER-05MAR-FUT',
    type: 'Futures • Silver',
    price: 71450,
    priceLabel: 'Stop Loss',
    side: 'Sell',
    sideColor: 'text-red-400',
    total: 3,
    totalQuantity: 3,
    unit: 'lots',
    status: 'Active',
    statusColor: 'text-blue-400',
    tab: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderType: 'stop',
    leverage: 8,
    exchange: 'MCX',
  },
];

// Flag to use mock data instead of API
const USE_MOCK_DATA = true;

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<
    'Active' | 'Completed' | 'Cancelled'
  >('Active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderCounts, setOrderCounts] = useState({
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch orders from API or use mock data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        if (USE_MOCK_DATA) {
          // Use temporary mock data
          console.log('Using temporary mock data for orders');
          setTimeout(() => {
            setOrders(TEMP_ORDERS);
            updateOrderCounts(TEMP_ORDERS);
            setLoading(false);
          }, 800); // Simulate network delay
          return;
        }

        // Real API call (will be used when backend is ready)
        const response = await api.get('/orders');

        if (response.success) {
          setOrders(response.data.orders);
          updateOrderCounts(response.data.orders);
        } else {
          throw new Error('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        // Fallback to mock data
        setOrders(TEMP_ORDERS);
        updateOrderCounts(TEMP_ORDERS);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Update order counts
  const updateOrderCounts = (ordersList: Order[]) => {
    setOrderCounts({
      active: ordersList.filter((o) => o.tab === 'Active').length,
      completed: ordersList.filter((o) => o.tab === 'Completed').length,
      cancelled: ordersList.filter((o) => o.tab === 'Cancelled').length,
    });
  };

  // Filter orders based on active tab and search query
  useEffect(() => {
    let filtered = orders.filter((order) => order.tab === activeTab);

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredOrders(filtered);
  }, [activeTab, orders, searchQuery]);

  // Handle search with debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle cancel order
  const cancelOrder = async (orderId: string) => {
    try {
      if (USE_MOCK_DATA) {
        // Mock cancel
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {...order, status: 'Cancelled', tab: 'Cancelled' as const}
              : order,
          ),
        );
        return;
      }

      // Real API call
      const response = await api.post(`/orders/${orderId}/cancel`);
      if (response.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {...order, status: 'Cancelled', tab: 'Cancelled' as const}
              : order,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  // Handle modify order
  const modifyOrder = (order: Order) => {
    navigate({
      to: `/placeorder/${order.side.toLowerCase()}`,
      state: {order, isModify: true},
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#37ec13] border-t-transparent"></div>
          <p className="text-white">Loading orders...</p>
          {USE_MOCK_DATA && (
            <p className="text-gray-400 mt-2 text-xs">Using demo data</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#000000] font-[Inter]">
      <div className="relative flex min-h-screen w-full flex-col bg-[#000000] text-white">
        {/* Error Notice */}
        {error && (
          <div className="mx-6 mt-2 rounded-lg border border-red-500/50 bg-red-500/20 p-2 text-center text-xs text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="rounded-full p-2 hover:bg-primary/10"
            >
              <MdSearch className="text-gray-300 text-xl" />
            </button>

            <button className="rounded-full p-2 hover:bg-primary/10">
              <MdFilterList className="text-gray-300 text-xl" />
            </button>
          </div>
        </header>

        {/* Tabs with Counts */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-2 rounded-full border border-white/5 bg-[#1a2e16]/30 p-1">
            <button
              onClick={() => setActiveTab('Active')}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                activeTab === 'Active'
                  ? 'bg-[#37ec13] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Active ({orderCounts.active})
            </button>

            <button
              onClick={() => setActiveTab('Completed')}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                activeTab === 'Completed'
                  ? 'bg-[#37ec13] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed ({orderCounts.completed})
            </button>

            <button
              onClick={() => setActiveTab('Cancelled')}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                activeTab === 'Cancelled'
                  ? 'bg-[#37ec13] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cancelled ({orderCounts.cancelled})
            </button>
          </div>
        </div>

        {/* Orders */}
        <main className="flex-1 space-y-4 overflow-y-auto px-6 pb-28">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onModify={() => modifyOrder(order)}
                onCancel={() => cancelOrder(order.id)}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `No orders found matching "${searchQuery}"`
                  : `No ${activeTab.toLowerCase()} orders`}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-[#37ec13] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </main>

        {/* Search Modal */}
        {showSearchModal && (
          <SearchModal
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
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

// Search Modal Component
const SearchModal: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
}> = ({searchQuery, onSearchChange, onClose}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a140a] px-5 py-4">
        <h2 className="text-lg font-semibold">Search Orders</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-[#102210]"
        >
          <MdClose className="text-gray-300 text-xl" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <MdSearch className="text-gray-500 absolute left-3 top-3" />
          <input
              autoComplete="off"
              data-lpignore="true"
            autoFocus
            type="search"
            placeholder="Search by symbol, type, or order ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="placeholder-gray-500 w-full rounded-lg border border-white/10 bg-[#102210] py-3 pl-10 pr-4 text-sm text-white focus:border-[#37ec13] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: Order;
  onModify: () => void;
  onCancel: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({order, onModify, onCancel}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return '🟢';
      case 'Partial':
        return '🟡';
      case 'Filled':
        return '✅';
      case 'Cancelled':
        return '❌';
      case 'Rejected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getProgressValue = () => {
    if (order.progress !== undefined) return order.progress;
    if (order.filledQuantity && order.totalQuantity) {
      return (order.filledQuantity / order.totalQuantity) * 100;
    }
    return 0;
  };

  const isActive = order.tab === 'Active';

  return (
    <div className="rounded-xl border border-[#37ec13]/10 bg-[#000000]/70 p-5 backdrop-blur-lg transition-all hover:border-[#37ec13]/30">
      {/* Header */}
      <div className="mb-4 flex justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{order.symbol}</h3>
            <span className="text-gray-500 rounded bg-white/5 px-2 py-0.5 text-[10px]">
              {order.exchange}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-xs">{order.type}</p>
          <p className="text-gray-500 mt-1 text-[10px]">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold">
            {order.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-gray-400 text-[10px]">{order.priceLabel}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-4 grid grid-cols-3 border-y border-white/5 py-4 text-xs">
        <div>
          <p className="text-gray-400 mb-1 text-[10px] uppercase">Side</p>
          <p className={`font-bold ${order.sideColor}`}>{order.side}</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1 text-[10px] uppercase">
            {order.filled ? 'Filled / Total' : 'Total'}
          </p>
          <p className="font-semibold">
            {order.filled ? (
              <>
                {order.filled}{' '}
                <span className="text-gray-400">
                  / {order.total} {order.unit}
                </span>
              </>
            ) : (
              `${order.total} ${order.unit}`
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-gray-400 mb-1 text-[10px] uppercase">Status</p>
          <p className={`font-semibold ${order.statusColor}`}>
            {getStatusIcon(order.status)} {order.status}
          </p>
        </div>
      </div>

      {/* Additional Info for Active Orders */}
      {isActive && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          {order.orderType && (
            <div>
              <p className="text-gray-400 text-[10px]">Order Type</p>
              <p className="capitalize">{order.orderType}</p>
            </div>
          )}
          {order.leverage && (
            <div>
              <p className="text-gray-400 text-[10px]">Leverage</p>
              <p>{order.leverage}x</p>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {isActive && getProgressValue() > 0 && getProgressValue() < 100 && (
        <div className="mb-4">
          <div className="bg-gray-700 h-1 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[#37ec13] transition-all"
              style={{width: `${getProgressValue()}%`}}
            />
          </div>
          <p className="text-gray-500 mt-1 text-right text-[10px]">
            {getProgressValue().toFixed(0)}% filled
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {isActive && (
        <div className="flex gap-3">
          <button
            onClick={onModify}
            className="flex-1 rounded-full border border-[#37ec13] py-2.5 text-sm font-semibold text-[#37ec13] transition hover:bg-[#37ec13] hover:text-black"
          >
            Modify
          </button>

          <button
            onClick={onCancel}
            className="text-gray-400 flex-1 rounded-full border border-transparent py-2.5 text-sm transition hover:bg-red-400/10 hover:text-red-400"
          >
            Cancel
          </button>
        </div>
      )}

      {/* View Details for Completed/Cancelled */}
      {!isActive && (
        <button
          onClick={() => console.log('View details:', order.id)}
          className="text-gray-400 w-full rounded-full border border-white/10 py-2.5 text-sm transition hover:bg-white/5 hover:text-white"
        >
          View Details
        </button>
      )}
    </div>
  );
};

export default OrderManagement;
