import { type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export default function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  const { isDark } = useTheme();
  return (
    <div className="w-full">
      {label && (
        <label className={cn('block text-sm font-medium mb-1.5',
          isDark ? 'text-slate-300' : 'text-gray-700')}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className={cn('absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none',
            isDark ? 'text-slate-500' : 'text-gray-400')}>
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            error && 'border-red-400 focus:ring-red-400',
            isDark
              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
