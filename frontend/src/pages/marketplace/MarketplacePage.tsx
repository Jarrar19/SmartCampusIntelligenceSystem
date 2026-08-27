import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, Heart, Filter, 
  Tag, MapPin, Sparkles, MessageSquare, ArrowRight, ShieldCheck,
  BookOpen, Laptop, Shirt, Activity
} from 'lucide-react';
import { api, STORAGE_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { MarketplaceProduct, ProductCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
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
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isFavorited: res.data.favorited } : p))
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

  const categories = [
    { id: '', label: 'All Items' },
    { id: 'TEXTBOOK', label: 'Books & Textbooks' },
    { id: 'CALCULATOR', label: 'Calculators' },
    { id: 'LAB_COAT', label: 'Lab Coats & Aprons' },
    { id: 'ELECTRONICS', label: 'Electronics & Gadgets' },
    { id: 'HOSTEL_ITEM', label: 'Hostel Essentials' },
    { id: 'SPORTS', label: 'Sports Equipment' },
    { id: 'STATIONERY', label: 'Stationery' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
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

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          List Item For Sale / Free
        </Button>
      </div>

      {/* Filter & Category Selector */}
      <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items by title, author, brand, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-2xl text-xs font-medium pl-10 pr-4 py-2.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
            >
              <option value="">All Conditions</option>
              <option value="NEW">Brand New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good Condition</option>
              <option value="USED">Fair / Used</option>
              <option value="HEAVILY_USED">Heavily Used</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                categoryFilter === cat.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Products Found"
          description="No marketplace listings match your filter criteria. Try changing category or list your item!"
          actionText="List an Item"
          onAction={() => setShowCreateModal(true)}
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
                  {/* Image container with favorite button */}
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

                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black text-white bg-slate-950/80 backdrop-blur-md shadow-xs">
                        {product.price === 0 ? 'FREE' : `₹${product.price}`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, product.id)}
                      className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md transition shadow-xs cursor-pointer active:scale-90 ${
                        product.isFavorited
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500'
                      }`}
                      aria-label="Save to Wishlist"
                    >
                      <Heart className={`w-3.5 h-3.5 ${product.isFavorited ? 'fill-current' : ''}`} />
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

                    <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {product.title}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                      {product.seller?.fullName || 'Campus Peer'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {product.campusInfo || 'Campus Meetup'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleMessageSeller(e, product)}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 transition cursor-pointer flex-shrink-0"
                    title="Direct In-App Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onRefresh={fetchProducts}
        />
      )}

      {/* Create Product Listing Modal */}
      {showCreateModal && (
        <CreateProductModal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};
