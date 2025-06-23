import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface defining the structure of AI response objects
 * Used to maintain consistency across different AI services
 */
interface AIResponse {
  message: string;              // The generated response text
  isPatois: boolean;           // Whether response is in Jamaican Patois
  translationOffered?: boolean; // Whether translation was offered (optional)
}

/**
 * Interface defining the structure of chat messages
 * Used for maintaining conversation context in AI requests
 */
interface Message {
  id: string;          // Unique message identifier
  text: string;        // Message content
  isUser: boolean;     // True if from user, false if from AI
  timestamp: Date;     // When message was created
}

/**
 * Interface for stored knowledge entries
 * Used to build long-term memory across chat sessions
 */
interface KnowledgeEntry {
  id: string;                                                              // Unique entry identifier
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation'; // Knowledge type
  userQuery: string;                                                       // Original user question
  aiResponse: string;                                                      // AI's full response
  keywords: string[];                                                      // Extracted keywords for search
  timestamp: string;                                                       // When entry was created
}

/**
 * GeminiService Class
 * 
 * This service handles all interactions with Google's Gemini AI model via edge functions.
 * It provides enhanced functionality including conversation context management,
 * long-term knowledge storage and retrieval, and Jamaican Patois language support.
 */
export class GeminiService {
  /**
   * Constructor - no longer needs API key initialization
   */
  constructor() {
    // Service now uses server-side API keys
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
   * This creates context for the AI to reference past interactions
   * @returns Formatted string of categorized knowledge entries
   */
  private getStoredKnowledge(): string {
    console.log('🧠 Gemini: Retrieving stored knowledge for context...');
    const knowledge = localStorage.getItem('jamAI-enhanced-knowledge');
    if (!knowledge) {
      console.log('🧠 Gemini: No stored knowledge found');
      return '';
    }
    
    const knowledgeEntries: KnowledgeEntry[] = JSON.parse(knowledge);
    console.log(`🧠 Gemini: Found ${knowledgeEntries.length} knowledge entries`);
    
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
    
    console.log(`🧠 Gemini: Generated context string length: ${contextString.length} characters`);
    return contextString;
  }

  /**
   * Extracts meaningful keywords from text for knowledge indexing
   * Filters out common words to focus on important terms
   * @param text - The text to extract keywords from
   * @returns Array of relevant keywords
   */
  private extractKeywords(text: string): string[] {
    // Common words to filter out (stop words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    // Extract words using regex pattern
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Filter meaningful words (length > 2, not common words), limit to 10
    return words.filter(word => word.length > 2 && !commonWords.includes(word)).slice(0, 10);
  }

  /**
   * Automatically categorizes conversation content based on keywords
   * Helps organize knowledge for better retrieval later
   * @param userQuery - The user's original question
   * @param aiResponse - The AI's response
   * @returns Category classification for the knowledge entry
   */
  private categorizeContent(userQuery: string, aiResponse: string): KnowledgeEntry['category'] {
    const combinedText = (userQuery + ' ' + aiResponse).toLowerCase();
    
    // Check for recipe-related content
    if (combinedText.includes('recipe') || combinedText.includes('cook') || combinedText.includes('ingredient') || combinedText.includes('dish')) {
      return 'recipe';
    }
    // Check for recommendation content
    if (combinedText.includes('recommend') || combinedText.includes('suggest') || combinedText.includes('pair') || combinedText.includes('goes with')) {
      return 'recommendation';
    }
    // Check for preference-related content
    if (combinedText.includes('like') || combinedText.includes('prefer') || combinedText.includes('favorite') || combinedText.includes('love')) {
      return 'preference';
    }
    // Check for factual questions
    if (combinedText.includes('what') || combinedText.includes('how') || combinedText.includes('why') || combinedText.includes('when')) {
      return 'fact';
    }
    
    // Default category for general conversation
    return 'conversation';
  }

  /**
   * Stores important conversation exchanges in browser storage for future reference
   * Only stores substantial exchanges to avoid cluttering memory
   * @param userQuery - The user's question
   * @param aiResponse - The AI's response
   */
  private storeKnowledge(userQuery: string, aiResponse: string) {
    // Only store substantial exchanges (filters out greetings, short responses)
    if (userQuery.length < 10 || aiResponse.length < 20) {
      console.log('🧠 Gemini: Exchange too short, not storing knowledge');
      return;
    }
    
    // Get existing knowledge or initialize empty array
    const existing = localStorage.getItem('jamAI-enhanced-knowledge');
    const knowledgeArray: KnowledgeEntry[] = existing ? JSON.parse(existing) : [];
    
    // Create new knowledge entry with automatic categorization
    const newEntry: KnowledgeEntry = {
      id: Date.now().toString(),
      category: this.categorizeContent(userQuery, aiResponse),
      userQuery,
      aiResponse,
      keywords: this.extractKeywords(userQuery + ' ' + aiResponse),
      timestamp: new Date().toISOString()
    };
    
    knowledgeArray.push(newEntry);
    console.log(`🧠 Gemini: Storing new ${newEntry.category} knowledge entry`);
    
    // Keep only last 150 entries (increased from 50)
    if (knowledgeArray.length > 150) {
      knowledgeArray.splice(0, knowledgeArray.length - 150);
      console.log('🧠 Gemini: Trimmed knowledge array to 150 entries');
    }
    
    localStorage.setItem('jamAI-enhanced-knowledge', JSON.stringify(knowledgeArray));
    console.log(`🧠 Gemini: Total knowledge entries: ${knowledgeArray.length}`);
  }

  // ============================
  // CONVERSATION CONTEXT MANAGEMENT
  // ============================
  
  /**
   * Builds conversation context string from recent message history
   * Limits to last 10 messages to avoid token limits while maintaining context
   * @param messages - Array of conversation messages
   * @returns Formatted conversation context string
   */
  private buildConversationContext(messages: Message[]): string {
    // Get last 10 messages for context (balances context vs token usage)
    const recentMessages = messages.slice(-10);
    
    let context = '';
    recentMessages.forEach(msg => {
      const role = msg.isUser ? 'User' : 'Assistant';
      context += `${role}: ${msg.text}\n`;
    });
    
    return context;
  }

  // ============================
  // TRANSLATION FUNCTIONALITY
  // ============================
  
  /**
   * Translates Jamaican Patois text to English using Gemini
   * Used for helping users understand Patois responses
   * @param patoisText - The Patois text to translate
   * @returns English translation of the text
   */
  async translateToEnglish(patoisText: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: `Translate the following Jamaican Patois text to clear, natural English. Keep the meaning and tone intact: "${patoisText}". Provide only the English translation, nothing else.`,
          isUserMessagePatois: false,
          conversationHistory: [],
          storedKnowledge: ''
        }
      });

      if (error) {
        console.error('Translation Error:', error);
        return 'Translation not available.';
      }

      return data.message || 'Translation not available.';
    } catch (error) {
      console.error('Translation Error:', error);
      return 'Sorry, translation is not available right now.';
    }
  }

  // ============================
  // MAIN RESPONSE GENERATION
  // ============================
  
  /**
   * Main method for generating AI responses via edge function
   * 
   * @param userMessage - The current user message to respond to
   * @param isUserMessagePatois - Whether user wrote in Jamaican Patois
   * @param conversationHistory - Array of previous messages in this chat
   * @returns Promise resolving to AI response object
   */
  async generateResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = []): Promise<AIResponse> {
    try {
      const storedKnowledge = this.getStoredKnowledge();
      console.log(`🤖 Gemini: Generating response with ${storedKnowledge.length} chars of stored knowledge`);
      
      // Call edge function instead of direct API call
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage,
          isUserMessagePatois,
          conversationHistory: conversationHistory.slice(-10), // Limit history size
          storedKnowledge
        }
      });

      if (error) {
        console.error('Gemini edge function error:', error);
        throw error;
      }

      const responseText = data.message || 'Sorry, mi cyaan understand dat right now.';
      
      // Store this exchange for future reference
      console.log('🧠 Gemini: Storing conversation exchange...');
      this.storeKnowledge(userMessage, responseText);
      
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('Gemini Service Error:', error);
      
      // Fallback response if service fails
      const fallbackMessage = isUserMessagePatois 
        ? "Mi have some trouble right now, but mi here fi help."
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
export const geminiService = new GeminiService();
