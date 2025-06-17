import OpenAI from 'openai';

interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface KnowledgeEntry {
  id: string;
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation';
  userQuery: string;
  aiResponse: string;
  keywords: string[];
  timestamp: string;
}

export class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  constructor() {
    // Check for stored API key in localStorage
    const storedKey = localStorage.getItem('openai-api-key');
    if (storedKey) {
      this.setApiKey(storedKey);
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  isConfigured(): boolean {
    return !!this.openai && !!this.apiKey;
  }

  private getStoredKnowledge(): string {
    const knowledge = localStorage.getItem('jamAI-enhanced-knowledge');
    if (!knowledge) return '';
    
    const knowledgeEntries: KnowledgeEntry[] = JSON.parse(knowledge);
    
    // Group by category for better context
    const categorized = knowledgeEntries.reduce((acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(`User: ${entry.userQuery}\nAssistant: ${entry.aiResponse}`);
      return acc;
    }, {} as Record<string, string[]>);
    
    let contextString = '';
    Object.entries(categorized).forEach(([category, entries]) => {
      if (entries.length > 0) {
        contextString += `\n${category.toUpperCase()} KNOWLEDGE:\n${entries.slice(-5).join('\n---\n')}\n`;
      }
    });
    
    return contextString;
  }

  private extractKeywords(text: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2 && !commonWords.includes(word)).slice(0, 10);
  }

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

  private storeKnowledge(userQuery: string, aiResponse: string) {
    if (userQuery.length < 10 || aiResponse.length < 20) return; // Only store substantial exchanges
    
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

  async generateResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = []): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured. Please provide an API key.');
    }

    const storedKnowledge = this.getStoredKnowledge();
    
    const systemPrompt = isUserMessagePatois 
      ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and provide complete, detailed answers when needed. For complex questions, give thorough explanations. For simple greetings or quick questions, be more concise. Use Patois naturally but make sure your responses are clear and informative.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before. When users reference previous conversations (like "the recipe I asked about" or "pair with what I mentioned"), actively use your stored knowledge to provide relevant context.

${storedKnowledge ? `Previous Knowledge (organized by category):\n${storedKnowledge}\n` : ''}`
      : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before. When users reference previous conversations (like "the recipe I asked about" or "pair with what I mentioned"), actively use your stored knowledge to provide relevant context.

${storedKnowledge ? `Previous Knowledge (organized by category):\n${storedKnowledge}\n` : ''}`;

    try {
      const messages = this.buildConversationMessages(userMessage, conversationHistory, systemPrompt);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: messages,
        max_tokens: 2000, // Increased for more detailed responses
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || 'Sorry, mi cyaan understand dat right now.';
      
      // Store the full exchange with enhanced categorization
      this.storeKnowledge(userMessage, responseText);
      
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Fallback to local Patois responses if OpenAI fails
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

// Export singleton instance
export const openaiService = new OpenAIService();
