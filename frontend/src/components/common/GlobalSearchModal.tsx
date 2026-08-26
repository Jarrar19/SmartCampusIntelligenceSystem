import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, ShoppingBag, X, CornerDownLeft } from 'lucide-react';
import { api } from '../../services/api';
import { Course, Resource, MarketplaceProduct } from '../../types';

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
    }, 250);

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
      aria-label="Global Campus Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, notes, PYQs, marketplace items..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer"
              aria-label="Clear Search Input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Type to search across Smart Campus Platform
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  📚 Enrolled Courses
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  📄 Exam PYQs & Notes
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  🛒 Campus Marketplace
                </span>
              </div>
            </div>
          ) : isSearching ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Searching campus resources...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching results found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for course codes like "CS505", "DBMS", "Notes", or "Calculator".</p>
            </div>
          ) : (
            <>
              {/* Courses Category */}
              {results.courses.length > 0 && (
                <div>
                  <h4 className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                    Courses ({results.courses.length})
                  </h4>
                  <div className="space-y-1">
                    {results.courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleSelect('courses', course.id)}
                        className="p-3 rounded-2xl hover:bg-brand-50/80 dark:hover:bg-brand-500/15 border border-transparent hover:border-brand-200 dark:hover:border-brand-500/30 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-black text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800">
                            {course.courseCode}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {course.department} • Semester {course.semester}
                            </p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources Category */}
              {results.resources.length > 0 && (
                <div>
                  <h4 className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    Notes & PYQs ({results.resources.length})
                  </h4>
                  <div className="space-y-1">
                    {results.resources.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleSelect('resources')}
                        className="p-3 rounded-2xl hover:bg-emerald-50/80 dark:hover:bg-emerald-500/15 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {res.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {res.category} • {res.subjectCode || res.department || 'General'}
                            </p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketplace Category */}
              {results.products.length > 0 && (
                <div>
                  <h4 className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                    Campus Marketplace ({results.products.length})
                  </h4>
                  <div className="space-y-1">
                    {results.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelect('marketplace')}
                        className="p-3 rounded-2xl hover:bg-rose-50/80 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                              {prod.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              ₹{prod.price} • {prod.category} ({prod.condition})
                            </p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Search Smart Campus Database</span>
          <span className="flex items-center gap-1">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold">↵</kbd> to jump
          </span>
        </div>
      </div>
    </div>
  );
};
