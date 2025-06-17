
import OpenAI from 'openai';

interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
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

  async generateResponse(userMessage: string, isUserMessagePatois: boolean): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured. Please provide an API key.');
    }

    const systemPrompt = isUserMessagePatois 
      ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and concise - don't use excessive greetings or cultural expressions unless they're relevant to the conversation. Answer questions directly and clearly. Use Patois naturally but don't overdo it with too many expressions.`
      : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and concise - answer questions directly without unnecessary greetings or lengthy introductions. You can reference Jamaican culture when relevant, but keep responses focused and to the point.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || 'Sorry, mi cyaan understand dat right now.';
      
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
