import { supabase } from '@/integrations/supabase/client';
import { memoryService } from './memoryService';

// Shared interfaces
export interface AIResponse {
  message: string;
  isPatois: boolean;
  translationOffered?: boolean;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface KnowledgeEntry {
  id: string;
  category: 'recipe' | 'preference' | 'recommendation' | 'fact' | 'conversation';
  userQuery: string;
  aiResponse: string;
  keywords: string[];
  timestamp: string;
}

// Utility for Patois detection
function detectPatois(text: string): boolean {
  const patoisIndicators = [
    'mi', 'yuh', 'dem', 'seh', 'nuh', 'weh', 'mek', 'fi', 'wi', 'cyaan',
    'waan', 'ting', 'tings', 'deh', 'yah', 'bout', 'inna', 'wid'
  ];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => patoisIndicators.includes(word));
}

// Main API Service
class APIService {
  constructor() {
    this.initializeMemorySync();
  }

  private async initializeMemorySync() {
    try {
      await memoryService.syncMemoriesFromDatabase();
      console.log('🧠 APIService: Memory sync initialized');
    } catch (error) {
      console.error('APIService: Memory sync initialization failed:', error);
    }
  }

  // Gemini response
  async generateGeminiResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = []): Promise<AIResponse> {
    try {
      const memoryContext = await memoryService.getRelevantMemories(userMessage, 5);
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage,
          isUserMessagePatois,
          conversationHistory: conversationHistory.slice(-10),
          storedKnowledge: memoryContext
        }
      });
      if (error) throw error;
      const responseText = data.message || 'Sorry, mi cyaan understand dat right now.';
      await memoryService.storeMemory(userMessage, responseText);
      return {
        message: responseText,
        isPatois: isUserMessagePatois,
        translationOffered: isUserMessagePatois
      };
    } catch (error) {
      console.error('Gemini Service Error:', error);
      return {
        message: isUserMessagePatois ? "Mi have some trouble right now, but mi here fi help." : "I'm having some connection issues right now, but I'm here to help.",
        isPatois: isUserMessagePatois,
        translationOffered: false
      };
    }
  }

  // OpenAI response
  async generateOpenAIResponse(userMessage: string, isUserMessagePatois: boolean, conversationHistory: Message[] = [], sessionId?: string, userId?: string): Promise<AIResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-assistant-chat', {
        body: {
          userMessage,
          sessionId: sessionId || 'default',
          userId: userId || 'user',
          conversationHistory: conversationHistory.slice(-8)
        }
      });
      if (error) throw error;
      const responseText = data.message || 'Sorry, mi cyaan understand dat right now.';
      const isResponsePatois = detectPatois(responseText);
      return {
        message: responseText,
        isPatois: isResponsePatois,
        translationOffered: false
      };
    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        message: isUserMessagePatois ? "Mi have some trouble connecting right now, but mi here fi help yuh still." : "I'm having some connection issues right now, but I'm here to help you.",
        isPatois: isUserMessagePatois,
        translationOffered: false
      };
    }
  }

  // Gemini translation
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
      if (error) return 'Translation not available.';
      return data.message || 'Translation not available.';
    } catch (error) {
      return 'Sorry, translation is not available right now.';
    }
  }
}

export const apiService = new APIService();
