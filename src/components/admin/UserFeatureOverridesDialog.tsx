import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { useAdminFeatureOverrides } from '@/hooks/useUserFeatureOverrides';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCog, ToggleLeft, ToggleRight, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface UserFeatureOverridesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserFeatureOverridesDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: UserFeatureOverridesDialogProps) {
  const { t } = useTranslation();
  const { featureFlags, isLoading: flagsLoading } = useFeatureFlags();
  const { 
    getUserOverrides, 
    setUserFeatureOverride, 
    removeUserFeatureOverride,
    refetch: refetchOverrides 
  } = useAdminFeatureOverrides();

  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (open) {
      refetchOverrides();
    }
  }, [open, refetchOverrides]);

  useEffect(() => {
    const overrides = getUserOverrides(userId);
    const overrideMap: Record<string, boolean | null> = {};
    overrides.forEach(o => {
      overrideMap[o.feature_key] = o.is_enabled;
    });
    setLocalOverrides(overrideMap);
  }, [userId, getUserOverrides]);

  const handleToggleOverride = async (featureKey: string, currentGlobalState: boolean) => {
    const currentOverride = localOverrides[featureKey];
    
    // Cycle through: null -> enabled -> disabled -> null
    let newState: boolean | null;
    if (currentOverride === null || currentOverride === undefined) {
      newState = !currentGlobalState; // Opposite of global
    } else if (currentOverride === !currentGlobalState) {
      newState = currentGlobalState; // Same as global (but explicit)
    } else {
      newState = null; // Remove override
    }

    if (newState === null) {
      const { error } = await removeUserFeatureOverride(userId, featureKey);
      if (error) {
        toast.error(t('admin.failedToUpdateOverride', 'Failed to update override'));
      } else {
        setLocalOverrides(prev => ({ ...prev, [featureKey]: null }));
        toast.success(t('admin.overrideRemoved', 'Override removed - using global setting'));
      }
    } else {
      const { error } = await setUserFeatureOverride(userId, featureKey, newState);
      if (error) {
        toast.error(t('admin.failedToUpdateOverride', 'Failed to update override'));
      } else {
        setLocalOverrides(prev => ({ ...prev, [featureKey]: newState }));
        toast.success(
          newState 
            ? t('admin.featureEnabledForUser', 'Feature enabled for this user') 
            : t('admin.featureDisabledForUser', 'Feature disabled for this user')
        );
      }
    }
  };

  const handleResetAll = async () => {
    for (const featureKey of Object.keys(localOverrides)) {
      if (localOverrides[featureKey] !== null && localOverrides[featureKey] !== undefined) {
        await removeUserFeatureOverride(userId, featureKey);
      }
    }
    setLocalOverrides({});
    toast.success(t('admin.allOverridesReset', 'All overrides reset to global settings'));
  };

  const getEffectiveState = (flag: FeatureFlag): { enabled: boolean; source: 'global' | 'override' } => {
    const override = localOverrides[flag.feature_key];
    if (override !== null && override !== undefined) {
      return { enabled: override, source: 'override' };
    }
    return { enabled: flag.is_enabled, source: 'global' };
  };

  if (flagsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
          </DialogHeader>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            {t('admin.featureOverridesFor', 'Feature Overrides for {{name}}', { name: userName })}
          </DialogTitle>
          <DialogDescription>
            {t('admin.featureOverridesDescription', 'Customize which features are enabled or disabled for this specific user. Leave at global to use the system-wide setting.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('admin.resetAllOverrides', 'Reset All')}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.feature', 'Feature')}</TableHead>
              <TableHead className="text-center">{t('admin.globalSetting', 'Global')}</TableHead>
              <TableHead className="text-center">{t('admin.userOverride', 'User Override')}</TableHead>
              <TableHead className="text-center">{t('admin.effectiveState', 'Effective')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {featureFlags.map((flag) => {
              const effective = getEffectiveState(flag);
              const hasOverride = localOverrides[flag.feature_key] !== null && 
                                  localOverrides[flag.feature_key] !== undefined;

              return (
                <TableRow key={flag.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{flag.feature_name}</div>
                      <code className="text-xs text-muted-foreground">{flag.feature_key}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {flag.is_enabled ? (
                      <ToggleRight className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={hasOverride ? localOverrides[flag.feature_key]! : flag.is_enabled}
                        onCheckedChange={() => handleToggleOverride(flag.feature_key, flag.is_enabled)}
                        aria-label={`Override ${flag.feature_name} for ${userName}`}
                      />
                      {hasOverride && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleToggleOverride(flag.feature_key, flag.is_enabled)}
                          aria-label={t('admin.removeOverride', 'Remove override')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {!hasOverride && (
                      <span className="text-xs text-muted-foreground">
                        {t('admin.usingGlobal', 'Using global')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={effective.enabled ? 'default' : 'secondary'}>
                      {effective.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled')}
                    </Badge>
                    {effective.source === 'override' && (
                      <div className="text-xs text-amber-500 mt-1">
                        {t('admin.customOverride', 'Custom')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
