import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, Heart, Filter, 
  Tag, MapPin, Sparkles, MessageSquare, ArrowRight, ShieldCheck
} from 'lucide-react';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { MarketplaceProduct, ProductCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateProductModal } from '../../components/marketplace/CreateProductModal';
import { ProductDetailModal } from '../../components/marketplace/ProductDetailModal';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { startConversationWithProduct } = useChat();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (conditionFilter) params.append('condition', conditionFilter);
      if (sortBy) params.append('sort', sortBy);

      const res = await api.get(`/marketplace/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      error('Failed to load marketplace products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, conditionFilter, sortBy]);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/marketplace/products/${productId}/favorite`);
      if (res.data.success) {
        success(res.data.message);
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, isFavorited: res.data.favorited } : p))
        );
      }
    } catch (err) {
      error('Failed to update wishlist');
    }
  };

  const handleMessageSeller = async (e: React.MouseEvent, product: MarketplaceProduct) => {
    e.stopPropagation();
    await startConversationWithProduct(product.id, `Hi, is your listing "${product.title}" still available for campus handover?`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Campus Student Marketplace</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Zero-fee student commerce with private in-app chat, verified seller tags, and secure on-campus exchange spots.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 flex items-center gap-2 transition flex-shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>List Item For Sale / Free</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search textbooks, calculators, lab coats, engineering kits..."
              className="w-full glass-input rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="TEXTBOOK">Textbooks</option>
              <option value="CALCULATOR">Calculators</option>
              <option value="LAB_COAT">Lab Coats</option>
              <option value="STATIONERY">Stationery</option>
              <option value="ELECTRONICS">Electronics / Kits</option>
              <option value="HOSTEL_ITEM">Hostel Essentials</option>
              <option value="SPORTS">Sports Gear</option>
              <option value="ACADEMIC_MATERIAL">Academic Material</option>
              <option value="OTHER">Other Items</option>
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="">All Conditions</option>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="USED">Used</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading campus marketplace...</div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Products Found"
          description="Try broadening your search query or be the first to list a textbook or dorm item."
          actionText="List New Item"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="glass-panel glass-panel-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between group relative"
            >
              {/* Product Thumbnail */}
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={`${STORAGE_BASE_URL}/${product.images[0].imagePath}`}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                )}

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {product.category}
                  </span>
                </div>

                <button
                  onClick={(e) => handleToggleFavorite(e, product.id)}
                  className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition cursor-pointer shadow-xs active:scale-90 ${
                    product.isFavorited
                      ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40'
                      : 'bg-white/85 dark:bg-slate-950/70 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${product.isFavorited ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {product.price === 0 ? 'Free Giveaway' : `₹${product.price}`}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {product.condition}
                  </span>
                </div>

                <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                  {product.title}
                </h3>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {product.description}
                </p>

                {product.campusInfo && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate pt-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                    <span className="truncate">{product.campusInfo}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-semibold">
                  By {product.seller?.fullName?.split(' ')[0] || 'Student'}
                </span>

                <div className="flex items-center gap-1.5">
                  {!product.isMine && (
                    <button
                      onClick={(e) => handleMessageSeller(e, product)}
                      title="Message Seller"
                      className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-slate-700 transition cursor-pointer active:scale-90"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition shadow-xs cursor-pointer active:scale-95"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchProducts}
      />

      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onRefresh={fetchProducts}
      />
    </div>
  );
};
