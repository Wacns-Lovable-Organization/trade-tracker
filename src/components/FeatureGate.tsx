import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabledMessage?: boolean;
}

export function FeatureGate({ 
  featureKey, 
  children, 
  fallback,
  showDisabledMessage = true 
}: FeatureGateProps) {
  const { t } = useTranslation();
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return null;
  }

  if (!isFeatureEnabled(featureKey)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showDisabledMessage) {
      return (
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              {t('featureDisabled.title')}
            </CardTitle>
            <CardDescription>
              {t('featureDisabled.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('featureDisabled.contactAdmin')}
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
}
