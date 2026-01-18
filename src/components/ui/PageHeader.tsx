import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight animate-fade-in">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '50ms' }}>
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
