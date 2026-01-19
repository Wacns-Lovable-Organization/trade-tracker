import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Mail, Shield, AlertTriangle, CheckCircle2, Palette, Clock } from 'lucide-react';
import { useAppSettings, AuthMethodSettings, EmailTemplateSettings, RateLimitSettings } from '@/hooks/useAppSettings';
import { EmailPreview } from './EmailPreview';

export function AuthSettingsTab() {
  const { settings, isLoading, updateAuthMethod, updateEmailTemplate, updateRateLimit } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAuthSettings, setPendingAuthSettings] = useState<AuthMethodSettings | null>(null);
  const [pendingEmailTemplate, setPendingEmailTemplate] = useState<EmailTemplateSettings | null>(null);
  const [pendingRateLimit, setPendingRateLimit] = useState<RateLimitSettings | null>(null);

  const currentAuthSettings = pendingAuthSettings || settings.auth_method;
  const currentEmailTemplate = pendingEmailTemplate || settings.email_template;
  const currentRateLimit = pendingRateLimit || settings.rate_limit;

  const handleToggleMethod = (useResend: boolean) => {
    setPendingAuthSettings({
      method: useResend ? 'resend' : 'supabase',
      resend_enabled: useResend,
    });
  };

  const handleEmailTemplateChange = (field: keyof EmailTemplateSettings, value: string) => {
    const newTemplate = { ...(pendingEmailTemplate || settings.email_template), [field]: value };
    setPendingEmailTemplate(newTemplate);
  };

  const handleRateLimitChange = (field: keyof RateLimitSettings, value: number) => {
    const newRateLimit = { ...(pendingRateLimit || settings.rate_limit), [field]: value };
    setPendingRateLimit(newRateLimit);
  };

  const handleSaveAuth = async () => {
    if (!pendingAuthSettings) return;

    setIsSaving(true);
    const { error } = await updateAuthMethod(pendingAuthSettings);
    setIsSaving(false);

    if (error) {
      toast.error('Failed to update auth settings');
    } else {
      toast.success('Authentication settings updated!');
      setPendingAuthSettings(null);
    }
  };

  const handleSaveEmailTemplate = async () => {
    if (!pendingEmailTemplate) return;

    setIsSaving(true);
    const { error } = await updateEmailTemplate(pendingEmailTemplate);
    setIsSaving(false);

    if (error) {
      toast.error('Failed to update email template');
    } else {
      toast.success('Email template updated!');
      setPendingEmailTemplate(null);
    }
  };

  const handleSaveRateLimit = async () => {
    if (!pendingRateLimit) return;

    setIsSaving(true);
    const { error } = await updateRateLimit(pendingRateLimit);
    setIsSaving(false);

    if (error) {
      toast.error('Failed to update rate limit settings');
    } else {
      toast.success('Rate limit settings updated!');
      setPendingRateLimit(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isResendEnabled = currentAuthSettings.method === 'resend';

  return (
    <div className="space-y-6">
      {/* Authentication Method Card */}
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
          {pendingAuthSettings && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setPendingAuthSettings(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveAuth} disabled={isSaving}>
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

      {/* Email Template Customization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Email Template Customization
          </CardTitle>
          <CardDescription>
            Customize branded OTP email templates (used when Resend is enabled)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branding Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Branding</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">App Name</Label>
                <Input
                  id="app_name"
                  value={currentEmailTemplate.app_name}
                  onChange={(e) => handleEmailTemplateChange('app_name', e.target.value)}
                  placeholder="GT Inventory"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_emoji">Logo Emoji</Label>
                <Input
                  id="logo_emoji"
                  value={currentEmailTemplate.logo_emoji}
                  onChange={(e) => handleEmailTemplateChange('logo_emoji', e.target.value)}
                  placeholder="📦"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={currentEmailTemplate.primary_color}
                    onChange={(e) => handleEmailTemplateChange('primary_color', e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={currentEmailTemplate.primary_color}
                    onChange={(e) => handleEmailTemplateChange('primary_color', e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={currentEmailTemplate.secondary_color}
                    onChange={(e) => handleEmailTemplateChange('secondary_color', e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={currentEmailTemplate.secondary_color}
                    onChange={(e) => handleEmailTemplateChange('secondary_color', e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_text">Footer Text</Label>
              <Input
                id="footer_text"
                value={currentEmailTemplate.footer_text}
                onChange={(e) => handleEmailTemplateChange('footer_text', e.target.value)}
                placeholder="GT Inventory. All rights reserved."
              />
            </div>
          </div>

          <Separator />

          {/* Signup Email Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Signup Email</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup_subject">Subject</Label>
                <Input
                  id="signup_subject"
                  value={currentEmailTemplate.signup_subject}
                  onChange={(e) => handleEmailTemplateChange('signup_subject', e.target.value)}
                  placeholder="Verify Your Email - {{app_name}}"
                />
                <p className="text-xs text-muted-foreground">Use {"{{app_name}}"} to insert the app name</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup_heading">Heading</Label>
                <Input
                  id="signup_heading"
                  value={currentEmailTemplate.signup_heading}
                  onChange={(e) => handleEmailTemplateChange('signup_heading', e.target.value)}
                  placeholder="Verify Your Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup_message">Message</Label>
                <Textarea
                  id="signup_message"
                  value={currentEmailTemplate.signup_message}
                  onChange={(e) => handleEmailTemplateChange('signup_message', e.target.value)}
                  placeholder="Welcome to {{app_name}}! Use the code below to verify your email address."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Password Reset Email Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Password Reset Email</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset_subject">Subject</Label>
                <Input
                  id="reset_subject"
                  value={currentEmailTemplate.reset_subject}
                  onChange={(e) => handleEmailTemplateChange('reset_subject', e.target.value)}
                  placeholder="Reset Your Password - {{app_name}}"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset_heading">Heading</Label>
                <Input
                  id="reset_heading"
                  value={currentEmailTemplate.reset_heading}
                  onChange={(e) => handleEmailTemplateChange('reset_heading', e.target.value)}
                  placeholder="Reset Your Password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset_message">Message</Label>
                <Textarea
                  id="reset_message"
                  value={currentEmailTemplate.reset_message}
                  onChange={(e) => handleEmailTemplateChange('reset_message', e.target.value)}
                  placeholder="You requested to reset your password. Use the code below to complete the process."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {pendingEmailTemplate && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setPendingEmailTemplate(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveEmailTemplate} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preview Card */}
      <EmailPreview template={currentEmailTemplate} />

      {/* Rate Limiting Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate Limiting Configuration
          </CardTitle>
          <CardDescription>
            Control OTP request limits to prevent abuse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                min={1}
                max={20}
                value={currentRateLimit.max_attempts}
                onChange={(e) => handleRateLimitChange('max_attempts', parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum OTP requests before blocking
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="window_minutes">Window (minutes)</Label>
              <Input
                id="window_minutes"
                type="number"
                min={1}
                max={120}
                value={currentRateLimit.window_minutes}
                onChange={(e) => handleRateLimitChange('window_minutes', parseInt(e.target.value) || 15)}
              />
              <p className="text-xs text-muted-foreground">
                Time window for counting attempts
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="block_minutes">Block Duration (minutes)</Label>
              <Input
                id="block_minutes"
                type="number"
                min={1}
                max={1440}
                value={currentRateLimit.block_minutes}
                onChange={(e) => handleRateLimitChange('block_minutes', parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">
                How long to block after exceeding limit
              </p>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Current Policy</AlertTitle>
            <AlertDescription>
              Users are allowed <strong>{currentRateLimit.max_attempts} attempts</strong> within{' '}
              <strong>{currentRateLimit.window_minutes} minutes</strong>. If exceeded, they will be blocked for{' '}
              <strong>{currentRateLimit.block_minutes} minutes</strong>.
            </AlertDescription>
          </Alert>

          {/* Save/Cancel Buttons */}
          {pendingRateLimit && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setPendingRateLimit(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveRateLimit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Rate Limits'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
