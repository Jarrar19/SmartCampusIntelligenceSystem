import React, { useState } from 'react';
import { 
  ShoppingBag, Heart, MessageSquare, ShieldCheck, 
  MapPin, User, Tag, CheckCircle2, ShieldAlert, ArrowRight,
  ChevronLeft, ChevronRight, Check, Trash2
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { MarketplaceProduct } from '../../types';

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
  const primaryImgUrl = currentImage?.imagePath 
    ? (currentImage.imagePath.startsWith('http') ? currentImage.imagePath : `${STORAGE_BASE_URL}/${currentImage.imagePath}`)
    : null;

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

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this listing from the marketplace?')) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/marketplace/products/${product.id}`);
      if (res.data.success) {
        success('Listing deleted permanently');
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title}
      subtitle={`Category: ${product.category} • Condition: ${product.condition}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Image Gallery Column (6 cols) */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative w-full h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80">
              {primaryImgUrl ? (
                <img
                  src={primaryImgUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              )}

              <div className="absolute top-3 left-3">
                <span className="px-3 py-1.5 rounded-xl text-xs font-black text-white bg-slate-950/80 backdrop-blur-md shadow-xs">
                  {product.price === 0 ? 'FREE' : `₹${product.price}`}
                </span>
              </div>

              {/* Multiple images thumbnail selector */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center space-x-1.5">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        selectedImageIndex === idx ? 'bg-brand-500 w-6' : 'bg-white/60 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => {
                  const url = img.imagePath.startsWith('http') ? img.imagePath : `${STORAGE_BASE_URL}/${img.imagePath}`;
                  return (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition cursor-pointer ${
                        selectedImageIndex === idx ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column (6 cols) */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 flex-wrap">
                <Badge variant="emerald" size="xs">
                  {product.status}
                </Badge>
                <Badge variant="indigo" size="xs">
                  {product.condition}
                </Badge>
                <Badge variant="slate" size="xs">
                  {product.category}
                </Badge>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {product.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Meetup / Campus Handover Spot */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Campus Handover Spot
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {product.campusInfo || 'Campus Main Canteen / Library Ground Floor'}
                </p>
              </div>
            </div>

            {/* Seller Information */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-brand-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  {product.seller?.fullName?.charAt(0) || 'S'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {product.seller?.fullName || 'Campus Peer'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {product.seller?.department || 'Student'} • Sem {product.seller?.semester || 6}
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="xs" dot>
                Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Purchase Request Input */}
        {showRequestInput && !isMine && (
          <form onSubmit={handleSendRequest} className="p-4 rounded-3xl bg-indigo-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 space-y-3 animate-fade-in-up">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              Send Official Purchase Request to Seller
            </h4>
            <textarea
              placeholder="Hi, I would like to buy this item. Can we meet at the campus library tomorrow?"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              rows={2}
              className="w-full glass-input rounded-2xl text-xs font-medium px-4 py-2.5 focus:outline-none"
              required
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="xs" onClick={() => setShowRequestInput(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs" isLoading={isSubmitting}>
                Confirm Request
              </Button>
            </div>
          </form>
        )}

        {/* Action Buttons Row */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={product.isFavorited ? 'primary' : 'outline'}
              size="sm"
              onClick={handleFavorite}
              leftIcon={<Heart className={`w-3.5 h-3.5 ${product.isFavorited ? 'fill-current' : ''}`} />}
            >
              {product.isFavorited ? 'Saved in Wishlist' : 'Save Item'}
            </Button>
            <button
              onClick={handleReport}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Report suspicious listing"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>

          {isMine ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProduct}
              isLoading={isSubmitting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete My Listing
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartChat}
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Chat with Seller
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={() => setShowRequestInput(true)}
                leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
              >
                Request to Buy
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
