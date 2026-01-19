import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Share, Plus, Check, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle>App Installed!</CardTitle>
            <CardDescription>
              Inventory Manager is now installed on your device. You can access it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Open App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Install Inventory Manager</CardTitle>
          <CardDescription>
            Install this app on your device for quick access, offline support, and a native app experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Android/Desktop - Direct install */}
          {deferredPrompt && (
            <Button className="w-full" size="lg" onClick={handleInstallClick}>
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          )}

          {/* iOS Instructions */}
          {isIOS && !deferredPrompt && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iPhone/iPad:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">1. Tap the Share button</p>
                    <p className="text-muted-foreground">In Safari's bottom menu bar</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">2. Tap "Add to Home Screen"</p>
                    <p className="text-muted-foreground">Scroll down in the share menu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">3. Tap "Add"</p>
                    <p className="text-muted-foreground">Confirm to add to home screen</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for browsers that don't support install */}
          {!isIOS && !deferredPrompt && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                To install this app, use your browser menu and look for "Install App" or "Add to Home Screen".
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
                Continue to App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Features list */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">Why install?</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2">
                <div className="text-lg mb-1">⚡</div>
                <p className="text-xs text-muted-foreground">Faster</p>
              </div>
              <div className="p-2">
                <div className="text-lg mb-1">📱</div>
                <p className="text-xs text-muted-foreground">Home Screen</p>
              </div>
              <div className="p-2">
                <div className="text-lg mb-1">🔄</div>
                <p className="text-xs text-muted-foreground">Offline</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
