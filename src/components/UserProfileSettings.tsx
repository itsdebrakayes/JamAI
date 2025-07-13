import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { X, Eye, EyeOff, CreditCard, User, Shield, FileText, Languages, LogOut, LogIn, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileSettings = ({ open, onOpenChange }: UserProfileSettingsProps) => {
  const { toast } = useToast();
  const { user, signOut, isGuest, guestMessagesRemaining } = useAuth();
  const { limits, usage, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSummary, setAutoSummary] = useState(false);
  const [translationMode, setTranslationMode] = useState(false);

  // Load user data and preferences
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    
    // Load preferences from localStorage for both users and guests
    const savedAutoSummary = localStorage.getItem('autoSummary') === 'true';
    const savedTranslationMode = localStorage.getItem('translationMode') === 'true';
    setAutoSummary(savedAutoSummary);
    setTranslationMode(savedTranslationMode);
  }, [user]);

  const handleUpdateEmail = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      
      toast({
        title: "Email updated",
        description: "Please check your new email for verification.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update email.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setPassword('');
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      onOpenChange(false);
      await signOut();
      navigate('/auth');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const handleSignOutAll = async () => {
    try {
      onOpenChange(false);
      await supabase.auth.signOut({ scope: 'global' });
      navigate('/auth');
      toast({
        title: "Signed out from all devices",
        description: "You have been successfully signed out from all devices.",
      });
    } catch (error) {
      console.error('Error signing out from all devices:', error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Failed to sign out from all devices. Please try again.",
      });
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    if (key === 'autoSummary') {
      setAutoSummary(value);
    } else if (key === 'translationMode') {
      setTranslationMode(value);
    }
    
    // Save to localStorage for both users and guests
    localStorage.setItem(key, value.toString());
    
    // TODO: For authenticated users, also save to Supabase profiles table
    if (user) {
      // This would be implemented to sync with the database
    }
  };

  const getTierInfo = () => {
    if (isGuest) {
      return {
        name: 'Guest',
        badgeColor: 'bg-gray-500',
        description: 'Limited access - Sign in for full features'
      };
    }
    
    if (!limits) return { name: 'Loading...', badgeColor: 'bg-gray-500', description: '' };
    
    switch (limits.tier) {
      case 'jamai_ultra':
        return { name: 'Ultra', badgeColor: 'bg-purple-600', description: 'Unlimited messages and features' };
      case 'jamai_plus':
        return { name: 'Plus', badgeColor: 'bg-blue-600', description: 'Enhanced features with higher limits' };
      default:
        return { name: 'Free', badgeColor: 'bg-green-600', description: 'Basic features with daily limits' };
    }
  };

  const getUsageDisplay = (used: number, limit: number) => {
    if (limit === -1) return '∞';
    return `${used}/${limit}`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return (used / limit) * 100;
  };

  if (isGuest) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">Guest Settings</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Guest Status */}
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Guest Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-gray-500 text-white px-3 py-1">
                    Guest User
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {guestMessagesRemaining} messages remaining
                  </span>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">{guestMessagesRemaining}</div>
                  <div className="text-sm text-muted-foreground mb-3">Guest messages remaining</div>
                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/auth');
                    }}
                    className="w-full bg-gradient-to-r from-yellow-600 to-green-600 hover:from-yellow-700 hover:to-green-700 text-white"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In for More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary & Translation Settings for Guests */}
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Basic AI response settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-summary" className="flex items-center gap-2">
                    📝 Auto Summary
                  </Label>
                  <Switch 
                    id="auto-summary" 
                    checked={autoSummary}
                    onCheckedChange={(value) => handlePreferenceChange('autoSummary', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="translation-mode" className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Translation Mode
                  </Label>
                  <Switch 
                    id="translation-mode" 
                    checked={translationMode}
                    onCheckedChange={(value) => handlePreferenceChange('translationMode', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const tierInfo = getTierInfo();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-semibold bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">Settings & Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Subscription Plan */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Subscription Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${tierInfo.badgeColor} text-white px-3 py-1`}>
                  {tierInfo.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {tierInfo.description}
                </span>
              </div>
              
              {!subscriptionLoading && limits && usage && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">
                      {getUsageDisplay(usage.messages_used || 0, limits.daily_message_limit)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Messages Today</div>
                    {limits.daily_message_limit !== -1 && (
                      <Progress 
                        value={getUsagePercentage(usage.messages_used || 0, limits.daily_message_limit)} 
                        className="h-2"
                      />
                    )}
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">
                      {getUsageDisplay(usage.media_uploads_used || 0, limits.daily_media_limit)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Media Uploads Today</div>
                    {limits.daily_media_limit !== -1 && (
                      <Progress 
                        value={getUsagePercentage(usage.media_uploads_used || 0, limits.daily_media_limit)} 
                        className="h-2"
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  📧 Email Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 border-2 border-yellow-500/50 focus:border-yellow-500"
                  />
                  <Button
                    onClick={handleUpdateEmail}
                    disabled={isLoading || email === user?.email}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Update
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  🔒 New Password
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (6+ characters)"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isLoading || password.length < 6}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary & Translation Settings */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Summary & Translation
              </CardTitle>
              <CardDescription>
                Configure AI response settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-summary" className="flex items-center gap-2">
                  📝 Auto Summary
                </Label>
                <Switch 
                  id="auto-summary" 
                  checked={autoSummary}
                  onCheckedChange={(value) => handlePreferenceChange('autoSummary', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="translation-mode" className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translation Mode
                </Label>
                <Switch 
                  id="translation-mode" 
                  checked={translationMode}
                  onCheckedChange={(value) => handlePreferenceChange('translationMode', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Actions */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Security Actions
              </CardTitle>
              <CardDescription>
                Manage your account security and sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out of account
              </Button>
              
              <Button
                onClick={handleSignOutAll}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out of all accounts
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserProfileSettings;