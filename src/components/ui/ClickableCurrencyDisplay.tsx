import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { CurrencyUnit } from '@/types/inventory';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DisplayMode = 'original' | 'dl' | 'bgl';

interface ClickableCurrencyDisplayProps {
  amount: number;
  currency: CurrencyUnit | null;
  className?: string;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
  defaultMode?: DisplayMode;
}

// Currency conversion: 100 WL = 1 DL, 100 DL = 1 BGL
const convertToWL = (amount: number, currency: string): number => {
  switch (currency) {
    case 'BGL': return amount * 10000; // 1 BGL = 100 DL = 10000 WL
    case 'DL': return amount * 100;    // 1 DL = 100 WL
    case 'WL': return amount;
    default: return amount;
  }
};

// Convert total WL to BGL/DL/WL breakdown
const convertWLToBreakdown = (totalWL: number): { bgl: number; dl: number; wl: number } => {
  const absWL = Math.abs(totalWL);
  const bgl = Math.floor(absWL / 10000);
  const remaining = absWL % 10000;
  const dl = Math.floor(remaining / 100);
  const wl = Math.round(remaining % 100);
  return { bgl, dl, wl };
};

// Convert to DL/WL breakdown (without BGL)
const convertWLToDLBreakdown = (totalWL: number): { dl: number; wl: number } => {
  const absWL = Math.abs(totalWL);
  const dl = Math.floor(absWL / 100);
  const wl = Math.round(absWL % 100);
  return { dl, wl };
};

export function ClickableCurrencyDisplay({
  amount,
  currency,
  className,
  showSign = false,
  size = 'md',
  defaultMode = 'original',
}: ClickableCurrencyDisplayProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(defaultMode);

  // Update display mode when defaultMode prop changes
  useEffect(() => {
    setDisplayMode(defaultMode);
  }, [defaultMode]);

  const isPositive = amount >= 0;
  const totalInWL = convertToWL(amount, currency || 'WL');
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
  };

  const badgeClasses = {
    sm: 'text-xs px-1 py-0.5',
    md: 'text-xs px-1.5 py-0.5',
    lg: 'text-sm px-2 py-1',
  };

  const handleClick = () => {
    // Cycle through modes: original -> dl -> bgl -> original
    if (displayMode === 'original') {
      setDisplayMode('dl');
    } else if (displayMode === 'dl') {
      setDisplayMode('bgl');
    } else {
      setDisplayMode('original');
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const renderContent = () => {
    const signPrefix = showSign ? (isPositive ? '+' : '-') : (!isPositive ? '-' : '');
    const absAmount = Math.abs(amount);

    if (displayMode === 'original') {
      return (
        <>
          {signPrefix}
          {formatNumber(absAmount)}
          {currency && (
            <span className={cn(
              'font-mono rounded ml-1',
              badgeClasses[size],
              currency === 'WL' && 'currency-wl',
              currency === 'DL' && 'currency-dl',
              currency === 'BGL' && 'currency-bgl'
            )}>
              {currency}
            </span>
          )}
        </>
      );
    }

    if (displayMode === 'dl') {
      const { dl, wl } = convertWLToDLBreakdown(totalInWL);
      const parts: React.ReactNode[] = [];
      
      if (dl > 0) {
        parts.push(
          <span key="dl" className="inline-flex items-center">
            {signPrefix}{formatNumber(dl)}
            <span className={cn('font-mono rounded ml-1', badgeClasses[size], 'currency-dl')}>DL</span>
          </span>
        );
      }
      if (wl > 0 || parts.length === 0) {
        parts.push(
          <span key="wl" className="inline-flex items-center">
            {parts.length === 0 && signPrefix}{formatNumber(wl)}
            <span className={cn('font-mono rounded ml-1', badgeClasses[size], 'currency-wl')}>WL</span>
          </span>
        );
      }
      
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {parts.map((part, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="text-muted-foreground mx-0.5">,</span>}
              {part}
            </span>
          ))}
        </span>
      );
    }

    // displayMode === 'bgl'
    const { bgl, dl, wl } = convertWLToBreakdown(totalInWL);
    const parts: React.ReactNode[] = [];
    
    if (bgl > 0) {
      parts.push(
        <span key="bgl" className="inline-flex items-center">
          {signPrefix}{formatNumber(bgl)}
          <span className={cn('font-mono rounded ml-1', badgeClasses[size], 'currency-bgl')}>BGL</span>
        </span>
      );
    }
    if (dl > 0) {
      parts.push(
        <span key="dl" className="inline-flex items-center">
          {parts.length === 0 && signPrefix}{formatNumber(dl)}
          <span className={cn('font-mono rounded ml-1', badgeClasses[size], 'currency-dl')}>DL</span>
        </span>
      );
    }
    if (wl > 0 || parts.length === 0) {
      parts.push(
        <span key="wl" className="inline-flex items-center">
          {parts.length === 0 && signPrefix}{formatNumber(wl)}
          <span className={cn('font-mono rounded ml-1', badgeClasses[size], 'currency-wl')}>WL</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        {parts.map((part, idx) => (
          <span key={idx}>
            {idx > 0 && <span className="text-muted-foreground mx-0.5">,</span>}
            {part}
          </span>
        ))}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'number-display inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 -mx-1',
              sizeClasses[size],
              showSign && (isPositive ? 'text-profit' : 'text-loss'),
              className
            )}
          >
            {renderContent()}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Click to convert currency
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// For profit display with sign
interface ClickableProfitDisplayProps {
  profit: number;
  currency: CurrencyUnit | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  defaultMode?: DisplayMode;
}

export function ClickableProfitDisplay({
  profit,
  currency,
  className,
  size = 'md',
  defaultMode = 'original',
}: ClickableProfitDisplayProps) {
  return (
    <ClickableCurrencyDisplay
      amount={profit}
      currency={currency}
      showSign
      size={size}
      className={className}
      defaultMode={defaultMode}
    />
  );
}
