import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Bell, Mail, Send, Loader2, Users, User } from 'lucide-react';

interface UserProfile {
  user_id: string;
  grow_id: string | null;
  email: string | null;
}

export function NotificationSender() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notificationType, setNotificationType] = useState<'popup' | 'email' | 'both'>('popup');
  const [targetType, setTargetType] = useState<'individual' | 'broadcast'>('broadcast');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users for individual targeting
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, grow_id, email')
          .order('grow_id');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const getSenderDisplayName = () => {
    if (isAnonymous) return null;
    if (role === 'owner') return 'Owner';
    if (role === 'admin') return 'Admin';
    return role?.charAt(0).toUpperCase() + role?.slice(1) || 'Admin';
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (targetType === 'individual' && !selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setIsSending(true);

    try {
      // Create the notification
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          sender_id: user?.id,
          sender_display_name: getSenderDisplayName(),
          is_anonymous: isAnonymous,
          title: title.trim(),
          content: content.trim(),
          notification_type: notificationType,
          target_type: targetType,
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Get target users
      let targetUserIds: string[] = [];

      if (targetType === 'broadcast') {
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('user_id');

        if (usersError) throw usersError;
        targetUserIds = allUsers?.map(u => u.user_id) || [];
      } else {
        targetUserIds = [selectedUserId];
      }

      // Create user_notifications entries
      const userNotifications = targetUserIds.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
      }));

      const { error: userNotificationError } = await supabase
        .from('user_notifications')
        .insert(userNotifications);

      if (userNotificationError) throw userNotificationError;

      // If email type, send emails
      if (notificationType === 'email' || notificationType === 'both') {
        // Get user emails
        const { data: userEmails } = await supabase
          .from('profiles')
          .select('email')
          .in('user_id', targetUserIds)
          .not('email', 'is', null);

        const emails = userEmails?.map(u => u.email).filter(Boolean) || [];

        if (emails.length > 0) {
          // Send notification emails via edge function
          const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
            body: {
              emails,
              title: title.trim(),
              content: content.trim(),
              sender: isAnonymous ? 'System' : getSenderDisplayName(),
            },
          });

          if (emailError) {
            console.error('Email sending error:', emailError);
            toast.warning('Notification created but some emails failed to send');
          }
        }
      }

      toast.success(
        targetType === 'broadcast'
          ? `Notification sent to ${targetUserIds.length} users!`
          : 'Notification sent!'
      );

      // Reset form
      setTitle('');
      setContent('');
      setSelectedUserId('');
      setIsAnonymous(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Notification
        </CardTitle>
        <CardDescription>
          Send popups or emails to your users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Type */}
        <div className="space-y-3">
          <Label>Target Audience</Label>
          <RadioGroup
            value={targetType}
            onValueChange={(v) => setTargetType(v as 'individual' | 'broadcast')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="broadcast" id="broadcast" />
              <Label htmlFor="broadcast" className="flex items-center gap-1 cursor-pointer">
                <Users className="h-4 w-4" />
                All Users
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex items-center gap-1 cursor-pointer">
                <User className="h-4 w-4" />
                Specific User
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* User Selection (for individual) */}
        {targetType === 'individual' && (
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <div className="p-2 text-center text-muted-foreground">Loading...</div>
                ) : (
                  users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.grow_id || u.email || 'Unknown User'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notification Type */}
        <div className="space-y-3">
          <Label>Notification Type</Label>
          <RadioGroup
            value={notificationType}
            onValueChange={(v) => setNotificationType(v as 'popup' | 'email' | 'both')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="popup" id="popup" />
              <Label htmlFor="popup" className="flex items-center gap-1 cursor-pointer">
                <Bell className="h-4 w-4" />
                Popup Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex items-center gap-1 cursor-pointer">
                <Mail className="h-4 w-4" />
                Email Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="cursor-pointer">Both</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="notification-title">Title *</Label>
          <Input
            id="notification-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title..."
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="notification-content">Message *</Label>
          <Textarea
            id="notification-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your message here..."
            rows={4}
          />
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Send Anonymously</Label>
            <p className="text-xs text-muted-foreground">
              Hide your identity (shows as "System")
            </p>
          </div>
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        </div>

        {/* Preview Sender */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Will appear from:</span>
          <Badge variant="secondary">
            {isAnonymous ? 'System' : getSenderDisplayName()}
          </Badge>
        </div>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={isSending} className="w-full">
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
