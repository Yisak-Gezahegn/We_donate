import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FileText, Bell, User,
  LogOut, Menu, X, Users, BarChart2, ClipboardList, ChevronRight, Heart, Target, Image,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

const ADMIN_ROLES = ['KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'];

interface SidebarProps {
  links: { to: string; icon: React.ElementType; label: string }[];
  user: { firstName: string; lastName: string; role: string } | null;
  location: { pathname: string };
  onClose: () => void;
  onLogout: () => void;
  logoutLabel: string;
  isDark: boolean;
}

function SidebarContent({ links, user, location, onClose, onLogout, logoutLabel, isDark }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn('px-6 py-5 border-b', isDark ? 'border-slate-700' : 'border-gray-100')}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-green-200 shadow-sm">
            <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className={cn('font-extrabold text-lg', isDark ? 'text-green-400' : 'text-green-800')}>
            We<span className="text-amber-500">Donate</span>
          </span>
        </Link>
      </div>

      {/* User Info */}
      {user && (
        <div className={cn('px-6 py-4 border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-gray-100')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
            </div>
            <div className="overflow-hidden">
              <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-green-500 font-medium capitalize">
                {user.role?.toLowerCase().replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-green-700 text-white shadow-md'
                  : cn(
                    isDark ? 'text-slate-300 hover:bg-slate-700 hover:text-green-400' : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
                  ),
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn('px-3 py-4 border-t', isDark ? 'border-slate-700' : 'border-gray-100')}>
        <button onClick={onLogout}
          className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 transition-colors',
            isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}>
          <LogOut className="w-4 h-4" />
          {logoutLabel}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const ORG_ROLES = ['NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];
  const canCreateCampaign = user && ORG_ROLES.includes(user.role);

  const donorLinks = [
    { to: '/dashboard',               icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/dashboard/donate',        icon: Heart,           label: t('nav.donate') },
    { to: '/dashboard/requests',      icon: ClipboardList,   label: 'My Requests' },
    ...(canCreateCampaign ? [{ to: '/dashboard/campaigns', icon: Target, label: 'My Campaigns' }] : []),
    { to: '/dashboard/donations',     icon: FileText,        label: t('dashboard.my_donations') },
    { to: '/dashboard/notifications', icon: Bell,            label: t('dashboard.notifications') },
    { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
  ];

  const beneficiaryLinks = donorLinks;

  const adminLinks = [
    { to: '/admin',              icon: BarChart2,    label: 'Overview' },
    { to: '/admin/users',        icon: Users,        label: 'Manage Users' },
    { to: '/admin/donations',    icon: Heart,        label: 'Donations' },
    { to: '/admin/requests',     icon: ClipboardList,label: 'Approvals' },
    { to: '/admin/gallery',      icon: Image,        label: 'Gallery' },
    { to: '/admin/audit-logs',   icon: FileText,     label: 'Audit Logs' },
  ];

  const links = isAdmin ? adminLinks
    : user?.role === 'BENEFICIARY' ? beneficiaryLinks
    : donorLinks;

  const handleLogout = () => { logout(); navigate('/'); };

  const sidebarProps: SidebarProps = {
    links, user: user ?? null, location,
    onClose: () => setSidebarOpen(false),
    onLogout: handleLogout,
    logoutLabel: t('nav.logout'),
    isDark,
  };

  return (
    <div className={cn('min-h-screen flex transition-colors duration-300', isDark ? 'bg-slate-900' : 'bg-gray-50')}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 border-r shadow-sm',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
      )}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className={cn('relative w-72 flex flex-col z-50 shadow-2xl',
            isDark ? 'bg-slate-800' : 'bg-white')}>
            <button className={cn('absolute top-4 right-4 p-1.5 rounded-lg z-10',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100')}
              onClick={() => setSidebarOpen(false)}>
              <X className={cn('w-5 h-5', isDark ? 'text-slate-300' : 'text-gray-600')} />
            </button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className={cn(
          'sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between border-b shadow-sm',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
        )}>
          <button onClick={() => setSidebarOpen(true)}
            className={cn('lg:hidden p-2 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:flex-none">
            <p className={cn('text-sm font-semibold hidden lg:block', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {t('dashboard.welcome')},{' '}
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{user?.firstName}</span> 👋
            </p>
          </div>
          <Link to="/dashboard/notifications"
            className={cn('relative p-2 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
