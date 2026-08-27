import React, { useState, useEffect } from 'react';
import { 
  Tag, ShoppingBag, CheckCircle2, XCircle, 
  Trash2, Clock, Check, ArrowRight, User, Sparkles
} from 'lucide-react';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MarketplaceProduct, PurchaseRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import { ListRowSkeleton } from '../../components/common/Skeleton';

export const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'received_requests' | 'listings' | 'sent_requests'>('received_requests');
  const [myListings, setMyListings] = useState<MarketplaceProduct[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PurchaseRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [listingsRes, receivedRes, sentRes] = await Promise.all([
        api.get('/marketplace/products?sellerId=' + user?.id),
        api.get('/marketplace/requests?type=received'),
        api.get('/marketplace/requests?type=sent'),
      ]);

      if (listingsRes.data.success) setMyListings(listingsRes.data.data);
      if (receivedRes.data.success) setReceivedRequests(receivedRes.data.data);
      if (sentRes.data.success) setSentRequests(sentRes.data.data);
    } catch (err) {
      error('Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRequestStatus = async (requestId: number, status: string) => {
    try {
      const res = await api.patch(`/marketplace/requests/${requestId}`, { status });
      if (res.data.success) {
        success(res.data.message);
        fetchData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDeleteListing = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/marketplace/products/${deletingProductId}`);
      if (res.data.success) {
        success('Listing deleted permanently');
        setDeletingProductId(null);
        fetchData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRequestBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="emerald" size="xs" dot>Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="rose" size="xs">Declined</Badge>;
      case 'COMPLETED':
        return <Badge variant="indigo" size="xs">Handover Completed</Badge>;
      default:
        return <Badge variant="amber" size="xs" dot>Pending Decision</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Marketplace Manager & Handover Portal</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your items for sale, accept buyer requests, and confirm zero-cost physical exchanges.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('received_requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              activeTab === 'received_requests'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Buyer Requests ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              activeTab === 'listings'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Active Listings ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('sent_requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              activeTab === 'sent_requests'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Sent Offers ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Content View */}
      {isLoading ? (
        <div className="space-y-4">
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      ) : activeTab === 'received_requests' ? (
        receivedRequests.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No Buyer Purchase Requests"
            description="When campus students send buy requests for your items, they will appear here for your confirmation."
          />
        ) : (
          <div className="space-y-4">
            {receivedRequests.map((req) => (
              <div
                key={req.id}
                className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {getRequestBadge(req.status)}
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Offer: {req.product?.price === 0 ? 'FREE' : `₹${req.product?.price}`}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Item: {req.product?.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 pt-1">
                    <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black text-xs flex items-center justify-center">
                      {req.buyer?.fullName.charAt(0) || 'B'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        Buyer: {req.buyer?.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {req.buyer?.department} • Sem {req.buyer?.semester || 6} • {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {req.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 font-medium">
                      "{req.message}"
                    </p>
                  )}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleUpdateRequestStatus(req.id, 'ACCEPTED')}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Accept & Coordinate Handover
                    </Button>
                  </div>
                )}

                {req.status === 'ACCEPTED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateRequestStatus(req.id, 'COMPLETED')}
                  >
                    Mark Handover Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'listings' ? (
        myListings.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No Active Listings"
            description="You haven't listed any textbooks, calculators, or campus items for sale yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {myListings.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {prod.price === 0 ? 'FREE' : `₹${prod.price}`}
                    </span>
                    <Badge variant="slate" size="xs">
                      {prod.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                    {prod.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {prod.condition} • {prod.category}
                  </span>

                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => setDeletingProductId(prod.id)}
                    leftIcon={<Trash2 className="w-3 h-3" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        sentRequests.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No Sent Purchase Offers"
            description="Offers you send on marketplace items will appear here."
          />
        ) : (
          <div className="space-y-4">
            {sentRequests.map((req) => (
              <div
                key={req.id}
                className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getRequestBadge(req.status)}
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {req.product?.title} (₹{req.product?.price})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Seller: {req.seller?.fullName || 'Campus Peer'} • Sent {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeletingProductId(null)}
          onConfirm={handleDeleteListing}
          title="Delete Marketplace Listing?"
          description="Are you sure you want to remove this product from the marketplace? This action cannot be undone."
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
