import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Settings, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FEATURE_ICONS: Record<string, string> = {
  ai_forecasting: '🤖',
  expense_tracking: '💰',
  pdf_reports: '📄',
  suppliers_management: '🏭',
  profit_simulator: '📊',
  low_stock_alerts: '⚠️',
  push_notifications: '🔔',
};

export function FeatureFlagsTab() {
  const { t } = useTranslation();
  const { featureFlags, isLoading, updateFeatureFlag, addFeatureFlag, deleteFeatureFlag, refetch } = useFeatureFlags();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');

  const handleToggle = async (flag: FeatureFlag) => {
    const { error } = await updateFeatureFlag(flag.feature_key, !flag.is_enabled);
    if (error) {
      toast.error('Failed to update feature flag');
    } else {
      toast.success(`${flag.feature_name} ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleAddFeature = async () => {
    if (!newFeatureKey.trim() || !newFeatureName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { error } = await addFeatureFlag(
      newFeatureKey.trim().toLowerCase().replace(/\s+/g, '_'),
      newFeatureName.trim(),
      newFeatureDescription.trim()
    );

    if (error) {
      toast.error('Failed to add feature flag');
    } else {
      toast.success('Feature flag added successfully');
      setIsAddDialogOpen(false);
      setNewFeatureKey('');
      setNewFeatureName('');
      setNewFeatureDescription('');
    }
  };

  const handleDeleteFeature = async (featureKey: string, featureName: string) => {
    const { error } = await deleteFeatureFlag(featureKey);
    if (error) {
      toast.error('Failed to delete feature flag');
    } else {
      toast.success(`${featureName} deleted`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('admin.featureFlags')}
          </CardTitle>
          <CardDescription>
            {t('admin.featureFlagsDescription')}
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feature Flag</DialogTitle>
              <DialogDescription>
                Create a new feature flag to control system functionality.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="featureKey">Feature Key</Label>
                <Input
                  id="featureKey"
                  placeholder="e.g., new_feature"
                  value={newFeatureKey}
                  onChange={(e) => setNewFeatureKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier (lowercase, underscores)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featureName">Feature Name</Label>
                <Input
                  id="featureName"
                  placeholder="e.g., New Feature"
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featureDescription">Description (optional)</Label>
                <Input
                  id="featureDescription"
                  placeholder="Brief description of the feature"
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFeature}>Add Feature</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {featureFlags.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No feature flags configured
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {FEATURE_ICONS[flag.feature_key] || '⚙️'}
                        </span>
                        <div>
                          <div className="font-medium">{flag.feature_name}</div>
                          <code className="text-xs text-muted-foreground">
                            {flag.feature_key}
                          </code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {flag.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={flag.is_enabled}
                          onCheckedChange={() => handleToggle(flag)}
                        />
                        {flag.is_enabled ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(flag.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feature Flag?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{flag.feature_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFeature(flag.feature_key, flag.feature_name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
