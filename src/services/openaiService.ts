
import OpenAI from 'openai';

interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

export class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
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
      ? `You are JamAI, a friendly AI assistant that speaks Jamaican Patois naturally and authentically. 
         The user has written to you in Patois, so respond primarily in Patois. 
         Be warm, helpful, and use authentic Jamaican expressions. 
         After your main response, ask if they would like an English translation as well.
         Use expressions like "Wah gwaan!", "Big up!", "Respect!", "Zeen!", etc.
         Talk about Jamaican culture, food, music, and life with pride and knowledge.`
      : `You are JamAI, a friendly AI assistant with deep knowledge of Jamaican culture. 
         The user has written to you in English, so respond in clear, friendly English.
         You can reference Jamaican culture, but keep your response in English since that's how they communicated.
         Be helpful, warm, and knowledgeable about Jamaica and its culture.`;

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
        max_tokens: 500,
        temperature: 0.8,
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
        ? "Zeen! Mi have some trouble connecting right now, but mi deh yah fi help yuh still!"
        : "I'm having some connection issues right now, but I'm here to help you!";
      
      return {
        message: fallbackMessage,
        isPatois: isUserMessagePatois,
        translationOffered: false
      };
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAI Service();
