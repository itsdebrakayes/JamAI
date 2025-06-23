
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for memory entries stored in both localStorage and database
 */
interface MemoryEntry {
  id?: string;
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation';
  userQuery: string;
  aiResponse: string;
  keywords: string[];
  importanceScore?: number;
  isPermanent?: boolean;
  timestamp: string;
}

/**
 * Enhanced Memory Service
 * 
 * Provides intelligent memory management with:
 * - Cross-device synchronization via Supabase
 * - Local caching for performance
 * - Smart context injection for AI responses
 * - Memory categorization and prioritization
 */
export class MemoryService {
  private localStorageKey = 'jamAI-enhanced-knowledge';
  private isAuthenticated = false;

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Check if user is authenticated for database operations
   */
  private async checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    this.isAuthenticated = !!user;
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2 && !commonWords.includes(word)).slice(0, 15);
  }

  /**
   * Categorize content based on keywords and context
   */
  private categorizeContent(userQuery: string, aiResponse: string): MemoryEntry['category'] {
    const combinedText = (userQuery + ' ' + aiResponse).toLowerCase();
    
    if (combinedText.includes('recipe') || combinedText.includes('cook') || combinedText.includes('ingredient') || combinedText.includes('dish') || combinedText.includes('prepare')) {
      return 'recipe';
    }
    if (combinedText.includes('recommend') || combinedText.includes('suggest') || combinedText.includes('pair') || combinedText.includes('goes with') || combinedText.includes('best for')) {
      return 'recommendation';
    }
    if (combinedText.includes('like') || combinedText.includes('prefer') || combinedText.includes('favorite') || combinedText.includes('love') || combinedText.includes('hate') || combinedText.includes('enjoy')) {
      return 'preference';
    }
    if (combinedText.includes('what') || combinedText.includes('how') || combinedText.includes('why') || combinedText.includes('when') || combinedText.includes('where')) {
      return 'fact';
    }
    
    return 'conversation';
  }

  /**
   * Calculate importance score based on various factors
   */
  private calculateImportanceScore(userQuery: string, aiResponse: string, category: string): number {
    let score = 1;
    
    // Longer responses might be more important
    if (aiResponse.length > 200) score += 1;
    if (aiResponse.length > 500) score += 1;
    
    // Certain categories are more important
    if (category === 'preference') score += 2;
    if (category === 'recipe') score += 1;
    
    // Questions about personal info are important
    if (userQuery.toLowerCase().includes('my') || userQuery.toLowerCase().includes('i ')) score += 1;
    
    return Math.min(score, 5);
  }

  /**
   * Store memory in both localStorage and database
   */
  async storeMemory(userQuery: string, aiResponse: string): Promise<void> {
    // Skip short exchanges
    if (userQuery.length < 10 || aiResponse.length < 20) {
      console.log('🧠 Memory: Exchange too short, not storing');
      return;
    }

    const category = this.categorizeContent(userQuery, aiResponse);
    const keywords = this.extractKeywords(userQuery + ' ' + aiResponse);
    const importanceScore = this.calculateImportanceScore(userQuery, aiResponse, category);
    
    const memoryEntry: MemoryEntry = {
      category,
      userQuery,
      aiResponse,
      keywords,
      importanceScore,
      isPermanent: importanceScore >= 4,
      timestamp: new Date().toISOString()
    };

    console.log(`🧠 Memory: Storing ${category} memory with importance ${importanceScore}`);

    // Store locally first for immediate access
    this.storeInLocalStorage(memoryEntry);

    // Store in database if authenticated
    if (this.isAuthenticated) {
      await this.storeInDatabase(memoryEntry);
    }
  }

  /**
   * Store memory in localStorage
   */
  private storeInLocalStorage(entry: MemoryEntry) {
    try {
      const existing = localStorage.getItem(this.localStorageKey);
      const memories: MemoryEntry[] = existing ? JSON.parse(existing) : [];
      
      memories.push(entry);
      
      // Keep only last 100 entries locally
      if (memories.length > 100) {
        memories.splice(0, memories.length - 100);
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(memories));
      console.log(`🧠 Memory: Stored locally. Total: ${memories.length}`);
    } catch (error) {
      console.error('Error storing memory locally:', error);
    }
  }

  /**
   * Store memory in Supabase database
   */
  private async storeInDatabase(entry: MemoryEntry) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('user_memories')
        .insert({
          user_id: user.id,
          category: entry.category,
          user_query: entry.userQuery,
          ai_response: entry.aiResponse,
          keywords: entry.keywords,
          importance_score: entry.importanceScore || 1,
          is_permanent: entry.isPermanent || false
        });

      if (error) throw error;
      console.log('🧠 Memory: Stored in database successfully');
    } catch (error) {
      console.error('Error storing memory in database:', error);
    }
  }

  /**
   * Sync memories from database to localStorage
   */
  async syncMemoriesFromDatabase(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      const { data, error } = await supabase.rpc('get_recent_memories_by_category', {
        days_back: 90,
        limit_per_category: 10
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const localMemories: MemoryEntry[] = data.map(item => ({
          category: item.category as MemoryEntry['category'],
          userQuery: item.user_query,
          aiResponse: item.ai_response,
          keywords: [],
          timestamp: item.created_at
        }));

        localStorage.setItem(this.localStorageKey, JSON.stringify(localMemories));
        console.log(`🧠 Memory: Synced ${localMemories.length} memories from database`);
      }
    } catch (error) {
      console.error('Error syncing memories from database:', error);
    }
  }

  /**
   * Get relevant memories for context injection
   */
  async getRelevantMemories(currentQuery: string, limit: number = 5): Promise<string> {
    console.log('🧠 Memory: Building context from stored memories...');
    
    let memories: MemoryEntry[] = [];

    // Try to get from database first if authenticated
    if (this.isAuthenticated) {
      memories = await this.getMemoriesFromDatabase(currentQuery, limit);
    }

    // Fallback to localStorage if no database memories
    if (memories.length === 0) {
      memories = await this.getMemoriesFromLocalStorage(currentQuery, limit);
    }

    if (memories.length === 0) {
      console.log('🧠 Memory: No relevant memories found');
      return '';
    }

    // Group by category for better organization
    const categorized = memories.reduce((acc, memory) => {
      if (!acc[memory.category]) acc[memory.category] = [];
      acc[memory.category].push(`User: ${memory.userQuery}\nAssistant: ${memory.aiResponse}`);
      return acc;
    }, {} as Record<string, string[]>);

    // Build context string
    let contextString = '\n=== RELEVANT USER HISTORY ===\n';
    Object.entries(categorized).forEach(([category, entries]) => {
      if (entries.length > 0) {
        contextString += `\n${category.toUpperCase()} MEMORIES:\n${entries.slice(0, 3).join('\n---\n')}\n`;
      }
    });
    contextString += '=== END USER HISTORY ===\n';

    console.log(`🧠 Memory: Generated context with ${memories.length} memories (${contextString.length} chars)`);
    return contextString;
  }

  /**
   * Get memories from database with keyword matching
   */
  private async getMemoriesFromDatabase(query: string, limit: number): Promise<MemoryEntry[]> {
    try {
      const keywords = this.extractKeywords(query);
      
      const { data, error } = await supabase.rpc('search_user_memories', {
        search_keywords: keywords,
        limit_count: limit
      });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        category: item.category as MemoryEntry['category'],
        userQuery: item.user_query,
        aiResponse: item.ai_response,
        keywords: item.keywords,
        importanceScore: item.importance_score,
        isPermanent: item.is_permanent,
        timestamp: item.created_at
      }));
    } catch (error) {
      console.error('Error getting memories from database:', error);
      return [];
    }
  }

  /**
   * Get memories from localStorage with basic keyword matching
   */
  private async getMemoriesFromLocalStorage(query: string, limit: number): Promise<MemoryEntry[]> {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return [];

      const memories: MemoryEntry[] = JSON.parse(stored);
      const queryKeywords = this.extractKeywords(query);
      
      // Score memories based on keyword overlap
      const scoredMemories = memories.map(memory => {
        const overlap = memory.keywords.filter(keyword => 
          queryKeywords.some(qk => qk.includes(keyword) || keyword.includes(qk))
        ).length;
        return { memory, score: overlap + (memory.importanceScore || 1) };
      });

      // Sort by score and return top results
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.memory);
    } catch (error) {
      console.error('Error getting memories from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear all memories (useful for testing or user request)
   */
  async clearAllMemories(): Promise<void> {
    localStorage.removeItem(this.localStorageKey);
    
    if (this.isAuthenticated) {
      try {
        const { error } = await supabase
          .from('user_memories')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's memories

        if (error) throw error;
        console.log('🧠 Memory: Cleared all memories from database');
      } catch (error) {
        console.error('Error clearing memories from database:', error);
      }
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
    if (this.isAuthenticated) {
      try {
        const { data, error } = await supabase
          .from('user_memories')
          .select('category');

        if (error) throw error;

        const byCategory = (data || []).reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          total: data?.length || 0,
          byCategory
        };
      } catch (error) {
        console.error('Error getting memory stats:', error);
      }
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return { total: 0, byCategory: {} };

      const memories: MemoryEntry[] = JSON.parse(stored);
      const byCategory = memories.reduce((acc, memory) => {
        acc[memory.category] = (acc[memory.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: memories.length,
        byCategory
      };
    } catch (error) {
      console.error('Error getting memory stats from localStorage:', error);
      return { total: 0, byCategory: {} };
    }
  }
}

export const memoryService = new MemoryService();
