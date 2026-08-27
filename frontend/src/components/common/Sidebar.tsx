import React from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, CheckSquare, ShoppingBag, 
  ShieldCheck, Heart, Tag, Inbox, PanelLeftClose, PanelLeft,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingModerationCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: any;
    badge?: number;
    badgeVariant?: 'amber' | 'emerald' | 'indigo';
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingModerationCount = 0,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const studentSections: NavSection[] = [
    {
      title: 'Academic & Learning',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'resources', label: 'Notes & PYQs', icon: FileText },
        { id: 'assignments', label: 'Tasks & Homework', icon: CheckSquare },
      ],
    },
    {
      title: 'Campus Marketplace',
      items: [
        { id: 'marketplace', label: 'Explore Market', icon: ShoppingBag },
        { id: 'my-listings', label: 'My Listings', icon: Tag },
        { id: 'wishlist', label: 'Saved Items', icon: Heart },
      ],
    },
    {
      title: 'Security & Audit',
      items: [
        { id: 'audit-logs', label: 'Security Logs', icon: ShieldCheck },
      ],
    },
  ];

  const facultySections: NavSection[] = [
    {
      title: 'Instruction & Moderation',
      items: [
        { id: 'dashboard', label: 'Faculty Cockpit', icon: LayoutDashboard },
        { id: 'courses', label: 'Course Management', icon: BookOpen },
        { 
          id: 'moderation', 
          label: 'Resource Moderation', 
          icon: Inbox,
          badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
          badgeVariant: 'amber'
        },
        { id: 'grading', label: 'Grading Evaluation', icon: CheckSquare },
        { id: 'resources', label: 'Resource Library', icon: FileText },
      ],
    },
    {
      title: 'Campus Marketplace',
      items: [
        { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
      ],
    },
    {
      title: 'System & Audit',
      items: [
        { id: 'audit-logs', label: 'Security Trail', icon: ShieldCheck },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      title: 'Campus Governance',
      items: [
        { id: 'dashboard', label: 'Admin Control Center', icon: LayoutDashboard },
        { id: 'courses', label: 'Course Catalog', icon: BookOpen },
        { 
          id: 'moderation', 
          label: 'Academic Moderation', 
          icon: Inbox,
          badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
          badgeVariant: 'amber'
        },
        { id: 'resources', label: 'Global Repository', icon: FileText },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
      ],
    },
    {
      title: 'Audit & Compliance',
      items: [
        { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
      ],
    },
  ];

  const sections = user?.role === 'ADMIN' ? adminSections : isFaculty ? facultySections : studentSections;

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`flex-shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl min-h-[calc(100vh-4rem)] p-3.5 transition-all duration-300 select-none shadow-2xs ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="space-y-6">
        {/* User Context Strip */}
        {!isCollapsed && (
          <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between shadow-2xs">
            <div className="truncate pr-2">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <span>{user?.fullName}</span>
                {user?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
                {user?.department || 'Engineering'} • {isFaculty ? user?.role : `Sem ${user?.semester || 6}`}
              </p>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer active:scale-90"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {isCollapsed && onToggleCollapse && (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Categorized Navigation */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed && (
                <h4 className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h4>
              )}
              {isCollapsed && idx > 0 && (
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded-2xl text-xs transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                      } ${
                        isActive
                          ? 'bg-brand-600 text-white font-black shadow-md shadow-brand-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-bold'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>

                      {item.badge !== undefined && (
                        isCollapsed ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50'
                          }`}>
                            {item.badge}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-3.5 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold">
              Smart Campus Intelligence
            </span>
          </div>
          <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-800/80">
            v2.1
          </span>
        </div>
      )}
    </aside>
  );
};
