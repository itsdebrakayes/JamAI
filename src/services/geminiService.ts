
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

  async translateToEnglish(patoisText: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Translate the following Jamaican Patois text to clear, natural English. Keep the meaning and tone intact:

"${patoisText}"

Provide only the English translation, nothing else.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'Translation not available.';
    } catch (error) {
      console.error('Translation Error:', error);
      return 'Sorry, translation is not available right now.';
    }
  }

  async generateResponse(userMessage: string, isUserMessagePatois: boolean): Promise<AIResponse> {
    const systemPrompt = isUserMessagePatois 
      ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and provide complete, detailed answers when needed. For complex questions, give thorough explanations. For simple greetings or quick questions, be more concise. Use Patois naturally but make sure your responses are clear and informative.`
      : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.`;

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      });
      
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

// Export singleton instance
export const geminiService = new GeminiService();
