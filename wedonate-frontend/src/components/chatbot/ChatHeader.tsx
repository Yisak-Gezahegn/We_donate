import { Bot, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onClose: () => void;
  onReset: () => void;
}

export default function ChatHeader({ onClose, onReset }: Props) {
  const { isDark } = useTheme();
  
  return (
    <div className={cn('flex items-center justify-between p-3 border-b', 
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 rounded-t-2xl')}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>WeDonate AI</h3>
          <p className="text-[10px] text-green-500 font-medium">Online</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onReset} title="Restart Conversation" className={cn('p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors', isDark ? 'text-slate-400' : 'text-gray-500')}>
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onClose} aria-label="Close Chat" className={cn('p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors', isDark ? 'text-slate-400' : 'text-gray-500')}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
