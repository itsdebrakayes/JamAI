
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogOut, Shield, CreditCard, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfileSettings = () => {
  const { user, signOut } = useAuth();
  const { limits, usage } = useSubscription();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });
      
      if (error) throw error;
      
      toast({
        title: "Email Updated",
        description: "Please check your new email to confirm the change.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setNewPassword('');
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been signed out from all devices.",
      });
      
      // Force page reload to ensure complete logout
      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionTier = () => {
    if (!limits) return 'Free';
    
    switch (limits.tier) {
      case 'jamai_plus':
        return 'Plus';
      case 'jamai_ultra':
        return 'Ultra';
      default:
        return 'Free';
    }
  };

  const getSubscriptionColor = () => {
    if (!limits) return 'secondary';
    
    switch (limits.tier) {
      case 'jamai_plus':
        return 'default';
      case 'jamai_ultra':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge variant={getSubscriptionColor()}>
                {getSubscriptionTier()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {limits?.tier === 'jamai_ultra' 
                  ? 'Unlimited messages and features'
                  : limits?.tier === 'jamai_plus'
                  ? '500 messages per day'
                  : '50 messages per day'
                }
              </p>
            </div>
          </div>
          
          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {limits?.daily_message_limit === -1 ? '∞' : usage?.messages_used || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Messages Used Today
                {limits?.daily_message_limit !== -1 && ` / ${limits?.daily_message_limit}`}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {limits?.daily_media_limit === -1 ? '∞' : usage?.media_uploads_used || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Media Uploads Today
                {limits?.daily_media_limit !== -1 && ` / ${limits?.daily_media_limit}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account information and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateEmail}
                disabled={loading || email === user?.email}
                size="sm"
              >
                Update
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Current Password
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword}
                size="sm"
              >
                Update
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                variant="link"
                size="sm"
                onClick={handleForgotPassword}
                disabled={loading}
                className="px-0 h-auto text-sm text-muted-foreground hover:text-primary"
              >
                Forgot Password?
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Actions
          </CardTitle>
          <CardDescription>
            Manage your account security and sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="text-sm font-medium">Sign out all devices</h4>
              <p className="text-sm text-muted-foreground">
                This will sign you out from all devices and sessions
              </p>
            </div>
            <Button 
              onClick={handleSignOutAllDevices}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileSettings;
