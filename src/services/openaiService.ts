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
    const knowledge = localStorage.getItem('jamAI-knowledge');
    return knowledge ? JSON.parse(knowledge).join('\n') : '';
  }

  private storeKnowledge(newKnowledge: string) {
    const existing = localStorage.getItem('jamAI-knowledge');
    const knowledgeArray = existing ? JSON.parse(existing) : [];
    
    // Add new knowledge with timestamp
    const timestampedKnowledge = `[${new Date().toISOString()}] ${newKnowledge}`;
    knowledgeArray.push(timestampedKnowledge);
    
    // Keep only last 50 pieces of knowledge to avoid storage issues
    if (knowledgeArray.length > 50) {
      knowledgeArray.splice(0, knowledgeArray.length - 50);
    }
    
    localStorage.setItem('jamAI-knowledge', JSON.stringify(knowledgeArray));
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

IMPORTANT: You have access to previous conversation history and stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}`
      : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.

IMPORTANT: You have access to previous conversation history and stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}`;

    try {
      const messages = this.buildConversationMessages(userMessage, conversationHistory, systemPrompt);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || 'Sorry, mi cyaan understand dat right now.';
      
      // Store important information from this exchange
      if (userMessage.length > 20) { // Only store substantial messages
        this.storeKnowledge(`User asked: ${userMessage} | Assistant responded: ${responseText.substring(0, 200)}...`);
      }
      
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
