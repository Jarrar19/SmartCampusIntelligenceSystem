import React from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, CheckSquare, ShoppingBag, 
  ShieldCheck, Heart, Tag, Inbox, PanelLeftClose, PanelLeft
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
      title: 'Academic',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'resources', label: 'Notes & PYQs', icon: FileText },
        { id: 'assignments', label: 'Tasks', icon: CheckSquare },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { id: 'marketplace', label: 'Browse Market', icon: ShoppingBag },
        { id: 'my-listings', label: 'My Items', icon: Tag },
        { id: 'wishlist', label: 'Saved Items', icon: Heart },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'audit-logs', label: 'Security & Audit', icon: ShieldCheck },
      ],
    },
  ];

  const facultySections: NavSection[] = [
    {
      title: 'Academic & Moderation',
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
      title: 'Marketplace',
      items: [
        { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'audit-logs', label: 'Audit Trail', icon: ShieldCheck },
      ],
    },
  ];

  const sections = isFaculty ? facultySections : studentSections;

  return (
    <aside
      className={`flex-shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 min-h-[calc(100vh-4rem)] p-3.5 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="space-y-6">
        {/* User Context Strip */}
        {!isCollapsed && (
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                {user?.department || 'Student'} • {isFaculty ? 'Faculty' : `Sem ${user?.semester || 6}`}
              </p>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Collapse Sidebar"
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
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Categorized Navigation */}
        <div className="space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </h4>
              )}
              {isCollapsed && idx > 0 && (
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded-lg text-xs transition-colors cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                      } ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-bold border-l-2 border-brand-600 dark:border-brand-500 pl-2.5'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>

                      {item.badge !== undefined && (
                        isCollapsed ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
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
        <div className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
          Smart Campus Intelligence v2.0
        </div>
      )}
    </aside>
  );
};

