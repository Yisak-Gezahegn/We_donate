import { type ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={cn('min-h-screen flex flex-col transition-colors duration-300',
      isDark ? 'bg-slate-900' : 'bg-gray-50')}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
