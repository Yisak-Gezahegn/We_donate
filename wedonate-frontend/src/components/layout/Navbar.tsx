import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu, X, ChevronDown, Globe,
  User, LogOut, LayoutDashboard, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English',      flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ',         flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo',  flag: '🇪🇹' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); setUserOpen(false); };
  const currentLang  = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];
  const isAdmin      = user && ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN'].includes(user.role);

  /* background when scrolled differs between light/dark */
  const navBg = scrolled
    ? (isDark ? 'bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-white shadow-lg')
    : 'bg-transparent';

  /* text colour on transparent nav (hero bg is always dark-green) */
  const onHero  = !scrolled;
  const txtBase = onHero ? 'text-white'      : (isDark ? 'text-slate-100'  : 'text-gray-700');
  const hoverBg = onHero ? 'hover:bg-white/10' : (isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100');

  return (
    <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', navBg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* ── Logo ──────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border-2 border-white/30">
              <img
                src="/adama_logo.png"
                alt="Adama City Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  /* fallback to text if image missing */
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className={cn('font-extrabold text-xl tracking-tight transition-colors',
                onHero ? 'text-white' : (isDark ? 'text-green-400' : 'text-green-800'))}>
                We<span className="text-amber-400">Donate</span>
              </span>
              <p className={cn('text-xs font-medium leading-none transition-colors',
                onHero ? 'text-green-100' : (isDark ? 'text-slate-400' : 'text-gray-500'))}>
                Adama City
              </p>
            </div>
          </Link>

          {/* ── Desktop Nav Links ─────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/',       label: t('nav.home') },
              { to: '/about',  label: t('nav.about') },
              { to: '/donate', label: t('nav.donate') },
            ].map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? (onHero ? 'bg-white/20 text-white' : (isDark ? 'bg-green-800 text-green-200' : 'bg-green-700 text-white'))
                      : cn(txtBase, hoverBg),
                  )}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right Controls ────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">

            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={cn(
                'p-2.5 rounded-xl transition-all',
                txtBase, hoverBg,
              )}>
              {isDark
                ? <Sun  className="w-4.5 h-4.5 text-amber-400" />
                : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserOpen(false); }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all', txtBase, hoverBg)}>
                <Globe className="w-4 h-4" />
                <span className="hidden lg:inline">{currentLang.flag} {currentLang.label}</span>
                <span className="lg:hidden">{currentLang.flag}</span>
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

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(!userOpen); setLangOpen(false); }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    onHero
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : (isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'),
                  )}>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                  <span className="hidden lg:inline">{user?.firstName}</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', userOpen && 'rotate-180')} />
                </button>
                {userOpen && (
                  <div className={cn(
                    'absolute right-0 top-full mt-2 rounded-2xl shadow-2xl border py-1 min-w-[210px] z-50',
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
                  )}>
                    <div className={cn('px-4 py-3 border-b', isDark ? 'border-slate-700' : 'border-gray-100')}>
                      <div className="flex items-center gap-3">
                        {user?.profileImage ? (
                          <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-800')}>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-gray-500')}>{user?.email}</p>
                          <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {user?.role?.replace(/_/g,' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {[
                      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
                      ...(isAdmin ? [{ to: '/admin', icon: User, label: 'Admin Panel' }] : []),
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setUserOpen(false)}
                        className={cn('flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                          isDark ? 'text-slate-200 hover:bg-slate-700 hover:text-green-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-700')}>
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    ))}
                    <button onClick={handleLogout}
                      className={cn('w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-red-500',
                        isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}>
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link to="/login"
                  className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all', txtBase, hoverBg)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile: theme toggle + hamburger ─────── */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle dark mode"
              className={cn('p-2 rounded-xl transition-all', txtBase, hoverBg)}>
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className={cn('p-2 rounded-xl transition-all', txtBase, hoverBg)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────────── */}
      {mobileOpen && (
        <div className={cn(
          'md:hidden border-t shadow-xl',
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100',
        )}>
          <div className="px-4 py-4 space-y-1">
            {[
              { to: '/',       label: t('nav.home') },
              { to: '/about',  label: t('nav.about') },
              { to: '/donate', label: t('nav.donate') },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className={cn('block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isDark ? 'text-slate-200 hover:bg-slate-700 hover:text-green-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-700')}>
                {link.label}
              </Link>
            ))}

            {/* Language */}
            <div className={cn('border-t pt-3 mt-3 space-y-1', isDark ? 'border-slate-700' : 'border-gray-100')}>
              <p className={cn('text-xs font-semibold px-4 mb-1', isDark ? 'text-slate-500' : 'text-gray-400')}>LANGUAGE</p>
              {LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setMobileOpen(false); }}
                  className={cn('w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors',
                    i18n.language === lang.code
                      ? 'bg-green-50 text-green-700 font-semibold dark:bg-green-900/30 dark:text-green-400'
                      : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-50'))}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>

            {/* Auth */}
            <div className={cn('border-t pt-3 mt-3 space-y-2', isDark ? 'border-slate-700' : 'border-gray-100')}>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard"
                    className={cn('block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-green-50')}>
                    {t('nav.dashboard')}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className={cn('block px-4 py-3 rounded-xl text-sm font-medium',
                      isDark ? 'text-green-400 hover:bg-slate-700' : 'text-green-700 hover:bg-green-50')}>
                    {t('nav.login')}
                  </Link>
                  <Link to="/register"
                    className="block px-4 py-3 rounded-xl text-sm font-semibold bg-amber-500 text-white text-center">
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
