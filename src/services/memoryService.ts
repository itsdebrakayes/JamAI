import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced interface for memory entries with new fields
 */
interface MemoryEntry {
  id?: string;
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation';
  title?: string;
  userQuery: string;
  aiResponse: string;
  content?: Record<string, any>;
  keywords: string[];
  importanceScore?: number;
  isPermanent?: boolean;
  expiresAt?: string;
  timestamp: string;
}

/**
 * Enhanced Memory Service with improved features
 * 
 * New features:
 * - Automatic title generation
 * - Structured content storage
 * - Memory expiration with cleanup
 * - Enhanced importance scoring (default 3)
 * - Better context building with titles
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
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth check error:', error);
        this.isAuthenticated = false;
        return;
      }
      this.isAuthenticated = !!user;
    } catch (error) {
      console.error('Auth status check failed:', error);
      this.isAuthenticated = false;
    }
  }

  /**
   * Generate a meaningful title from user query and AI response
   */
  private generateTitle(userQuery: string, aiResponse: string, category: string): string {
    // For preferences, create descriptive titles
    if (category === 'preference') {
      if (userQuery.toLowerCase().includes('like') || userQuery.toLowerCase().includes('prefer')) {
        return `Likes: ${userQuery.substring(0, 30)}${userQuery.length > 30 ? '...' : ''}`;
      }
      if (userQuery.toLowerCase().includes('allergic') || userQuery.toLowerCase().includes('allergy')) {
        return `Allergy: ${userQuery.substring(0, 30)}${userQuery.length > 30 ? '...' : ''}`;
      }
      return `Preference: ${userQuery.substring(0, 25)}${userQuery.length > 25 ? '...' : ''}`;
    }

    // For recipes, extract dish names
    if (category === 'recipe') {
      const dishMatch = aiResponse.match(/(?:recipe for|how to make|cooking)\s+([^.!?]+)/i);
      if (dishMatch) {
        return `Recipe: ${dishMatch[1].trim()}`;
      }
      return `Recipe: ${userQuery.substring(0, 30)}${userQuery.length > 30 ? '...' : ''}`;
    }

    // For recommendations, be specific
    if (category === 'recommendation') {
      return `Recommended: ${userQuery.substring(0, 25)}${userQuery.length > 25 ? '...' : ''}`;
    }

    // For facts, make it clear
    if (category === 'fact') {
      return `Fact: ${userQuery.substring(0, 30)}${userQuery.length > 30 ? '...' : ''}`;
    }

    // Default title for conversations
    return userQuery.substring(0, 40) + (userQuery.length > 40 ? '...' : '');
  }

  /**
   * Extract structured content from responses based on category
   */
  private extractStructuredContent(userQuery: string, aiResponse: string, category: string): Record<string, any> {
    const content: Record<string, any> = {};

    if (category === 'recipe') {
      // Extract ingredients and steps if available
      const ingredientsMatch = aiResponse.match(/ingredients?:?\s*\n?((?:[-•*]\s*.+\n?)+)/i);
      const stepsMatch = aiResponse.match(/(?:instructions?|steps?|method):?\s*\n?((?:(?:\d+\.|\d+\)|-|•|\*)\s*.+\n?)+)/i);
      
      if (ingredientsMatch) {
        content.ingredients = ingredientsMatch[1].split('\n').filter(line => line.trim());
      }
      if (stepsMatch) {
        content.steps = stepsMatch[1].split('\n').filter(line => line.trim());
      }
    }

    if (category === 'preference') {
      // Extract preference details
      content.preference_type = userQuery.toLowerCase().includes('like') ? 'likes' : 
                               userQuery.toLowerCase().includes('dislike') ? 'dislikes' : 
                               userQuery.toLowerCase().includes('allergic') ? 'allergy' : 'general';
      
      // Extract foods mentioned
      const foodKeywords = this.extractKeywords(userQuery + ' ' + aiResponse);
      content.mentioned_foods = foodKeywords.filter(word => 
        !['like', 'dislike', 'prefer', 'hate', 'love', 'enjoy'].includes(word)
      );
    }

    if (category === 'recommendation') {
      // Extract what was recommended
      const recommendations = aiResponse.match(/(?:recommend|suggest|try)(?:ing|ed)?\s+([^.!?]+)/gi);
      if (recommendations) {
        content.recommendations = recommendations.map(rec => rec.replace(/(?:recommend|suggest|try)(?:ing|ed)?\s+/i, ''));
      }
    }

    return content;
  }

  /**
   * Calculate enhanced importance score with better logic
   */
  private calculateImportanceScore(userQuery: string, aiResponse: string, category: string): number {
    let score = 3; // New default is 3

    // Content length bonus
    if (aiResponse.length > 200) score += 1;
    if (aiResponse.length > 500) score += 1;
    
    // Category-based importance
    if (category === 'preference') score += 2; // Preferences are very important
    if (category === 'recipe') score += 1;
    if (category === 'recommendation') score += 1;
    
    // Personal information bonus
    if (userQuery.toLowerCase().includes('my') || userQuery.toLowerCase().includes('i ')) score += 1;
    
    // Health/allergy information is critical
    if (userQuery.toLowerCase().includes('allergic') || userQuery.toLowerCase().includes('allergy')) score += 2;
    
    // Specific dietary requirements
    if (userQuery.toLowerCase().includes('vegan') || userQuery.toLowerCase().includes('vegetarian') || 
        userQuery.toLowerCase().includes('gluten') || userQuery.toLowerCase().includes('keto')) score += 1;

    return Math.min(score, 5);
  }

  /**
   * Determine if memory should have expiration based on content
   */
  private shouldExpire(category: string, userQuery: string, aiResponse: string): string | undefined {
    // Preferences and allergies never expire
    if (category === 'preference') return undefined;
    
    // Health information never expires
    if (userQuery.toLowerCase().includes('allergic') || userQuery.toLowerCase().includes('allergy')) return undefined;
    
    // Temporary conversations expire in 30 days
    if (category === 'conversation' && userQuery.length < 20) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 30);
      return expireDate.toISOString();
    }
    
    // Facts and recipes expire in 90 days unless very detailed
    if ((category === 'fact' || category === 'recipe') && aiResponse.length < 300) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 90);
      return expireDate.toISOString();
    }
    
    return undefined; // No expiration
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
    if (combinedText.includes('like') || combinedText.includes('prefer') || combinedText.includes('favorite') || combinedText.includes('love') || combinedText.includes('hate') || combinedText.includes('enjoy') || combinedText.includes('allergic')) {
      return 'preference';
    }
    if (combinedText.includes('what') || combinedText.includes('how') || combinedText.includes('why') || combinedText.includes('when') || combinedText.includes('where')) {
      return 'fact';
    }
    
    return 'conversation';
  }

  /**
   * Enhanced memory storage with all new features
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
    const title = this.generateTitle(userQuery, aiResponse, category);
    const content = this.extractStructuredContent(userQuery, aiResponse, category);
    const expiresAt = this.shouldExpire(category, userQuery, aiResponse);
    
    const memoryEntry: MemoryEntry = {
      category,
      title,
      userQuery,
      aiResponse,
      content,
      keywords,
      importanceScore,
      isPermanent: importanceScore >= 4,
      expiresAt,
      timestamp: new Date().toISOString()
    };

    console.log(`🧠 Memory: Storing ${category} memory "${title}" with importance ${importanceScore}`);

    // Store locally first for immediate access
    this.storeInLocalStorage(memoryEntry);

    // Store in database if authenticated
    if (this.isAuthenticated) {
      await this.storeInDatabase(memoryEntry);
    }
  }

  /**
   * Store memory in localStorage with enhanced format
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
   * Store memory in Supabase database with enhanced fields
   */
  private async storeInDatabase(entry: MemoryEntry) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return;
      }

      const { error } = await supabase
        .from('user_memories')
        .insert({
          user_id: user.id,
          category: entry.category,
          title: entry.title,
          user_query: entry.userQuery,
          ai_response: entry.aiResponse,
          content: entry.content || {},
          keywords: entry.keywords,
          importance_score: entry.importanceScore || 3,
          is_permanent: entry.isPermanent || false,
          expires_at: entry.expiresAt
        });

      if (error) {
        console.error('Database insert error:', error);
        return;
      }
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

      if (error) {
        console.error('RPC error:', error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const localMemories: MemoryEntry[] = data.map((item: any) => ({
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
   * Get relevant memories with enhanced context building
   */
  async getRelevantMemories(currentQuery: string, limit: number = 5): Promise<string> {
    console.log('🧠 Memory: Building enhanced context from stored memories...');
    
    let memories: any[] = [];

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

    // Group by category and build enhanced context
    const categorized = memories.reduce((acc, memory) => {
      if (!acc[memory.category]) acc[memory.category] = [];
      
      // Use title if available, fallback to truncated query
      const displayTitle = memory.title || memory.userQuery?.substring(0, 40) + '...';
      const contextEntry = `- ${displayTitle}\n  Context: ${memory.aiResponse.substring(0, 150)}...`;
      
      acc[memory.category].push(contextEntry);
      return acc;
    }, {} as Record<string, string[]>);

    // Build enhanced context string
    let contextString = '\n=== RELEVANT USER HISTORY ===\n';
    Object.entries(categorized).forEach(([category, entries]) => {
      if (entries.length > 0) {
        contextString += `\n${category.toUpperCase()} MEMORIES:\n${entries.slice(0, 3).join('\n')}\n`;
      }
    });
    contextString += '=== END USER HISTORY ===\n';

    console.log(`🧠 Memory: Generated enhanced context with ${memories.length} memories (${contextString.length} chars)`);
    return contextString;
  }

  /**
   * Enhanced database memory retrieval
   */
  private async getMemoriesFromDatabase(query: string, limit: number): Promise<any[]> {
    try {
      const keywords = this.extractKeywords(query);
      
      const { data, error } = await supabase.rpc('search_user_memories', {
        search_keywords: keywords,
        limit_count: limit
      });

      if (error) {
        console.error('Search RPC error:', error);
        return [];
      }

      // Type assertion: we know this should be an array from the RPC function
      const searchResults = data as any[];
      
      // Additional safety check
      if (!Array.isArray(searchResults)) {
        console.warn('RPC returned non-array data:', searchResults);
        return [];
      }
      
      return searchResults;
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

      const parsedData = JSON.parse(stored);
      
      // Type guard to ensure we have an array
      if (!Array.isArray(parsedData)) {
        console.warn('Invalid data format in localStorage, expected array');
        return [];
      }

      const memories: MemoryEntry[] = parsedData;
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

        if (error) {
          console.error('Delete error:', error);
          return;
        }
        console.log('🧠 Memory: Cleared all memories from database');
      } catch (error) {
        console.error('Error clearing memories from database:', error);
      }
    }
  }

  /**
   * Get enhanced memory statistics
   */
  async getMemoryStats(): Promise<{ total: number; byCategory: Record<string, number>; byImportance: Record<string, number> }> {
    if (this.isAuthenticated) {
      try {
        const { data, error } = await supabase
          .from('user_memories')
          .select('category, importance_score');

        if (error) {
          console.error('Stats query error:', error);
        } else if (data && Array.isArray(data) && data.length > 0) {
          const typedData = data as Array<{ category: string; importance_score: number }>;
          
          const byCategory = typedData.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const byImportance = typedData.reduce((acc, item) => {
            const key = `importance_${item.importance_score}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            total: typedData.length,
            byCategory,
            byImportance
          };
        }
      } catch (error) {
        console.error('Error getting memory stats:', error);
      }
    }

    // Fallback to localStorage with basic stats
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return { total: 0, byCategory: {}, byImportance: {} };

      const memories: MemoryEntry[] = JSON.parse(stored);
      const byCategory = memories.reduce((acc, memory) => {
        acc[memory.category] = (acc[memory.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: memories.length,
        byCategory,
        byImportance: {}
      };
    } catch (error) {
      console.error('Error getting memory stats from localStorage:', error);
      return { total: 0, byCategory: {}, byImportance: {} };
    }
  }
}

export const memoryService = new MemoryService();
