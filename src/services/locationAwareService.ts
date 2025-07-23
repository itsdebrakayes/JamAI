
import { supabase } from '@/integrations/supabase/client';
import { detectLanguage } from '@/utils/languageDetection';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface LocationAwareResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

class LocationAwareService {
  /**
   * Process user query with natural JamAI personality
   */
  async processQuery(
    userMessage: string,
    isUserMessagePatois: boolean = false,
    conversationHistory: Message[] = []
  ): Promise<LocationAwareResponse> {
    try {
      console.log('🔄 LocationAwareService: Processing query with JamAI personality');
      
      // Detect if user is asking for educational help (tutor mode)
      const isTutorMode = this.detectTutorMode(userMessage);
      
      // Create natural prompt based on context
      let enhancedPrompt = userMessage;
      
      if (isTutorMode) {
        enhancedPrompt = `Mi need help understanding dis school topic. Please explain it in a way dat easy fi understand, using both Patois and English as needed: ${userMessage}`;
      }
      
      // Call the Gemini service with enhanced prompt
      const aiResponse = await this.callGeminiService(enhancedPrompt, isUserMessagePatois, conversationHistory);
      
      // Detect if response is in Patois
      const isResponsePatois = this.detectPatois(aiResponse);
      
      return {
        message: aiResponse,
        isPatois: isResponsePatois,
        translationOffered: false
      };
      
    } catch (error) {
      console.error('LocationAwareService Error:', error);
      return this.handleError(isUserMessagePatois);
    }
  }

  /**
   * Detect if user is asking for educational help
   */
  private detectTutorMode(message: string): boolean {
    const tutorIndicators = [
      'help', 'explain', 'understand', 'learn', 'teach', 'homework', 'study',
      'school', 'assignment', 'essay', 'math', 'science', 'history', 'english',
      'what is', 'how to', 'why does', 'can you explain'
    ];
    
    const lowerMessage = message.toLowerCase();
    return tutorIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Simple heuristic to detect if text is in Patois
   */
  private detectPatois(text: string): boolean {
    const patoisIndicators = [
      'mi', 'yuh', 'dem', 'seh', 'nuh', 'weh', 'mek', 'fi', 'wi', 'cyaan', 
      'waan', 'ting', 'tings', 'deh', 'yah', 'bout', 'inna', 'wid', 'dat'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const patoisWords = words.filter(word => patoisIndicators.includes(word));
    
    return patoisWords.length > 0;
  }

  /**
   * Call Gemini service with JamAI personality
   */
  private async callGeminiService(prompt: string, isUserMessagePatois: boolean, conversationHistory: Message[]): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        userMessage: prompt,
        isUserMessagePatois,
        conversationHistory: conversationHistory.slice(-10),
        storedKnowledge: ''
      }
    });

    if (error) {
      console.error('Gemini service error:', error);
      throw error;
    }

    return data.message || 'Sorry, mi cyaan understand dat right now.';
  }

  /**
   * Handle service errors with appropriate JamAI responses
   */
  private handleError(isUserMessagePatois: boolean): LocationAwareResponse {
    const fallbackMessage = isUserMessagePatois 
      ? "Mi have some trouble right now, but mi here fi help yuh still."
      : "I'm having some connection issues right now, but I'm here to help you.";
    
    return {
      message: fallbackMessage,
      isPatois: isUserMessagePatois,
      translationOffered: false
    };
  }
}

export const locationAwareService = new LocationAwareService();
