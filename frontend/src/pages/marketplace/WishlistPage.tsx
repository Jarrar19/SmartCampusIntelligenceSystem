import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MarketplaceProduct } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import { ProductDetailModal } from '../../components/marketplace/ProductDetailModal';

export const WishlistPage: React.FC = () => {
  const { success, error } = useToast();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/marketplace/products');
      if (res.data.success) {
        setProducts(res.data.data.filter((p: MarketplaceProduct) => p.isFavorited));
      }
    } catch (err) {
      error('Failed to load wishlist items');
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
        success('Item removed from wishlist');
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      error('Failed to update wishlist');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span>Saved Marketplace Items & Wishlist</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quickly monitor prices and availability of saved textbooks, calculators, and gadgets.
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Click the heart icon on any campus marketplace listing to bookmark it here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => {
            const primaryImg = product.images?.[0]?.imagePath;
            const imgUrl = primaryImg ? (primaryImg.startsWith('http') ? primaryImg : `${STORAGE_BASE_URL}/${primaryImg}`) : null;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    )}

                    <div className="absolute top-2 left-2">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black text-white bg-slate-950/80 backdrop-blur-md">
                        {product.price === 0 ? 'FREE' : `₹${product.price}`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleRemoveFavorite(e, product.id)}
                      className="absolute top-2 right-2 p-2 rounded-xl bg-rose-500 text-white shadow-xs hover:bg-rose-600 transition cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="slate" size="xs">
                        {product.category}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400">
                        {product.condition}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                      {product.title}
                    </h3>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {product.seller?.fullName || 'Seller'}
                  </span>
                  <span className="text-xs font-black text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                    View Details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onRefresh={fetchWishlist}
        />
      )}
    </div>
  );
};
