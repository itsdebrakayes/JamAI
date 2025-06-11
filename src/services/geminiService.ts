import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string = 'AIzaSyDOhgop270EBYX5seQfbevXp3f8hfIYQfU';

  constructor() {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  setApiKey(apiKey: string) {
    // Keep this method for compatibility but use hardcoded key
    this.apiKey = 'AIzaSyDOhgop270EBYX5seQfbevXp3f8hfIYQfU';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  isConfigured(): boolean {
    return true; // Always configured with hardcoded key
  }

  async generateResponse(userMessage: string, isUserMessagePatois: boolean): Promise<AIResponse> {
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text() || 'Sorry, mi cyaan understand dat right now.';
      
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Fallback to local Patois responses if Gemini fails
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
export const geminiService = new GeminiService();
