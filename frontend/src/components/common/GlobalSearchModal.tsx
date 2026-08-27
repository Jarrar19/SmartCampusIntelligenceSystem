import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, ShoppingBag, X, CornerDownLeft, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Course, Resource, MarketplaceProduct } from '../../types';
import { Badge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, courseId?: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    courses: Course[];
    resources: Resource[];
    products: MarketplaceProduct[];
  }>({
    courses: [],
    resources: [],
    products: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      setQuery('');
      setResults({ courses: [], resources: [], products: [] });
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], resources: [], products: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [coursesRes, resourcesRes, productsRes] = await Promise.all([
          api.get(`/courses?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: [] } })),
          api.get(`/resources?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: [] } })),
          api.get(`/marketplace/products?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: [] } })),
        ]);

        const fetchedCourses: Course[] = coursesRes.data?.data || [];
        const fetchedResources: Resource[] = resourcesRes.data?.data || [];
        const fetchedProducts: MarketplaceProduct[] = productsRes.data?.data || [];

        setResults({
          courses: fetchedCourses.slice(0, 3),
          resources: fetchedResources.slice(0, 4),
          products: fetchedProducts.slice(0, 3),
        });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.courses.length + results.resources.length + results.products.length;

  const handleSelect = (tab: string, courseId?: number) => {
    onNavigate(tab, courseId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Campus Command Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-fade-in-up"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-950/30 overflow-hidden z-10 animate-fade-in-up">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search courses, past questions, lecture notes, marketplace items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {isSearching ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Searching campus intelligence database...</p>
            </div>
          ) : query.trim() && totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No results found for "{query}"</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Try searching for a course code like "CS301", a subject topic, or a textbook.
              </p>
            </div>
          ) : !query.trim() ? (
            <div className="py-8 px-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-brand-600 dark:text-brand-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Quick Navigation Shortcuts</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => handleSelect('courses')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500 text-left transition cursor-pointer group"
                >
                  <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">Academic Courses</p>
                  <p className="text-[10px] text-slate-500">View enrolled classes</p>
                </button>
                <button
                  onClick={() => handleSelect('resources')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500 text-left transition cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">Notes & PYQs</p>
                  <p className="text-[10px] text-slate-500">Download study docs</p>
                </button>
                <button
                  onClick={() => handleSelect('marketplace')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500 text-left transition cursor-pointer group col-span-2 sm:col-span-1"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">Marketplace</p>
                  <p className="text-[10px] text-slate-500">Books & lab items</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Courses Results */}
              {results.courses.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                    <span>Courses ({results.courses.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {results.courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => handleSelect('courses', course.id)}
                        className="w-full p-3 rounded-2xl hover:bg-indigo-50/60 dark:hover:bg-brand-950/30 border border-transparent hover:border-brand-200 dark:hover:border-brand-800/60 text-left transition flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                              {course.courseCode}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {course.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Semester {course.semester} • {course.department}
                          </p>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources Results */}
              {results.resources.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Notes & Past Questions ({results.resources.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {results.resources.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSelect('resources')}
                        className="w-full p-3 rounded-2xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 text-left transition flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="emerald" size="xs">
                              {res.category}
                            </Badge>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {res.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {res.subjectCode ? `${res.subjectCode} • ` : ''}Downloads: {res.downloadsCount}
                          </p>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketplace Results */}
              {results.products.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Marketplace Listings ({results.products.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {results.products.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => handleSelect('marketplace')}
                        className="w-full p-3 rounded-2xl hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60 text-left transition flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              {prod.price === 0 ? 'FREE' : `₹${prod.price}`}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {prod.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {prod.condition} • {prod.category}
                          </p>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">Smart Search v2.1</span>
        </div>
      </div>
    </div>
  );
};
