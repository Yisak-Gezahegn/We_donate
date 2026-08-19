import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export default function Card({ children, className, hover, padding = 'md' }: CardProps) {
  const { isDark } = useTheme();
  return (
    <div className={cn(
      'rounded-2xl border transition-colors duration-300',
      isDark
        ? 'bg-slate-800 border-slate-700 text-slate-100'
        : 'bg-white border-gray-100 text-gray-900',
      hover && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer',
      paddings[padding],
      className,
    )}>
      {children}
    </div>
  );
}
