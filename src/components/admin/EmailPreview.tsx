import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, KeyRound } from 'lucide-react';
import { EmailTemplateSettings } from '@/hooks/useAppSettings';

interface EmailPreviewProps {
  template: EmailTemplateSettings;
}

function replaceTemplateVariables(text: string, appName: string): string {
  return text.replace(/\{\{app_name\}\}/g, appName);
}

function generateEmailHtml(
  template: EmailTemplateSettings,
  type: 'signup' | 'reset'
): string {
  const heading = type === 'reset' ? template.reset_heading : template.signup_heading;
  const message = replaceTemplateVariables(
    type === 'reset' ? template.reset_message : template.signup_message,
    template.app_name
  );

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.primary_color}, ${template.secondary_color}); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 28px;">${template.logo_emoji}</span>
            </div>
            <h1 style="color: #18181b; margin: 0; font-size: 24px; font-weight: 600;">
              ${heading}
            </h1>
          </div>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
            ${message}
          </p>
          
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
            <p style="color: #71717a; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
              Your verification code
            </p>
            <div style="font-size: 36px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: monospace;">
              123456
            </div>
          </div>
          
          <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} ${template.footer_text}
        </p>
      </div>
    </div>
  `;
}

export function EmailPreview({ template }: EmailPreviewProps) {
  const [previewType, setPreviewType] = useState<'signup' | 'reset'>('signup');

  const subject = replaceTemplateVariables(
    previewType === 'reset' ? template.reset_subject : template.signup_subject,
    template.app_name
  );

  const emailHtml = generateEmailHtml(template, previewType);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={previewType} onValueChange={(v) => setPreviewType(v as 'signup' | 'reset')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Signup
            </TabsTrigger>
            <TabsTrigger value="reset" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Password Reset
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                <Badge variant="outline" className="font-normal">{subject}</Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reset" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                <Badge variant="outline" className="font-normal">{subject}</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Email Preview Frame */}
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <div className="bg-muted px-3 py-2 border-b flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">Email Preview</span>
          </div>
          <div 
            className="p-0 max-h-[500px] overflow-auto"
            style={{ backgroundColor: '#f4f4f5' }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: emailHtml }}
              style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This is a preview of how your OTP email will appear to users. The actual code "123456" is just a placeholder.
        </p>
      </CardContent>
    </Card>
  );
}
