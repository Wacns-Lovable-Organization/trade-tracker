import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  style,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl border border-border bg-card hover-lift',
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold number-display">{value}</div>
          {subtitle && (
            <p
              className={cn(
                'text-sm',
                trend === 'up' && 'text-profit',
                trend === 'down' && 'text-loss',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
