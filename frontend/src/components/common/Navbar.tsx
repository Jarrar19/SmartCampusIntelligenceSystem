import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, Bell, MessageSquare, User as UserIcon, 
  LogOut, Shield, Check, ExternalLink, Menu, X, Sparkles, BookOpen, 
  ShoppingBag, Sun, Moon, CheckCheck, ShieldCheck, Inbox, PanelLeft, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  onOpenChat?: () => void;
  onOpenSearch?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenMobileMenu, 
  onOpenChat, 
  onOpenSearch,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const { user, config, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { unreadMessagesCount } = useChat();
  const { toggleTheme, isDark } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT':
        return <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      case 'MARKETPLACE':
      case 'CHAT':
        return <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'MODERATION':
        return <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl transition-colors duration-200 shadow-2xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto gap-4">
        {/* Left: Branding & Navigation Toggle */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
              aria-label="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Smart Campus
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hidden sm:inline-block">
                  {config?.collegeShortName || 'SBIT'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Prominent Global Search Field */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-normal transition cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search courses, notes, PYQs, marketplace...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Search Icon (Mobile), Theme Switcher & User Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/80 dark:border-slate-800 shadow-2xs"
            title="Search Smart Campus"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-2xs cursor-pointer active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Realtime Chat Button */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Campus Marketplace Messenger"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-bold">Messenger</span>
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-black text-white bg-brand-600 rounded-full border-2 border-white dark:border-slate-900 animate-pulse badge-glow">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-slate-200/80 dark:border-slate-800 shadow-2xs cursor-pointer active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-black text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Campus Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead('all')}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold transition cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 py-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No new campus announcements or alerts.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 rounded-2xl transition cursor-pointer flex items-start space-x-3 ${
                          n.isRead 
                            ? 'opacity-65 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                            : 'bg-brand-50/80 dark:bg-brand-500/15 hover:bg-brand-100/60 dark:hover:bg-brand-500/20 border border-brand-100 dark:border-brand-500/25'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xs mt-0.5">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-slate-200/80 dark:border-slate-800 shadow-2xs cursor-pointer"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs shadow-2xs">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left hidden lg:block pr-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  {user?.fullName}
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                  {user?.role === 'FACULTY' ? 'Faculty Member' : `${user?.semester}th Sem • ${user?.department || 'Student'}`}
                </p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-72 rounded-3xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/60 mb-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate mt-0.5">{user?.email}</p>
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <Badge variant={user?.role === 'FACULTY' ? 'indigo' : 'emerald'} size="sm">
                      {user?.role}
                    </Badge>
                    {user?.isVerified && (
                      <Badge variant="blue" size="sm">Verified Campus Email</Badge>
                    )}
                  </div>
                </div>

                <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Department:</span>
                    <span className="truncate max-w-[140px] text-slate-600 dark:text-slate-400 text-right">{user?.department || 'General'}</span>
                  </div>
                  {user?.semester && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Current Semester:</span>
                      <span className="text-slate-600 dark:text-slate-400">{user.semester}th</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
