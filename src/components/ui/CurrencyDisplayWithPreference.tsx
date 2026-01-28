import { useCurrencyDisplay } from '@/contexts/CurrencyDisplayContext';
import { ClickableCurrencyDisplay, ClickableProfitDisplay } from '@/components/ui/ClickableCurrencyDisplay';
import type { CurrencyUnit } from '@/types/inventory';

interface CurrencyDisplayWithPreferenceProps {
  amount: number;
  currency: CurrencyUnit | null;
  className?: string;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplayWithPreference(props: CurrencyDisplayWithPreferenceProps) {
  const { defaultMode } = useCurrencyDisplay();
  return <ClickableCurrencyDisplay {...props} defaultMode={defaultMode} />;
}

interface ProfitDisplayWithPreferenceProps {
  profit: number;
  currency: CurrencyUnit | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfitDisplayWithPreference(props: ProfitDisplayWithPreferenceProps) {
  const { defaultMode } = useCurrencyDisplay();
  return <ClickableProfitDisplay {...props} defaultMode={defaultMode} />;
}
