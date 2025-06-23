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
 * Interface for stored knowledge entries
 */
interface KnowledgeEntry {
  id: string;
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation';
  userQuery: string;
  aiResponse: string;
  keywords: string[];
  timestamp: string;
}

/**
 * OpenAIService Class
 * 
 * Enhanced with intelligent memory management and context injection
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

  // ============================
  // KNOWLEDGE MANAGEMENT SYSTEM
  // ============================
  
  /**
   * Retrieves and organizes stored knowledge from previous conversations
   * Creates categorized context for the AI to reference past interactions
   * @returns Formatted string of categorized knowledge entries
   */
  private getStoredKnowledge(): string {
    console.log('🧠 OpenAI: Retrieving stored knowledge for context...');
    const knowledge = localStorage.getItem('jamAI-enhanced-knowledge');
    if (!knowledge) {
      console.log('🧠 OpenAI: No stored knowledge found');
      return '';
    }
    
    const knowledgeEntries: KnowledgeEntry[] = JSON.parse(knowledge);
    console.log(`🧠 OpenAI: Found ${knowledgeEntries.length} knowledge entries`);
    
    // Group knowledge entries by category for better organization
    const categorized = knowledgeEntries.reduce((acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(`User: ${entry.userQuery}\nAssistant: ${entry.aiResponse}`);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Format categorized knowledge for AI context
    let contextString = '';
    Object.entries(categorized).forEach(([category, entries]) => {
      if (entries.length > 0) {
        // Only include last 5 entries per category to manage token limits
        contextString += `\n${category.toUpperCase()} KNOWLEDGE:\n${entries.slice(-5).join('\n---\n')}\n`;
      }
    });
    
    console.log(`🧠 OpenAI: Generated context string length: ${contextString.length} characters`);
    return contextString;
  }

  /**
   * Extracts meaningful keywords from text for knowledge indexing
   * Filters out common words to focus on important terms
   * @param text - The text to extract keywords from
   * @returns Array of relevant keywords (max 10)
   */
  private extractKeywords(text: string): string[] {
    // Common words to filter out (stop words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2 && !commonWords.includes(word)).slice(0, 10);
  }

  /**
   * Automatically categorizes conversation content based on keywords
   * Helps organize knowledge for better retrieval in future conversations
   * @param userQuery - The user's original question
   * @param aiResponse - The AI's response
   * @returns Category classification for the knowledge entry
   */
  private categorizeContent(userQuery: string, aiResponse: string): KnowledgeEntry['category'] {
    const combinedText = (userQuery + ' ' + aiResponse).toLowerCase();
    
    if (combinedText.includes('recipe') || combinedText.includes('cook') || combinedText.includes('ingredient') || combinedText.includes('dish')) {
      return 'recipe';
    }
    if (combinedText.includes('recommend') || combinedText.includes('suggest') || combinedText.includes('pair') || combinedText.includes('goes with')) {
      return 'recommendation';
    }
    if (combinedText.includes('like') || combinedText.includes('prefer') || combinedText.includes('favorite') || combinedText.includes('love')) {
      return 'preference';
    }
    if (combinedText.includes('what') || combinedText.includes('how') || combinedText.includes('why') || combinedText.includes('when')) {
      return 'fact';
    }
    
    return 'conversation';
  }

  /**
   * Stores important conversation exchanges for future reference
   * Only stores substantial exchanges to avoid memory clutter
   * @param userQuery - The user's question
   * @param aiResponse - The AI's response
   */
  private storeKnowledge(userQuery: string, aiResponse: string) {
    // Only store substantial exchanges (filters out greetings, short responses)
    if (userQuery.length < 10 || aiResponse.length < 20) {
      console.log('🧠 OpenAI: Exchange too short, not storing knowledge');
      return;
    }
    
    const existing = localStorage.getItem('jamAI-enhanced-knowledge');
    const knowledgeArray: KnowledgeEntry[] = existing ? JSON.parse(existing) : [];
    
    const newEntry: KnowledgeEntry = {
      id: Date.now().toString(),
      category: this.categorizeContent(userQuery, aiResponse),
      userQuery,
      aiResponse,
      keywords: this.extractKeywords(userQuery + ' ' + aiResponse),
      timestamp: new Date().toISOString()
    };
    
    knowledgeArray.push(newEntry);
    console.log(`🧠 OpenAI: Storing new ${newEntry.category} knowledge entry`);
    
    // Keep only last 150 entries (increased from 50)
    if (knowledgeArray.length > 150) {
      knowledgeArray.splice(0, knowledgeArray.length - 150);
      console.log('🧠 OpenAI: Trimmed knowledge array to 150 entries');
    }
    
    localStorage.setItem('jamAI-enhanced-knowledge', JSON.stringify(knowledgeArray));
    console.log(`🧠 OpenAI: Total knowledge entries: ${knowledgeArray.length}`);
  }

  // ============================
  // CONVERSATION CONTEXT MANAGEMENT
  // ============================
  
  /**
   * Builds conversation message array for OpenAI API format
   * Includes system prompt and recent conversation history
   * @param userMessage - Current user message
   * @param conversationHistory - Previous messages in the chat
   * @param systemPrompt - AI behavior instructions
   * @returns Array of messages in OpenAI format
   */
  private buildConversationMessages(userMessage: string, conversationHistory: Message[], systemPrompt: string): any[] {
    const messages = [{ role: "system", content: systemPrompt }];
    
    // Add recent conversation history (last 8 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-8);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      });
    });
    
    // Add current user message if it's not already the last message
    const lastMessage = recentHistory[recentHistory.length - 1];
    if (!lastMessage || lastMessage.text !== userMessage) {
      messages.push({ role: "user", content: userMessage });
    }
    
    return messages;
  }

  // ============================
  // MAIN RESPONSE GENERATION
  // ============================
  
  /**
   * Enhanced response generation with intelligent memory context
   */
  async generateResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = []): Promise<AIResponse> {
    try {
      // Get relevant memories for context
      const memoryContext = await memoryService.getRelevantMemories(userMessage, 5);
      console.log(`🤖 OpenAI: Generated response with ${memoryContext.length} chars of memory context`);
      
      // Call edge function with enhanced context
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          userMessage,
          isUserMessagePatois,
          conversationHistory: conversationHistory.slice(-8),
          storedKnowledge: memoryContext
        }
      });

      if (error) {
        console.error('OpenAI edge function error:', error);
        throw error;
      }

      const responseText = data.message || 'Sorry, mi cyaan understand dat right now.';
      
      // Store the exchange in enhanced memory system
      console.log('🧠 OpenAI: Storing conversation in enhanced memory...');
      await memoryService.storeMemory(userMessage, responseText);
      
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('OpenAI Service Error:', error);
      
      const fallbackMessage = isUserMessagePatois 
        ? "Mi have some trouble connecting right now, but mi here fi help."
        : "I'm having some connection issues right now, but I'm here to help.";
      
      return {
        message: fallbackMessage,
        isPatois: isUserMessagePatois,
        translationOffered: false
      };
    }
  }
}

/**
 * Export singleton instance for use throughout the application
 */
export const openaiService = new OpenAIService();
