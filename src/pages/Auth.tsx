import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ArrowLeft, KeyRound, Gamepad2 } from 'lucide-react';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import appLogo from '@/assets/logo.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthView = 'main' | 'signup-verify' | 'forgot-password' | 'reset-password-form';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  const { settings, isLoading: settingsLoading } = useAppSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<AuthView>('main');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [growId, setGrowId] = useState('');
  
  // OTP verification state (for Resend method)
  const [pendingOTP, setPendingOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  
  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  
  // Password update state (for magic link flow)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Determine auth method - only access when settings are loaded
  const useResendOTP = !settingsLoading && settings.auth_method?.method === 'resend';

  // Check for password reset token in URL
  useEffect(() => {
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    
    if (type === 'recovery' && accessToken) {
      setView('reset-password-form');
    }
  }, [searchParams]);

  // Redirect if already logged in (but not in reset mode)
  useEffect(() => {
    if (user && !authLoading && view !== 'reset-password-form') {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate, view]);

  const sendOTPEmail = async (email: string, otp: string, type: 'signup' | 'password_reset') => {
    const response = await supabase.functions.invoke('send-otp', {
      body: { email, otp, type },
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to send verification email');
    }
    
    if (response.data?.error) {
      throw new Error(response.data.error);
    }
    
    return response.data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    if (!growId.trim()) {
      toast.error('GrowID is required');
      return;
    }
    
    if (growId.trim().length < 3) {
      toast.error('GrowID must be at least 3 characters');
      return;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    // Use OTP flow if Resend is enabled
    if (useResendOTP) {
      try {
        const otp = generateOTP();
        await sendOTPEmail(signupEmail, otp, 'signup');
        
        setPendingOTP(otp);
        setOtpExpiry(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
        setView('signup-verify');
        toast.success('Verification code sent to your email!');
      } catch (error: unknown) {
        const err = error as Error;
        toast.error(err.message || 'Failed to send verification code');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Direct signup with auto-confirm (Supabase built-in)
    const { error } = await signUp(signupEmail, signupPassword, growId.trim().toUpperCase());
    
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists. Please log in.');
      } else if (error.message.includes('grow_id') || error.message.includes('duplicate')) {
        toast.error('This GrowID is already taken. Please use a different one.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    }
  };

  const handleVerifyOTP = async () => {
    if (enteredOTP.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    
    if (otpExpiry && new Date() > otpExpiry) {
      toast.error('Verification code has expired. Please try again.');
      setView('main');
      return;
    }
    
    if (enteredOTP !== pendingOTP) {
      toast.error('Invalid verification code');
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, growId.trim().toUpperCase() || undefined);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists. Please log in.');
      } else if (error.message.includes('grow_id') || error.message.includes('duplicate')) {
        toast.error('This GrowID is already taken. Please use a different one.');
      } else {
        toast.error(error.message);
      }
      setView('main');
    } else {
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    }
  };

  const resendOTP = async () => {
    setIsSubmitting(true);
    
    try {
      const otp = generateOTP();
      await sendOTPEmail(signupEmail, otp, 'signup');
      
      setPendingOTP(otp);
      setOtpExpiry(new Date(Date.now() + 10 * 60 * 1000));
      toast.success('New verification code sent!');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password reset link sent! Check your email.');
      setView('main');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        throw error;
      }
      
      toast.success('Password updated successfully!');
      navigate('/', { replace: true });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password Reset Form (after clicking magic link)
  if (view === 'reset-password-form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button
              onClick={handleUpdatePassword}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification View for Signup (only when using Resend)
  if (view === 'signup-verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md relative">
          <CardHeader className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setView('main')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex justify-center mb-2 pt-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <strong>{signupEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={enteredOTP}
                onChange={setEnteredOTP}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button
              onClick={handleVerifyOTP}
              className="w-full"
              disabled={isSubmitting || enteredOTP.length !== 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Create Account'
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={resendOTP}
                disabled={isSubmitting}
              >
                Resend
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot Password View
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md relative">
          <CardHeader className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setView('main')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex justify-center mb-2 pt-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Login/Signup View
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={appLogo} alt="GrowStock Logo" className="h-32 w-32 rounded-xl" />
          </div>
          <CardTitle className="text-2xl">GrowStock</CardTitle>
          <CardDescription>
            Your inventory management solution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => setView('forgot-password')}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grow-id">GrowID *</Label>
                  <div className="relative">
                    <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="grow-id"
                      type="text"
                      placeholder="Your Growtopia GrowID"
                      value={growId}
                      onChange={(e) => setGrowId(e.target.value.toUpperCase())}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your in-game GrowID (will be converted to uppercase)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {useResendOTP ? 'Sending code...' : 'Creating account...'}
                    </>
                  ) : (
                    useResendOTP ? 'Send Verification Code' : 'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
