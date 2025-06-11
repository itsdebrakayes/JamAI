
interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

export class PuterService {
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability() {
    // Check if Puter is available in the global scope
    this.isAvailable = typeof window !== 'undefined' && window.puter;
  }

  isConfigured(): boolean {
    return this.isAvailable;
  }

  async generateResponse(userMessage: string, isUserMessagePatois: boolean): Promise<AIResponse> {
    if (!this.isAvailable) {
      throw new Error('Puter AI not available. Please check your connection.');
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

    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}`;

    try {
      // Use gpt-4.1 model with Puter
      const response = await window.puter.ai.chat(fullPrompt, { 
        model: "gpt-4.1" 
      });

      return {
        message: response,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('Puter AI Error:', error);
      
      // Fallback to local Patois responses if Puter fails
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
export const puterService = new PuterService();
