
import OpenAI from 'openai';

/**
 * Interface defining the structure of AI response objects
 * Ensures consistency between different AI service implementations
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
 * OpenAIService Class
 * 
 * This service handles interactions with OpenAI's GPT models as an alternative
 * to the Gemini service. It provides the same interface and functionality
 * including conversation context, knowledge storage, and Patois support.
 * 
 * Features:
 * - GPT-4 integration with custom API keys
 * - Cross-session knowledge storage and retrieval
 * - Jamaican Patois language support
 * - Automatic conversation categorization
 * - Context-aware responses using chat history
 * 
 * Note: Requires user to provide their own OpenAI API key
 */
export class OpenAIService {
  /**
   * OpenAI client instance (null until API key is provided)
   */
  private openai: OpenAI | null = null;
  
  /**
   * User's OpenAI API key
   */
  private apiKey: string = '';

  /**
   * Constructor checks for stored API key in browser storage
   */
  constructor() {
    // Check for stored API key in localStorage
    const storedKey = localStorage.getItem('openai-api-key');
    if (storedKey) {
      this.setApiKey(storedKey);
    }
  }

  /**
   * Sets the OpenAI API key and initializes the client
   * @param apiKey - User's OpenAI API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for browser-based usage
    });
  }

  /**
   * Checks if the service has been configured with an API key
   * @returns True if API key is set and client is initialized
   */
  isConfigured(): boolean {
    return !!this.openai && !!this.apiKey;
  }

  // ============================
  // KNOWLEDGE MANAGEMENT SYSTEM
  // ============================
  // Note: These methods are identical to GeminiService for consistency
  
  /**
   * Retrieves and organizes stored knowledge from previous conversations
   * Creates categorized context for the AI to reference past interactions
   * @returns Formatted string of categorized knowledge entries
   */
  private getStoredKnowledge(): string {
    const knowledge = localStorage.getItem('jamAI-enhanced-knowledge');
    if (!knowledge) return '';
    
    const knowledgeEntries: KnowledgeEntry[] = JSON.parse(knowledge);
    
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
    if (userQuery.length < 10 || aiResponse.length < 20) return;
    
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
    
    // Keep only last 150 entries (increased from 50)
    if (knowledgeArray.length > 150) {
      knowledgeArray.splice(0, knowledgeArray.length - 150);
    }
    
    localStorage.setItem('jamAI-enhanced-knowledge', JSON.stringify(knowledgeArray));
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
   * Generates AI responses using OpenAI's GPT model with full context
   * Integrates stored knowledge, conversation history, and language preferences
   * 
   * @param userMessage - The current user message to respond to
   * @param isUserMessagePatois - Whether user wrote in Jamaican Patois
   * @param conversationHistory - Array of previous messages in this chat
   * @returns Promise resolving to AI response object
   */
  async generateResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = []): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured. Please provide an API key.');
    }

    // Gather context from stored knowledge
    const storedKnowledge = this.getStoredKnowledge();
    
    // Build system prompt based on user's language preference
    const systemPrompt = isUserMessagePatois 
      ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and provide complete, detailed answers when needed. For complex questions, give thorough explanations. For simple greetings or quick questions, be more concise. Use Patois naturally but make sure your responses are clear and informative.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before. When users reference previous conversations (like "the recipe I asked about" or "pair with what I mentioned"), actively use your stored knowledge to provide relevant context.

${storedKnowledge ? `Previous Knowledge (organized by category):\n${storedKnowledge}\n` : ''}`
      : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before. When users reference previous conversations (like "the recipe I asked about" or "pair with what I mentioned"), actively use your stored knowledge to provide relevant context.

${storedKnowledge ? `Previous Knowledge (organized by category):\n${storedKnowledge}\n` : ''}`;

    try {
      // Build message array for OpenAI API
      const messages = this.buildConversationMessages(userMessage, conversationHistory, systemPrompt);
      
      // Make API call to OpenAI
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14", // Latest GPT-4 model
        messages: messages,
        max_tokens: 2000,             // Increased for detailed responses
        temperature: 0.7,             // Balance creativity and consistency
      });

      const responseText = completion.choices[0]?.message?.content || 'Sorry, mi cyaan understand dat right now.';
      
      // Store the exchange for future reference
      this.storeKnowledge(userMessage, responseText);
      
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Fallback response if OpenAI fails
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
 * Maintains consistent service state across all components
 */
export const openaiService = new OpenAIService();
