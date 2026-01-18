import { cn } from '@/lib/utils';
import type { CurrencyUnit } from '@/types/inventory';

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyUnit | null;
  className?: string;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({
  amount,
  currency,
  className,
  showSign = false,
  size = 'md',
}: CurrencyDisplayProps) {
  const isPositive = amount >= 0;
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
  };

  return (
    <span
      className={cn(
        'number-display inline-flex items-center gap-1',
        sizeClasses[size],
        showSign && (isPositive ? 'text-profit' : 'text-loss'),
        className
      )}
    >
      {showSign && (isPositive ? '+' : '-')}
      {!showSign && !isPositive && '-'}
      {formattedAmount}
      {currency && (
        <span className="text-muted-foreground font-normal ml-0.5">
          {currency}
        </span>
      )}
    </span>
  );
}

interface ProfitDisplayProps {
  profit: number;
  currency: CurrencyUnit | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfitDisplay({
  profit,
  currency,
  className,
  size = 'md',
}: ProfitDisplayProps) {
  return (
    <CurrencyDisplay
      amount={profit}
      currency={currency}
      showSign
      size={size}
      className={className}
    />
  );
}
