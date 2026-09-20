import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { AuthPage } from './pages/auth/AuthPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

import { CoursesPage } from './pages/academic/CoursesPage';
import { ResourcesPage } from './pages/academic/ResourcesPage';
import { AssignmentsPage } from './pages/academic/AssignmentsPage';
import { GradingCenterPage } from './pages/academic/GradingCenterPage';
import { ModerationQueue } from './components/academic/ModerationQueue';
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { MyListingsPage } from './pages/marketplace/MyListingsPage';
import { WishlistPage } from './pages/marketplace/WishlistPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SmartAiPage } from './pages/academic/SmartAiPage';
import { NoticeBoardPage } from './pages/academic/NoticeBoardPage';
import { StudentDocxPage } from './pages/student/StudentDocxPage';
import { StudentSectionAdminPage } from './pages/admin/StudentSectionAdminPage';
import { ResourceUploadModal } from './components/academic/ResourceUploadModal';
import { CreateProductModal } from './components/marketplace/CreateProductModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { api } from './services/api';


import { useChat } from './context/ChatContext';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { isChatOpen, openChat, closeChat } = useChat();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUploadResourceModal, setShowUploadResourceModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Ctrl+K / Cmd+K key listener for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user?.role === 'FACULTY' || user?.role === 'ADMIN') {
      api.get('/resources/moderation-queue?status=PENDING_REVIEW')
        .then((res) => {
          if (res.data.success) {
            setPendingModerationCount(res.data.data.length);
          }
        })
        .catch(() => {});
    }
  }, [user, currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-white transition-colors">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          Loading Smart Campus Intelligence...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isFaculty = user.role === 'FACULTY' || user.role === 'ADMIN';

  const handleNavigate = (tab: string, courseId?: number) => {
    setCurrentTab(tab);
    setSelectedCourseId(courseId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white transition-colors duration-200 pb-16 lg:pb-0 relative bg-dot-pattern">

      {/* Top Navbar */}
      <Navbar 
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        onOpenChat={() => openChat()} 
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1500px] w-full mx-auto transition-all duration-300">
        {/* Left Sidebar for Desktop */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          pendingModerationCount={pendingModerationCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary>
            {currentTab === 'dashboard' && (
              user.role === 'ADMIN' ? (
                <AdminDashboard onNavigate={handleNavigate} />
              ) : user.role === 'STUDENT_SECTION' ? (
                <StudentSectionAdminPage />
              ) : isFaculty ? (
                <FacultyDashboard
                  onNavigate={handleNavigate}
                  onOpenCreateCourse={() => handleNavigate('courses')}
                  onOpenUploadResource={() => setShowUploadResourceModal(true)}
                />
              ) : (
                <StudentDashboard
                  onNavigate={handleNavigate}
                  onOpenUploadResource={() => setShowUploadResourceModal(true)}
                  onOpenCreateProduct={() => setShowCreateProductModal(true)}
                  onOpenChat={() => openChat()}
                />
              )
            )}

            {currentTab === 'student-docx' && (
              <StudentDocxPage />
            )}

            {currentTab === 'student-section-admin' && (
              <StudentSectionAdminPage />
            )}

            {currentTab === 'notice-board' && (
              <NoticeBoardPage />
            )}

            {currentTab === 'courses' && (
              <CoursesPage
                initialCourseId={selectedCourseId}
                onSelectCourse={(id) => setSelectedCourseId(id)}
              />
            )}

            {currentTab === 'resources' && (
              <ResourcesPage />
            )}

            {currentTab === 'moderation' && (
              <ModerationQueue />
            )}

            {currentTab === 'assignments' && (
              <AssignmentsPage />
            )}

            {currentTab === 'ai-advisor' && (
              <SmartAiPage />
            )}

            {currentTab === 'grading' && (
              <GradingCenterPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'marketplace' && (
              <MarketplacePage />
            )}

            {currentTab === 'my-listings' && (
              <MyListingsPage />
            )}

            {currentTab === 'wishlist' && (
              <WishlistPage />
            )}

            {currentTab === 'audit-logs' && (
              <AuditLogsPage />
            )}
          </ErrorBoundary>
        </main>

      </div>

      {/* Responsive Mobile Drawer & Bottom Bar */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        pendingModerationCount={pendingModerationCount}
        onOpenChat={() => openChat()}
      />

      {/* Realtime In-App Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={closeChat} />

      {/* Global Command Palette Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Global Action Modals */}
      <ResourceUploadModal
        isOpen={showUploadResourceModal}
        onClose={() => setShowUploadResourceModal(false)}
        onSuccess={() => {
          if (currentTab === 'resources') handleNavigate('resources');
        }}
      />

      <CreateProductModal
        isOpen={showCreateProductModal}
        onClose={() => setShowCreateProductModal(false)}
        onSuccess={() => {
          if (currentTab === 'marketplace') handleNavigate('marketplace');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <AppContent />
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
