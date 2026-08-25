import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, FileText, Bell, User,
  LogOut, Menu, X, Users, BarChart2, ClipboardList, ChevronRight, Heart, Target, Image, Quote, Images,
  Sun, Moon, Globe, ChevronDown, BadgeCheck, Receipt, Search, FileBarChart, Newspaper,
  HelpCircle, Calendar, Mail, Settings, CheckCheck, Trash2, AlertTriangle, ShieldCheck, MapPin,
} from 'lucide-react';
import i18n from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import ErrorBoundary from '../ErrorBoundary';

const ADMIN_ROLES = ['KEBELE_ADMIN', 'CITY_ADMIN', 'SYSTEM_ADMIN'];

interface SidebarProps {
  links: any[];
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

      {user && (
        <div className={cn('py-4 border-b transition-all duration-300',
          isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-gray-100',
          collapsed ? 'px-3 flex justify-center' : 'px-6'
        )}>
          <div className="flex items-center gap-3">
            {(user as any)?.profileImage ? (
              <img src={(user as any).profileImage} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
              </div>
            )}
            <div className={cn('overflow-hidden transition-all duration-300 ease-in-out',
              collapsed ? 'w-0 opacity-0 ml-0' : 'w-32 opacity-100'
            )}>
              <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-800')}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-green-500 font-medium capitalize truncate">
                {user.role?.toLowerCase().replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className={cn('flex-1 py-4 space-y-4 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3')}>
        {links.map((section: any, idx: number) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <p className={cn('px-4 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 whitespace-nowrap',
                collapsed ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100 h-4 mb-2',
                isDark ? 'text-slate-500' : 'text-gray-400'
              )}>
                {section.title}
              </p>
            )}
            {section.links.map(({ to, icon: Icon, label }: any) => {
              const active = location.pathname === to || (to !== '/admin' && to !== '/dashboard' && location.pathname.startsWith(to));
              return (
                <Link key={to} to={to} onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-colors overflow-hidden',
                    collapsed ? 'justify-center py-3' : 'px-3 py-2.5',
                    active
                      ? 'bg-green-700 text-white shadow-md'
                      : (isDark ? 'text-slate-300 hover:bg-slate-700/50 hover:text-green-400' : 'text-gray-600 hover:bg-green-50 hover:text-green-700'),
                  )}>
                  <div className={cn('flex items-center justify-center shrink-0 transition-all duration-300', collapsed ? 'w-10' : 'w-8')}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={cn("flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap",
                    collapsed ? "w-0 opacity-0" : "w-40 opacity-100"
                  )}>
                    <span className="flex-1 ml-1">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={cn('px-3 py-4 border-t', isDark ? 'border-slate-700' : 'border-gray-100')}>
        <button onClick={onLogout}
          title={collapsed ? logoutLabel : undefined}
          className={cn('w-full flex items-center rounded-xl text-sm font-medium text-red-500 transition-colors overflow-hidden',
            collapsed ? 'justify-center py-3' : 'px-3 py-3',
            isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}>
          <div className={cn('flex items-center justify-center shrink-0 transition-all duration-300', collapsed ? 'w-10' : 'w-8')}>
            <LogOut className="w-4 h-4" />
          </div>
          <div className={cn("flex items-center overflow-hidden transition-all duration-300 whitespace-nowrap",
            collapsed ? "w-0 opacity-0" : "w-40 opacity-100"
          )}>
            <span className="flex-1 ml-1 text-left">{logoutLabel}</span>
          </div>
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
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const previous = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any) => old?.map((n: any) => ({ ...n, isRead: true })) ?? []);
      return { previous };
    },
    onError: (_err, _var, context) => qc.setQueryData(['notifications'], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const previous = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], () => []);
      return { previous };
    },
    onError: (_err, _var, context) => qc.setQueryData(['notifications'], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const previous = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any) => old?.map((n: any) => n.id === id ? { ...n, isRead: true } : n) ?? []);
      return { previous };
    },
    onError: (_err, _var, context) => qc.setQueryData(['notifications'], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteOne = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const previous = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any) => old?.filter((n: any) => n.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _var, context) => qc.setQueryData(['notifications'], context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
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
              <button onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  clearAll.mutate();
                }
              }}
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteOne.mutate(n.id); }}
                      className={cn('p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors shrink-0',
                        isDark ? 'text-slate-500 hover:bg-red-900/30 hover:text-red-400' : 'text-gray-400')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langOpen && langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
    { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  ];
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    setLangOpen(false);
  }, [location.pathname]);

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const userSections = [
    {
      title: t('nav.dashboard'),
      links: [
        { to: '/dashboard',               icon: LayoutDashboard, label: t('nav.dashboard') },
        { to: '/dashboard/notifications', icon: Bell,            label: t('dashboard.notifications') },
      ]
    },
    {
      title: 'Activity',
      links: [
        { to: '/dashboard/donate',        icon: Heart,           label: t('nav.donate') },
        { to: '/dashboard/donations',     icon: FileText,        label: t('dashboard.my_donations') },
        { to: '/dashboard/requests',      icon: ClipboardList,   label: t('dashboard.my_requests') },
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
      ]
    }
  ];

  const orgSections = [
    {
      title: t('nav.dashboard'),
      links: [
        { to: '/dashboard',               icon: LayoutDashboard, label: t('nav.dashboard') },
        { to: '/dashboard/notifications', icon: Bell,            label: t('dashboard.notifications') },
      ]
    },
    {
      title: 'Operations',
      links: [
        { to: '/dashboard/campaigns',     icon: Target,          label: 'My Campaigns' },
      ]
    },
    {
      title: 'Activity',
      links: [
        { to: '/dashboard/donate',        icon: Heart,           label: t('nav.donate') },
        { to: '/dashboard/donations',     icon: FileText,        label: t('dashboard.my_donations') },
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
      ]
    }
  ];

  const kebeleAdminSections = [
    {
      title: 'Overview',
      links: [
        { to: '/admin', icon: LayoutDashboard, label: 'Kebele Dashboard' },
      ]
    },
    {
      title: 'Operations',
      links: [
        { to: '/admin/user-verification', icon: ShieldCheck, label: 'User Verification' },
        { to: '/admin/requests', icon: ClipboardList, label: 'Support Requests' },
        { to: '/admin/users', icon: Users, label: 'Local Individuals' },
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
      ]
    }
  ];

  const cityAdminSections = [
    {
      title: 'Overview',
      links: [
        { to: '/admin', icon: LayoutDashboard, label: 'City Dashboard' },
        { to: '/admin/support', icon: FileBarChart, label: 'Operational Support' },
      ]
    },
    {
      title: 'Management',
      links: [
        { to: '/admin/verification', icon: BadgeCheck, label: 'Organizations' },
        { to: '/admin/requests', icon: Target, label: 'Campaign Approvals' },
        { to: '/admin/donations', icon: Heart, label: 'Donation Management' },
        { to: '/admin/users', icon: Users, label: 'Kebele Admins' },
        { to: '/admin/kebeles', icon: MapPin, label: 'Manage Kebeles' },
      ]
    },
    {
      title: 'Content',
      links: [
        { to: '/admin/news', icon: Newspaper, label: 'News & Updates' },
        { to: '/admin/events', icon: Calendar, label: 'Events' },
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
      ]
    }
  ];

  const systemAdminSections = [
    {
      title: 'System Health',
      links: [
        { to: '/admin', icon: BarChart2, label: 'System Overview' },
        { to: '/admin/audit-logs', icon: FileText, label: 'Audit & Security' },
      ]
    },
    {
      title: 'Administration',
      links: [
        { to: '/admin/users', icon: Users, label: 'Admin Accounts' },
        { to: '/admin/kebeles', icon: MapPin, label: 'Manage Kebeles' },
        { to: '/admin/settings', icon: Settings, label: 'Configuration' },
        { to: '/admin/inspections', icon: Search, label: 'System Inspections' },
      ]
    },
    {
      title: 'Platform Content',
      links: [
        { to: '/admin/faqs', icon: HelpCircle, label: 'FAQs' },
        { to: '/admin/gallery', icon: Image, label: 'Gallery' },
        { to: '/admin/testimonials', icon: Quote, label: 'Testimonials' },
        { to: '/admin/hero-images', icon: Images, label: 'Hero Images' },
        { to: '/admin/messages', icon: Mail, label: 'Contact Messages' },
      ]
    },
    {
      title: 'Account',
      links: [
        { to: '/dashboard/profile',       icon: User,            label: t('nav.profile') },
      ]
    }
  ];

  const links = user?.role === 'SYSTEM_ADMIN' ? systemAdminSections
    : user?.role === 'CITY_ADMIN' ? cityAdminSections
    : user?.role === 'KEBELE_ADMIN' ? kebeleAdminSections
    : user?.role === 'ORGANIZATION' ? orgSections
    : userSections;

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

      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out', sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20')}>
        <header className={cn(
          'sticky top-0 z-30 px-4 lg:px-6 h-16 flex items-center justify-between border-b shadow-sm transition-colors duration-300',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
        )}>
          {/* LEFT SECTION */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setSidebarOpen(true)}
              className={cn('lg:hidden p-2 -ml-2 rounded-xl transition-colors',
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}>
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={cn('hidden lg:block p-2 -ml-2 rounded-xl transition-colors',
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-700')}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block mx-1" />
            <p className={cn('text-sm font-semibold hidden sm:block', isDark ? 'text-slate-300' : 'text-gray-600')}>
              {t('dashboard.welcome')},{' '}
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{user?.firstName}</span>
            </p>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggleTheme}
              className={cn('p-2 rounded-xl transition-colors',
                isDark ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600')}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={langRef}>
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
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {user && ['ORGANIZATION'].includes(user.role) && (user as any).verificationStatus === 'PENDING' && (
            <div className={cn('mb-6 flex items-center gap-3 p-4 rounded-2xl border',
              isDark ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800')}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold">Your organization is pending verification. </span>
                Campaign and support request creation will be available after admin approval. You can still browse the dashboard and donate.
              </div>
            </div>
          )}
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
      </div>
    </div>
  );
}
