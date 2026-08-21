import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { cn } from './lib/utils';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonatePage from './pages/DonatePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome';
import MyDonationsPage from './pages/dashboard/MyDonationsPage';
import SupportRequestsPage from './pages/dashboard/SupportRequestsPage';
import MyCampaignsPage from './pages/dashboard/MyCampaignsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import AdminDonationsPage from './pages/admin/AdminDonationsPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import AdminGalleryPage from './pages/admin/AdminGalleryPage';
import AdminTestimonialsPage from './pages/admin/AdminTestimonialsPage';
import AdminHeroImagesPage from './pages/admin/AdminHeroImagesPage';
import PaymentReconciliationPage from './pages/admin/PaymentReconciliationPage';
import VerificationPage from './pages/admin/VerificationPage';
import InspectionsPage from './pages/admin/InspectionsPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminNewsPage from './pages/admin/AdminNewsPage';
import AdminFaqsPage from './pages/admin/AdminFaqsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';

const ADMIN_ROLES = ['KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'];

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) return (
    <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-900' : 'bg-gray-50')}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-gray-500')}>Loading...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const DR = (children: React.ReactNode) => (
  <ProtectedRoute><DashboardLayout>{children}</DashboardLayout></ProtectedRoute>
);
const AR = (children: React.ReactNode) => (
  <ProtectedRoute roles={ADMIN_ROLES}><DashboardLayout>{children}</DashboardLayout></ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/about"          element={<MainLayout><AboutPage /></MainLayout>} />
      <Route path="/donate"         element={<MainLayout><DonatePage /></MainLayout>} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/register"       element={<RegisterPage />} />
      <Route path="/payment/success" element={<MainLayout><PaymentSuccessPage /></MainLayout>} />
      <Route path="/payment/verify"  element={<MainLayout><PaymentSuccessPage /></MainLayout>} />

      {/* User Dashboard */}
      <Route path="/dashboard"                  element={DR(<DashboardHome />)} />
      <Route path="/dashboard/donate"           element={DR(<DonatePage />)} />
      <Route path="/dashboard/donations"        element={DR(<MyDonationsPage />)} />
      <Route path="/dashboard/requests"         element={DR(<SupportRequestsPage />)} />
      <Route path="/dashboard/campaigns"        element={DR(<MyCampaignsPage />)} />
      <Route path="/dashboard/notifications"    element={DR(<NotificationsPage />)} />
      <Route path="/dashboard/profile"          element={DR(<ProfilePage />)} />

      {/* Admin Panel */}
      <Route path="/admin"                element={AR(<AdminDashboard />)} />
      <Route path="/admin/users"          element={AR(<ManageUsersPage />)} />
      <Route path="/admin/verification"   element={AR(<VerificationPage />)} />
      <Route path="/admin/donations"      element={AR(<AdminDonationsPage />)} />
      <Route path="/admin/reconciliation" element={AR(<PaymentReconciliationPage />)} />
      <Route path="/admin/requests"       element={AR(<AdminRequestsPage />)} />
      <Route path="/admin/inspections"    element={AR(<InspectionsPage />)} />
      <Route path="/admin/reports"        element={AR(<ReportsPage />)} />
      <Route path="/admin/news"           element={AR(<AdminNewsPage />)} />
      <Route path="/admin/faqs"           element={AR(<AdminFaqsPage />)} />
      <Route path="/admin/events"         element={AR(<AdminEventsPage />)} />
      <Route path="/admin/messages"       element={AR(<AdminMessagesPage />)} />
      <Route path="/admin/gallery"        element={AR(<AdminGalleryPage />)} />
      <Route path="/admin/testimonials"   element={AR(<AdminTestimonialsPage />)} />
      <Route path="/admin/hero-images"    element={AR(<AdminHeroImagesPage />)} />
      <Route path="/admin/audit-logs"     element={
        <ProtectedRoute roles={['SUPER_ADMIN','CITY_ADMIN']}>
          <DashboardLayout><AuditLogsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/settings"       element={AR(<AdminSettingsPage />)} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
