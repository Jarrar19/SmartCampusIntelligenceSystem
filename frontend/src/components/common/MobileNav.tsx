import React from 'react';
import { 
  X, LayoutDashboard, BookOpen, FileText, CheckSquare, 
  ShoppingBag, Heart, ShieldCheck, Inbox, MessageSquare, Tag,
  GraduationCap
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

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses & LMS', icon: BookOpen },
    { id: 'resources', label: 'Resource Hub & PYQs', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
    { id: 'my-listings', label: 'My Listings & Requests', icon: Tag },
    { id: 'wishlist', label: 'Wishlist & Saved', icon: Heart },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
  ];

  const facultyNavItems = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { 
      id: 'moderation', 
      label: 'Resource Moderation', 
      icon: Inbox,
      badge: pendingModerationCount > 0 ? pendingModerationCount : undefined 
    },
    { id: 'grading', label: 'Assignment Grading', icon: CheckSquare },
    { id: 'resources', label: 'Academic Resources', icon: FileText },
    { id: 'marketplace', label: 'Campus Marketplace', icon: ShoppingBag },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck },
  ];

  const navItems = isFaculty ? facultyNavItems : studentNavItems;

  const bottomItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'resources', label: 'PYQs/Notes', icon: FileText },
    { id: 'marketplace', label: 'Market', icon: ShoppingBag },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Slide-out Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 shadow-2xl p-5 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Smart Campus</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {isFaculty ? 'Faculty Portal' : 'Student Hub'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User badge */}
          <div className="my-4 p-3 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/60">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.fullName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
              {user?.email}
            </p>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 mt-3">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Campus Security</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Enforced
          </span>
        </div>
      </div>

      {/* Mobile Bottom Fixed Floating Dock */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl px-3 py-2 flex items-center justify-around shadow-2xl">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-extrabold bg-brand-50/80 dark:bg-brand-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Chat quick button */}
        <button
          onClick={onOpenChat}
          className="relative flex flex-col items-center py-1 px-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Chat</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-brand-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
