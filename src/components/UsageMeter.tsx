
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Image, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const UsageMeter = () => {
  const { limits, usage, loading } = useSubscription();

  if (loading || !limits) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messagesUsed = usage?.messages_used || 0;
  const mediaUsed = usage?.media_uploads_used || 0;
  
  const messageProgress = limits.daily_message_limit === -1 ? 0 : (messagesUsed / limits.daily_message_limit) * 100;
  const mediaProgress = limits.daily_media_limit === -1 ? 0 : (mediaUsed / limits.daily_media_limit) * 100;

  const isUnlimited = limits.daily_message_limit === -1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          Daily Usage
          {isUnlimited && <Crown className="w-4 h-4 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Messages Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </span>
            <span className="font-medium">
              {isUnlimited ? (
                <span className="text-yellow-600 font-bold">∞ Unlimited</span>
              ) : (
                `${messagesUsed}/${limits.daily_message_limit}`
              )}
            </span>
          </div>
          {!isUnlimited && (
            <Progress 
              value={messageProgress} 
              className="h-2"
              aria-label={`Messages used: ${messagesUsed} of ${limits.daily_message_limit}`}
            />
          )}
        </div>

        {/* Media Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Media Uploads
            </span>
            <span className="font-medium">
              {limits.daily_media_limit === -1 ? (
                <span className="text-yellow-600 font-bold">∞ Unlimited</span>
              ) : (
                `${mediaUsed}/${limits.daily_media_limit}`
              )}
            </span>
          </div>
          {limits.daily_media_limit !== -1 && (
            <Progress 
              value={mediaProgress} 
              className="h-2"
              aria-label={`Media uploads used: ${mediaUsed} of ${limits.daily_media_limit}`}
            />
          )}
        </div>

        {/* Tier Information */}
        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {limits.tier === 'free' && 'Upgrade to JamAI Plus or Ultra for higher limits'}
            {limits.tier === 'jamai_plus' && 'Upgrade to JamAI Ultra for unlimited usage'}
            {limits.tier === 'jamai_ultra' && 'Enjoying unlimited JamAI Ultra!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageMeter;
