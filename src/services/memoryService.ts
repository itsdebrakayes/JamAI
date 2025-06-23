import { supabase } from '@/integrations/supabase/client';

interface Memory {
  id: string;
  userQuery: string;
  aiResponse: string;
  keywords: string[];
  category: string;
  importance: number;
  timestamp: string;
}

interface DatabaseMemory {
  id: string;
  category: string;
  title: string | null;
  user_query: string;
  ai_response: string;
  content: any;
  keywords: string[];
  importance_score: number;
  is_permanent: boolean;
  expires_at: string | null;
  created_at: string;
}

export class MemoryService {
  private memories: Memory[] = [];
  private initialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('jamai-memory-enhanced');
      if (stored) {
        this.memories = JSON.parse(stored);
        console.log(`🧠 Memory: Loaded ${this.memories.length} memories from localStorage`);
      }
    } catch (error) {
      console.error('🧠 Memory: Error loading from localStorage:', error);
      this.memories = [];
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('jamai-memory-enhanced', JSON.stringify(this.memories));
      console.log(`🧠 Memory: Saved ${this.memories.length} memories to localStorage`);
    } catch (error) {
      console.error('🧠 Memory: Error saving to localStorage:', error);
    }
  }

  async syncMemoriesFromDatabase() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('🧠 Memory: No authenticated user, using localStorage only');
        return;
      }

      const { data, error } = await supabase
        .rpc('get_recent_memories_by_category', { days_back: 30, limit_per_category: 5 });

      if (error) {
        console.error('🧠 Memory: Database sync error:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        const dbMemories: Memory[] = data.map((item: DatabaseMemory) => ({
          id: item.id,
          userQuery: item.user_query || '',
          aiResponse: item.ai_response || '',
          keywords: Array.isArray(item.keywords) ? item.keywords : [],
          category: item.category || 'conversation',
          importance: item.importance_score || 1,
          timestamp: item.created_at
        }));

        // Merge with local memories, avoiding duplicates
        const existingIds = new Set(this.memories.map(m => m.id));
        const newMemories = dbMemories.filter(m => !existingIds.has(m.id));
        
        this.memories = [...this.memories, ...newMemories];
        this.saveToLocalStorage();
        
        console.log(`🧠 Memory: Synced ${newMemories.length} new memories from database`);
      }
    } catch (error) {
      console.error('🧠 Memory: Database sync failed:', error);
    }
  }

  async storeMemory(userQuery: string, aiResponse: string) {
    if (!userQuery || !aiResponse || userQuery.length < 10 || aiResponse.length < 20) {
      console.log('🧠 Memory: Exchange too short, not storing');
      return;
    }

    const memory: Memory = {
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userQuery,
      aiResponse,
      keywords: this.extractKeywords(userQuery + ' ' + aiResponse),
      category: this.categorizeContent(userQuery, aiResponse),
      importance: this.calculateImportance(userQuery, aiResponse),
      timestamp: new Date().toISOString()
    };

    this.memories.push(memory);
    
    // Keep only last 100 memories
    if (this.memories.length > 100) {
      this.memories = this.memories.slice(-100);
    }

    this.saveToLocalStorage();

    // Try to save to database if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.saveToDatabase(memory);
      }
    } catch (error) {
      console.log('🧠 Memory: Could not save to database, using localStorage only');
    }

    console.log(`🧠 Memory: Stored new ${memory.category} memory`);
  }

  private async saveToDatabase(memory: Memory) {
    try {
      const { error } = await supabase
        .from('user_memories')
        .insert([{
          category: memory.category,
          title: memory.userQuery.substring(0, 100),
          user_query: memory.userQuery,
          ai_response: memory.aiResponse,
          content: {
            keywords: memory.keywords,
            category: memory.category
          },
          keywords: memory.keywords,
          importance_score: memory.importance,
          is_permanent: false,
          expires_at: null
        }]);

      if (error) {
        console.error('🧠 Memory: Database save error:', error);
      } else {
        console.log('🧠 Memory: Saved to database successfully');
      }
    } catch (error) {
      console.error('🧠 Memory: Database save failed:', error);
    }
  }

  async getRelevantMemories(query: string, limit: number = 5): Promise<string> {
    console.log('🧠 Memory: Building enhanced context from stored memories...');
    
    if (!query || this.memories.length === 0) {
      console.log('🧠 Memory: No query or memories available');
      return '';
    }

    const queryKeywords = this.extractKeywords(query);
    const relevantMemories = this.memories
      .map(memory => {
        const keywordMatches = memory.keywords.filter(keyword => 
          queryKeywords.some(qk => keyword.toLowerCase().includes(qk.toLowerCase()))
        ).length;
        
        const textMatches = (
          (memory.userQuery && memory.userQuery.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) +
          (memory.aiResponse && memory.aiResponse.toLowerCase().includes(query.toLowerCase()) ? 1 : 0)
        );
        
        return {
          ...memory,
          relevanceScore: keywordMatches + textMatches + (memory.importance || 1)
        };
      })
      .filter(memory => memory.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    if (relevantMemories.length === 0) {
      console.log('🧠 Memory: No relevant memories found');
      return '';
    }

    const contextString = relevantMemories
      .map(memory => `User: ${memory.userQuery || ''}\nAssistant: ${memory.aiResponse || ''}`)
      .join('\n---\n');

    console.log(`🧠 Memory: Generated context from ${relevantMemories.length} relevant memories`);
    return contextString;
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2 && !commonWords.includes(word)).slice(0, 10);
  }

  private categorizeContent(userQuery: string, aiResponse: string): string {
    const combinedText = `${userQuery || ''} ${aiResponse || ''}`.toLowerCase();
    
    if (combinedText.includes('recipe') || combinedText.includes('cook')) return 'recipe';
    if (combinedText.includes('recommend') || combinedText.includes('suggest')) return 'recommendation';
    if (combinedText.includes('like') || combinedText.includes('prefer')) return 'preference';
    if (combinedText.includes('what') || combinedText.includes('how')) return 'fact';
    
    return 'conversation';
  }

  private calculateImportance(userQuery: string, aiResponse: string): number {
    const combinedLength = (userQuery?.length || 0) + (aiResponse?.length || 0);
    if (combinedLength > 500) return 3;
    if (combinedLength > 200) return 2;
    return 1;
  }
}

export const memoryService = new MemoryService();
