import { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [input, setInput] = useState('');
  const { isDark } = useTheme();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('p-3 border-t', isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white')}>
      <div className="relative flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask WeDonate AI..."
          className={cn(
            'flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500',
            isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300'
          )}
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
