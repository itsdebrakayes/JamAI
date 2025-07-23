
import { supabase } from '@/integrations/supabase/client';
import { memoryService } from './memoryService';

/**
 * Interface defining the structure of AI response objects
 */
interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

/**
 * Interface defining the structure of chat messages
 */
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

/**
 * OpenAIService Class
 * 
 * Enhanced with OpenAI Assistant API integration for JamAI
 */
export class OpenAIService {
  constructor() {
    // Initialize memory sync when service starts
    this.initializeMemorySync();
  }

  /**
   * Initialize memory synchronization from database
   */
  private async initializeMemorySync() {
    try {
      await memoryService.syncMemoriesFromDatabase();
      console.log('🧠 OpenAI: Memory sync initialized');
    } catch (error) {
      console.error('OpenAI: Memory sync initialization failed:', error);
    }
  }

  /**
   * Checks if the service is properly configured
   * @returns Always true since API keys are managed server-side
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Generate response using OpenAI Assistant API
   */
  async generateResponse(
    userMessage: string, 
    isUserMessagePatois: boolean, 
    conversationHistory: Message[] = [],
    sessionId?: string
  ): Promise<AIResponse> {
    try {
      // Get relevant memories for context
      const memoryContext = await memoryService.getRelevantMemories(userMessage, 5);
      console.log(`🤖 OpenAI: Generated response with ${memoryContext.length} chars of memory context`);
      
      // Call new OpenAI Assistant edge function
      const { data, error } = await supabase.functions.invoke('openai-assistant-chat', {
        body: {
          userMessage,
          sessionId: sessionId || 'default',
          userId: 'user', // This should be replaced with actual user ID
          conversationHistory: conversationHistory.slice(-8)
        }
      });

      if (error) {
        console.error('OpenAI Assistant edge function error:', error);
        throw error;
      }

      const responseText = data.message || 'Sorry, mi cyaan understand dat right now.';
      
      // Store the exchange in enhanced memory system
      console.log('🧠 OpenAI: Storing conversation in enhanced memory...');
      await memoryService.storeMemory(userMessage, responseText);
      
      // Detect if response is in Patois (simple heuristic)
      const isResponsePatois = this.detectPatois(responseText);
      
      return {
        message: responseText,
        isPatois: isResponsePatois,
        translationOffered: false
      };
    } catch (error) {
      console.error('OpenAI Service Error:', error);
      
      const fallbackMessage = isUserMessagePatois 
        ? "Mi have some trouble connecting right now, but mi here fi help yuh still."
        : "I'm having some connection issues right now, but I'm here to help you.";
      
      return {
        message: fallbackMessage,
        isPatois: isUserMessagePatois,
        translationOffered: false
      };
    }
  }

  /**
   * Simple heuristic to detect if text is in Patois
   */
  private detectPatois(text: string): boolean {
    const patoisIndicators = [
      'mi', 'yuh', 'dem', 'seh', 'nuh', 'weh', 'mek', 'fi', 'wi', 'cyaan', 
      'waan', 'ting', 'tings', 'deh', 'yah', 'bout', 'inna', 'bout', 'wid'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const patoisWords = words.filter(word => patoisIndicators.includes(word));
    
    return patoisWords.length > 0;
  }
}

/**
 * Export singleton instance for use throughout the application
 */
export const openaiService = new OpenAIService();
