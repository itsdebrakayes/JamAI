
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { memoryService } from '@/services/memoryService';
import { useAuth } from '@/contexts/AuthContext';

interface MemoryStats {
  total: number;
  byCategory: Record<string, number>;
}

export const MemoryStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MemoryStats>({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const memoryStats = await memoryService.getMemoryStats();
      setStats(memoryStats);
    } catch (error) {
      console.error('Error loading memory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMemories = async () => {
    if (confirm('Are you sure you want to clear all stored memories? This cannot be undone.')) {
      await memoryService.clearAllMemories();
      await loadStats();
    }
  };

  const handleSyncMemories = async () => {
    if (user) {
      await memoryService.syncMemoriesFromDatabase();
      await loadStats();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory System</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading memory statistics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Memory System</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your AI assistant remembers conversations to provide better, personalized responses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">Total Memories: {stats.total}</p>
          {user && (
            <p className="text-sm text-muted-foreground">
              Synced across all your devices
            </p>
          )}
        </div>

        {Object.keys(stats.byCategory).length > 0 && (
          <div>
            <p className="font-medium mb-2">By Category:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <Badge key={category} variant="secondary">
                  {category}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {user && (
            <Button 
              onClick={handleSyncMemories} 
              variant="outline" 
              size="sm"
            >
              Sync Memories
            </Button>
          )}
          <Button 
            onClick={handleClearMemories} 
            variant="destructive" 
            size="sm"
          >
            Clear All Memories
          </Button>
        </div>

        {!user && (
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Sign in to sync your memories across devices. 
              Currently, memories are only stored locally on this device.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
