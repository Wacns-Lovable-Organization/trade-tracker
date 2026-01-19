import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Mail, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppSettings, AuthMethodSettings } from '@/hooks/useAppSettings';

export function AuthSettingsTab() {
  const { settings, isLoading, updateAuthMethod } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<AuthMethodSettings | null>(null);

  const currentSettings = pendingSettings || settings.auth_method;

  const handleToggleMethod = (useResend: boolean) => {
    setPendingSettings({
      method: useResend ? 'resend' : 'supabase',
      resend_enabled: useResend,
    });
  };

  const handleSave = async () => {
    if (!pendingSettings) return;

    setIsSaving(true);
    const { error } = await updateAuthMethod(pendingSettings);
    setIsSaving(false);

    if (error) {
      toast.error('Failed to update auth settings');
    } else {
      toast.success('Authentication settings updated!');
      setPendingSettings(null);
    }
  };

  const handleCancel = () => {
    setPendingSettings(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasChanges = pendingSettings !== null;
  const isResendEnabled = currentSettings.method === 'resend';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Method
          </CardTitle>
          <CardDescription>
            Choose how users verify their email during signup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="auth-method" className="text-base font-medium">
                  Use Custom OTP (Resend)
                </Label>
                {isResendEnabled ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isResendEnabled
                  ? 'Users receive a 6-digit OTP code via email to verify their account'
                  : 'Using Supabase built-in authentication (auto-confirm enabled)'}
              </p>
            </div>
            <Switch
              id="auth-method"
              checked={isResendEnabled}
              onCheckedChange={handleToggleMethod}
            />
          </div>

          {/* Method Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={`border-2 ${!isResendEnabled ? 'border-primary' : 'border-muted'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Supabase Built-in
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ No domain verification needed</li>
                  <li>✓ Works out of the box</li>
                  <li>✓ Auto-confirm enabled</li>
                  <li>✓ Magic link for password reset</li>
                </ul>
              </CardContent>
            </Card>

            <Card className={`border-2 ${isResendEnabled ? 'border-primary' : 'border-muted'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Custom OTP (Resend)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Branded email templates</li>
                  <li>✓ 6-digit OTP verification</li>
                  <li>✓ Rate limiting protection</li>
                  <li>⚠️ Requires verified domain</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Warning for Resend */}
          {isResendEnabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Domain Verification Required</AlertTitle>
              <AlertDescription>
                Custom OTP emails via Resend require a verified domain. Without it, emails can only
                be sent to the account owner's email address. Visit{' '}
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  resend.com/domains
                </a>{' '}
                to verify your domain.
              </AlertDescription>
            </Alert>
          )}

          {/* Save/Cancel Buttons */}
          {hasChanges && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
