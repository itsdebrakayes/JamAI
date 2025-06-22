
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionLimits {
  tier: string;
  daily_message_limit: number;
  daily_media_limit: number;
}

interface UsageData {
  messages_used: number;
  media_uploads_used: number;
  period_start: string;
  period_end: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimits = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase.rpc('get_subscription_limits', {
        user_email: user.email
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setLimits(data[0]);
      }
    } catch (error) {
      console.error('Error fetching subscription limits:', error);
    }
  };

  const fetchUsage = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_start', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const checkLimit = async (type: 'messages' | 'media'): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        limit_type: type
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  };

  const incrementUsage = async (type: 'messages' | 'media', amount = 1): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        usage_type: type,
        amount
      });

      if (error) throw error;
      
      // Refresh usage data
      await fetchUsage();
      return data;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLimits(), fetchUsage()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  return {
    limits,
    usage,
    loading,
    checkLimit,
    incrementUsage,
    refetch: () => Promise.all([fetchLimits(), fetchUsage()])
  };
};
