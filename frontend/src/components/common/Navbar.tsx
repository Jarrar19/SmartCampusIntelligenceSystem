import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, Bell, MessageSquare, LogOut, 
  Menu, BookOpen, ShoppingBag, Sun, Moon, 
  ShieldCheck, Inbox, PanelLeft, Search, CheckCheck, X
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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#061512]/80 backdrop-blur-2xl transition-colors duration-200 shadow-xl shadow-emerald-950/40">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto gap-4">
        {/* Left: Branding & Navigation Toggle */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 text-emerald-100/70 hover:text-white rounded-2xl hover:bg-white/10 transition cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 text-emerald-100/70 hover:text-white rounded-2xl hover:bg-white/10 transition cursor-pointer active:scale-95"
              title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
              aria-label="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 border border-emerald-300/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight tracking-tight">
                  Smart Campus
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/80">
                  {config?.collegeShortName || 'SBJIT'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl hover:border-brand-400 dark:hover:border-brand-500 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center space-x-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
              <span>Search courses, study notes, marketplace items...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right: Action Shortcuts & User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* Realtime Chat Button */}
          <button
            onClick={onOpenChat}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Campus Marketplace Chat"
            aria-label="Open Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
              aria-label="View Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl z-50 overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-brand-500 text-white rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead('all')}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        No notifications yet. You are all caught up!
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.id);
                        }}
                        className={`p-4 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-start space-x-3.5 ${
                          !notif.isRead ? 'bg-indigo-50/40 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0 shadow-2xs">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notif.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1.5 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu Container */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              aria-label="User profile options"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-brand-500/20">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:block text-left pr-1">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none truncate max-w-[120px]">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </button>

            {/* User Options Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl z-50 p-2 animate-fade-in-up">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge variant="indigo" size="xs">
                      {user?.role}
                    </Badge>
                    {user?.isVerified && (
                      <Badge variant="emerald" size="xs" dot>
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition cursor-pointer"
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
