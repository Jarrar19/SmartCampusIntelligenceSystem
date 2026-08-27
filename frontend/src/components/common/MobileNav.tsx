import React from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, CheckSquare, 
  ShoppingBag, Tag, Heart, ShieldCheck, Inbox, 
  X, MessageSquare, Sun, Moon, LogOut, LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingModerationCount?: number;
  onOpenChat: () => void;
}

interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string | undefined;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  pendingModerationCount = 0,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const { unreadMessagesCount } = useChat();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const studentNavItems: MobileNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'resources', label: 'Notes & PYQs', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'my-listings', label: 'My Items', icon: Tag },
    { id: 'wishlist', label: 'Saved Items', icon: Heart },
    { id: 'audit-logs', label: 'Security Logs', icon: ShieldCheck },
  ];

  const facultyNavItems: MobileNavItem[] = [
    { id: 'dashboard', label: 'Faculty Cockpit', icon: LayoutDashboard },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { 
      id: 'moderation', 
      label: 'Resource Moderation', 
      icon: Inbox,
      badge: pendingModerationCount > 0 ? pendingModerationCount : undefined 
    },
    { id: 'grading', label: 'Grading Center', icon: CheckSquare },
    { id: 'resources', label: 'Resource Library', icon: FileText },
    { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
    { id: 'audit-logs', label: 'Audit Trail', icon: ShieldCheck },
  ];

  const adminNavItems: MobileNavItem[] = [
    { id: 'dashboard', label: 'Admin Cockpit', icon: LayoutDashboard },
    { id: 'courses', label: 'All Courses', icon: BookOpen },
    { 
      id: 'moderation', 
      label: 'Academic Moderation', 
      icon: Inbox,
      badge: pendingModerationCount > 0 ? pendingModerationCount : undefined 
    },
    { id: 'resources', label: 'Global Repository', icon: FileText },
    { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
  ];

  const navItems: MobileNavItem[] = user?.role === 'ADMIN' ? adminNavItems : isFaculty ? facultyNavItems : studentNavItems;

  const bottomItems: MobileNavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'resources', label: 'Study Docs', icon: FileText },
    { id: 'marketplace', label: 'Market', icon: ShoppingBag },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity animate-fade-in-up"
          onClick={onClose}
        />
      )}

      {/* Slide-out Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[300px] z-50 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                SC
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Navigation
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          {user && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                  {user.role} {user.semester ? `• Sem ${user.semester}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onOpenChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 hover:bg-indigo-100 dark:hover:bg-brand-500/25 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>Campus Messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 lg:hidden px-2 py-2 flex items-center justify-around shadow-lg">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
