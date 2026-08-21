import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, FileText, Bell, User,
  LogOut, Menu, X, Users, BarChart2, ClipboardList, ChevronRight, Heart, Target, Image, Quote, Images,
  Sun, Moon, Globe, ChevronDown, BadgeCheck, Receipt, Search, FileBarChart, Newspaper,
  HelpCircle, Calendar, Mail, Settings, CheckCheck, Trash2,
} from 'lucide-react';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn, timeAgo } from '../../lib/utils';
import api from '../../lib/api';

const ADMIN_ROLES = ['KEBELE_ADMIN', 'WOREDA_ADMIN', 'CITY_ADMIN', 'SUPER_ADMIN'];

interface SidebarProps {
  links: { to: string; icon: React.ElementType; label: string }[];
  user: { firstName: string; lastName: string; role: string; profileImage?: string } | null;
  location: { pathname: string };
  onClose: () => void;
  onLogout: () => void;
  logoutLabel: string;
  isDark: boolean;
  collapsed?: boolean;
}

function SidebarContent({ links, user, location, onClose, onLogout, logoutLabel, isDark, collapsed }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={cn('px-6 py-5 border-b', isDark ? 'border-slate-700' : 'border-gray-100', collapsed && 'px-3 py-4 flex justify-center')}>
        {collapsed ? (
          <Link to="/" className="flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-green-200 shadow-sm">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-green-200 shadow-sm">
              <img src="/adama_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={cn('font-extrabold text-lg', isDark ? 'text-green-400' : 'text-green-800')}>
              We<span className="text-amber-500">Donate</span>
            </span>
          </Link>
        )}
      </div>

      {user && !collapsed && (
        <div className={cn('px-6 py-4 border-b', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-gray-100')}>
          <div className="flex items-center gap-3">
            {(user as any)?.profileImage ? (
              <img src={(user as any).profileImage} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
              </div>
            )}
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
      {user && collapsed && (
        <div className={cn('px-3 py-4 border-b flex justify-center', isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-gray-100')}>
          {(user as any)?.profileImage ? (
            <img src={(user as any).profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm">
              {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
            </div>
          )}
        </div>
      )}

      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
                collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3',
                active
                  ? 'bg-green-700 text-white shadow-md'
                  : (isDark ? 'text-slate-300 hover:bg-slate-700 hover:text-green-400' : 'text-gray-600 hover:bg-green-50 hover:text-green-700'),
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 opacity-70" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn('px-3 py-4 border-t', isDark ? 'border-slate-700' : 'border-gray-100')}>
        <button onClick={onLogout}
          title={collapsed ? logoutLabel : undefined}
          className={cn('w-full flex items-center gap-3 rounded-xl text-sm font-medium text-red-500 transition-colors',
            collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3',
            isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}>
          <LogOut className="w-4 h-4" />
          {!collapsed && logoutLabel}
        </button>
      </div>
    </div>
  );
}

function NotificationDropdown({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className={cn('relative p-2 rounded-xl transition-colors',
          isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
        )}>
          <div className={cn('flex items-center justify-between px-4 py-3 border-b',
            isDark ? 'border-slate-700' : 'border-gray-100')}>
            <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>Notifications</h3>
            <div className="flex gap-1">
              <button onClick={() => markAllRead.mutate()}
                className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors',
                  isDark ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50')}>
                <CheckCheck className="w-3 h-3" /> Mark All Read
              </button>
              <button onClick={() => clearAll.mutate()}
                className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors',
                  isDark ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50')}>
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!notifications?.length ? (
              <div className={cn('text-center py-8 text-sm', isDark ? 'text-slate-500' : 'text-gray-400')}>
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((n: any) => (
                <div key={n.id}
                  onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
                  className={cn('px-4 py-3 border-b cursor-pointer transition-colors',
                    isDark ? 'border-slate-700/50 hover:bg-slate-700/50' : 'border-gray-50 hover:bg-gray-50',
                    !n.isRead && (isDark ? 'bg-blue-900/10' : 'bg-blue-50/50'))}>
                  <div className="flex items-start gap-2">
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{n.title}</p>
                      <p className={cn('text-[10px] mt-0.5 truncate', isDark ? 'text-slate-400' : 'text-gray-500')}>{n.message}</p>
                      <p className={cn('text-[10px] mt-1', isDark ? 'text-slate-600' : 'text-gray-400')}>{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/dashboard/notifications" onClick={() => setOpen(false)}
            className={cn('block text-center text-xs font-semibold py-3 border-t transition-colors',
              isDark ? 'border-slate-700 text-green-400 hover:bg-slate-700' : 'border-gray-100 text-green-700 hover:bg-green-50')}>
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [langOpen, setLangOpen] = useState(false);

  const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
    { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  ];
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const ORG_ROLES = ['NGO','ORGANIZATION','GOVERNMENTAL_ORG','KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'];
  const canCreateCampaign = user && ORG_ROLES.includes(user.role);

  const donorLinks = [
    { to: '/dashboard',               icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/dashboard/donate',        icon: Heart,           label: t('nav.donate') },
    { to: '/dashboard/requests',      icon: ClipboardList,   label: t('dashboard.my_requests') },
    ...(canCreateCampaign ? [{ to: '/dashboard/campaigns', icon: Target, label: t('dashboard.my_campaigns') }] : []),
    { to: '/dashboard/donations',     icon: FileText,        label: t('dashboard.my_donations') },
    { to: '/dashboard/notifications', icon: Bell,            label: t('dashboard.notifications') },
    { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
  ];

  const beneficiaryLinks = donorLinks;

  const adminLinks = [
    { to: '/admin',                icon: BarChart2,     label: t('admin.overview') },
    { to: '/admin/users',          icon: Users,         label: t('admin.manage_users') },
    { to: '/admin/verification',   icon: BadgeCheck,    label: t('admin.verification') },
    { to: '/admin/donations',      icon: Heart,         label: t('admin.donations') },
    { to: '/admin/reconciliation', icon: Receipt,       label: t('admin.reconciliation') },
    { to: '/admin/requests',       icon: ClipboardList, label: t('admin.approvals') },
    { to: '/admin/inspections',    icon: Search,        label: t('admin.inspections') },
    { to: '/admin/reports',        icon: FileBarChart,  label: t('admin.reports') },
    { to: '/admin/news',           icon: Newspaper,     label: t('admin.news') },
    { to: '/admin/faqs',           icon: HelpCircle,    label: t('admin.faqs') },
    { to: '/admin/events',         icon: Calendar,      label: t('admin.events') },
    { to: '/admin/messages',       icon: Mail,          label: t('admin.messages') },
    { to: '/admin/gallery',        icon: Image,         label: t('admin.gallery') },
    { to: '/admin/testimonials',   icon: Quote,         label: t('admin.testimonials') },
    { to: '/admin/hero-images',    icon: Images,        label: t('admin.hero_images') },
    { to: '/admin/audit-logs',     icon: FileText,      label: t('admin.audit_logs') },
    { to: '/admin/settings',       icon: Settings,      label: t('admin.settings') },
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
      <aside className={cn(
        'hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r shadow-sm transition-all duration-300',
        sidebarExpanded ? 'w-64' : 'w-20',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
      )}>
        <SidebarContent {...sidebarProps} collapsed={!sidebarExpanded} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className={cn('relative w-72 flex flex-col z-50 shadow-2xl', isDark ? 'bg-slate-800' : 'bg-white')}>
            <button className={cn('absolute top-4 right-4 p-1.5 rounded-lg z-10',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100')}
              onClick={() => setSidebarOpen(false)}>
              <X className={cn('w-5 h-5', isDark ? 'text-slate-300' : 'text-gray-600')} />
            </button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300', sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20')}>
        <header className={cn(
          'sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between border-b shadow-sm',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
        )}>
          <button onClick={() => setSidebarOpen(true)}
            className={cn('lg:hidden p-2 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}>
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={cn('hidden lg:block p-2 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:flex-none">
            <p className={cn('text-sm font-semibold hidden lg:block', isDark ? 'text-slate-400' : 'text-gray-500')}>
              {t('dashboard.welcome')},{' '}
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{user?.firstName}</span>
            </p>
          </div>
          <button onClick={toggleTheme}
            className={cn('p-2 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600')}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}>
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
              <span className="sm:hidden">{currentLang.flag}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div className={cn(
                'absolute right-0 top-full mt-2 rounded-2xl shadow-2xl border py-2 min-w-[170px] z-50',
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
              )}>
                {LANGUAGES.map(lang => (
                  <button key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
                      i18n.language === lang.code
                        ? 'text-green-600 font-semibold bg-green-50 dark:bg-green-900/30'
                        : (isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-green-50'),
                    )}>
                    <span>{lang.flag}</span> {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <NotificationDropdown isDark={isDark} />
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
