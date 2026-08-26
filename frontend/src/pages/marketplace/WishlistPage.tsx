import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, MapPin, Sparkles } from 'lucide-react';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MarketplaceProduct } from '../../types';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductDetailModal } from '../../components/marketplace/ProductDetailModal';

export const WishlistPage: React.FC = () => {
  const { success, error } = useToast();
  const [favorites, setFavorites] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/marketplace/products');
      if (res.data.success) {
        setFavorites(res.data.data.filter((p: MarketplaceProduct) => p.isFavorited));
      }
    } catch (err) {
      error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFavorite = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/marketplace/products/${productId}/favorite`);
      if (res.data.success) {
        success('Removed from wishlist');
        setFavorites(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      error('Failed to update wishlist');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span>Saved Wishlist & Bookmarked Items</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quickly access products you've saved for future coursework, lab work, or campus living needs.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading saved items...</div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Click the heart icon on any campus marketplace item to save it here for quick access."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {favorites.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="glass-panel glass-panel-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group relative"
            >
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800/80 relative flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={`${STORAGE_BASE_URL}/${product.images[0].imagePath}`}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                )}

                <button
                  onClick={(e) => handleRemoveFavorite(e, product.id)}
                  className="absolute top-3 right-3 p-2 rounded-2xl bg-white/90 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 shadow-xs cursor-pointer active:scale-90 transition"
                  title="Remove from saved wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {product.price === 0 ? 'Free Giveaway' : `₹${product.price}`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{product.condition}</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{product.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onRefresh={fetchWishlist}
      />
    </div>
  );
};
