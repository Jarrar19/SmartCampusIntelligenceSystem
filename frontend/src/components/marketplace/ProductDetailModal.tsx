import React, { useState } from 'react';
import { 
  ShoppingBag, Heart, MessageSquare, ShieldCheck, 
  MapPin, User, Tag, CheckCircle2, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { MarketplaceProduct } from '../../types';
import { Badge } from '../common/Badge';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MarketplaceProduct | null;
  onRefresh: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { startConversationWithProduct } = useChat();

  const [requestNote, setRequestNote] = useState('');
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const isMine = product.sellerId === user?.id;
  const currentImage = product.images?.[selectedImageIndex] || product.images?.[0];

  const handleFavorite = async () => {
    try {
      const res = await api.post(`/marketplace/products/${product.id}/favorite`);
      if (res.data.success) {
        success(res.data.message);
        onRefresh();
      }
    } catch (err) {
      error('Failed to update wishlist');
    }
  };

  const handleStartChat = async () => {
    const convId = await startConversationWithProduct(product.id, `Hi, I am interested in "${product.title}". Is it available for campus exchange?`);
    if (convId) {
      onClose();
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(`/marketplace/products/${product.id}/request`, {
        message: requestNote.trim() || 'I would like to purchase this item.',
      });
      if (res.data.success) {
        success(res.data.message);
        setShowRequestInput(false);
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Please enter the reason for reporting this listing:');
    if (!reason) return;
    try {
      const res = await api.post('/marketplace/reports', {
        targetType: 'PRODUCT',
        targetId: String(product.id),
        reason,
      });
      if (res.data.success) {
        success('Listing reported to campus safety & moderation team.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Report failed');
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'AVAILABLE':
        return <Badge variant="emerald">Available for Handover</Badge>;
      case 'RESERVED':
        return <Badge variant="amber">Reserved</Badge>;
      case 'SOLD':
        return <Badge variant="slate">Sold</Badge>;
      default:
        return <Badge variant="slate">{product.status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title}
      subtitle={`Category: ${product.category} • Listed by verified university peer`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Images & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-3">
            <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 aspect-square flex items-center justify-center relative shadow-inner">
              {currentImage ? (
                <img
                  src={`${STORAGE_BASE_URL}/${currentImage.imagePath}`}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                  }}
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <span className="text-xs font-semibold">No image provided</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                {getStatusBadge()}
              </div>
              <button
                onClick={handleFavorite}
                className={`absolute top-3 right-3 p-2 rounded-2xl backdrop-blur-md transition cursor-pointer shadow-xs active:scale-90 ${
                  product.isFavorited
                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40'
                    : 'bg-white/85 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${product.isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Selector Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition cursor-pointer flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-brand-600 dark:border-brand-400 scale-105 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`${STORAGE_BASE_URL}/${img.imagePath}`}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {product.price === 0 ? 'Free Giveaway' : `₹${product.price}`}
                </span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Condition: {product.condition}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Description
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                  {product.description}
                </p>
              </div>

              {product.campusInfo && (
                <div className="mt-4 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-700/60 font-medium">
                  <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                  <span>Handover spot: <strong className="text-slate-900 dark:text-white">{product.campusInfo}</strong></span>
                </div>
              )}
            </div>

            {/* Seller Info (Privacy Preserving) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                    {product.seller?.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                      {product.seller?.fullName || 'Campus Seller'}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {product.seller?.semester ? `${product.seller.semester}th Sem • ` : ''}{product.seller?.department || 'Verified Student'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReport}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Workflow / Contact Buttons */}
        {!isMine && product.status === 'AVAILABLE' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {!showRequestInput ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleStartChat}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-black text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Message Seller Privately</span>
                </button>
                <button
                  onClick={() => setShowRequestInput(true)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Request Handover (₹0 Platform Fee)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                <p className="text-xs font-black text-slate-900 dark:text-white">Send Handover Request to Seller</p>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Can we meet outside library at 3 PM?"
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                />
                <div className="flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setShowRequestInput(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-black text-white bg-brand-600 hover:bg-brand-500 rounded-2xl shadow-md shadow-brand-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? 'Sending...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {isMine && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-brand-500/10 border border-indigo-100 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs text-center font-bold">
            This is your active listing. You can manage incoming buyer requests from your "My Listings & Requests" tab.
          </div>
        )}
      </div>
    </Modal>
  );
};
