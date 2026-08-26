import React, { useState, useEffect } from 'react';
import { 
  Tag, ShoppingBag, CheckCircle2, XCircle, 
  Trash2, Clock, Check, ArrowRight, User 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MarketplaceProduct, PurchaseRequest } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'listings' | 'received_requests' | 'sent_requests'>('received_requests');
  const [myListings, setMyListings] = useState<MarketplaceProduct[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PurchaseRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      error('Failed to load marketplace dashboard data');
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

  const handleDeleteListing = async (productId: number) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      const res = await api.delete(`/marketplace/products/${productId}`);
      if (res.data.success) {
        success('Listing removed');
        fetchData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              activeTab === 'received_requests'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Buyer Requests ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              activeTab === 'listings'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Listings ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('sent_requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              activeTab === 'sent_requests'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sent Requests ({sentRequests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading listings...</div>
      ) : activeTab === 'received_requests' ? (
        /* Incoming Requests for Seller */
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No Incoming Purchase Requests" description="When students request your items, they will appear here for you to accept or reject." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {req.product?.price === 0 ? 'Free Giveaway' : `₹${req.product?.price}`}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {req.product?.title}
                      </span>
                      <Badge
                        variant={
                          req.status === 'ACCEPTED'
                            ? 'amber'
                            : req.status === 'COMPLETED'
                            ? 'emerald'
                            : req.status === 'REJECTED'
                            ? 'rose'
                            : 'indigo'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-300 font-semibold">
                      <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Buyer: <strong className="text-slate-800 dark:text-slate-200">{req.buyer?.fullName}</strong> ({req.buyer?.department || 'Student'})</span>
                    </div>

                    {req.message && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 max-w-xl font-medium">
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  {/* Seller Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'ACCEPTED')}
                          className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/25 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Reserve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                          className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-500/25 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {req.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'COMPLETED')}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/25 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark as Handed Over / Sold</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'listings' ? (
        /* My Listings */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myListings.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Tag} title="No Active Listings" description="You haven't listed any items for sale or giveaway yet." />
            </div>
          ) : (
            myListings.map((p) => (
              <div key={p.id} className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {p.price === 0 ? 'Free' : `₹${p.price}`}
                    </span>
                    <Badge variant={p.status === 'AVAILABLE' ? 'emerald' : p.status === 'RESERVED' ? 'amber' : 'slate'}>
                      {p.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span>{p.viewsCount} Views</span>
                  <button
                    onClick={() => handleDeleteListing(p.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* My Sent Requests */
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No Requests Made" description="Browse the marketplace and click 'Request Handover' to coordinate a physical handover." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {req.product?.price === 0 ? 'Free' : `₹${req.product?.price}`}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">{req.product?.title}</span>
                      <Badge variant={req.status === 'ACCEPTED' ? 'amber' : req.status === 'COMPLETED' ? 'emerald' : 'indigo'}>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Seller: <strong className="text-slate-800 dark:text-slate-200">{req.seller?.fullName}</strong> ({req.seller?.department || 'Student'})
                    </p>
                  </div>

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateRequestStatus(req.id, 'CANCELLED')}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 cursor-pointer transition active:scale-95"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
