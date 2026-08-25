import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import Card from '../../components/ui/Card';

export default function OperationalSupportPage() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-gray-900')}>
          Operational Support
        </h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-gray-500')}>
          Manage system-wide operational policies and support.
        </p>
      </div>
      
      <Card className="p-12 text-center">
        <p className={cn('text-lg', isDark ? 'text-slate-300' : 'text-gray-700')}>
          Operational Support Module Coming Soon
        </p>
      </Card>
    </div>
  );
}
