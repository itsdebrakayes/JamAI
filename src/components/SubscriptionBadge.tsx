
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionBadge = () => {
  const { limits, usage, loading } = useSubscription();

  if (loading || !limits) return null;

  const getIcon = () => {
    switch (limits.tier) {
      case 'jamai_ultra':
        return <Crown className="w-3 h-3" />;
      case 'jamai_plus':
        return <Zap className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  const getColor = () => {
    switch (limits.tier) {
      case 'jamai_ultra':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'jamai_plus':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getDisplayName = () => {
    switch (limits.tier) {
      case 'jamai_ultra':
        return 'Ultra';
      case 'jamai_plus':
        return 'Plus';
      default:
        return 'Free';
    }
  };

  const getUsageText = () => {
    if (limits.daily_message_limit === -1) return 'Unlimited';
    
    const messagesUsed = usage?.messages_used || 0;
    return `${messagesUsed}/${limits.daily_message_limit}`;
  };

  return (
    <Badge className={`${getColor()} border-0 font-medium px-3 py-1`}>
      <div className="flex items-center gap-1">
        {getIcon()}
        <span>{getDisplayName()}</span>
        <span className="text-xs opacity-80">({getUsageText()})</span>
      </div>
    </Badge>
  );
};

export default SubscriptionBadge;
