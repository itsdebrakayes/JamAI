import { supabase } from '@/integrations/supabase/client';
import { detectLanguage } from '@/utils/languageDetection';
import { formatStructuredPrompt, determinePromptMode, type PromptMode } from '@/utils/promptFormatter';

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
   * Process user query with structured prompt system
   */
  async processQuery(
    userMessage: string,
    isUserMessagePatois: boolean = false,
    conversationHistory: Message[] = [],
    explicitMode?: PromptMode
  ): Promise<LocationAwareResponse> {
    try {
      console.log('🔄 LocationAwareService: Processing query with structured prompts');
      
      // Determine the appropriate mode if not explicitly provided
      const mode = explicitMode || determinePromptMode(userMessage);
      console.log(`🎯 Determined mode: ${mode}`);
      
      // Format the structured prompt
      const structuredPrompt = formatStructuredPrompt({
        mode,
        userInput: userMessage
      });
      
      console.log('📝 Using structured prompt format');
      
      // Get recent feedback for context
      const recentFeedback = this.getRecentFeedback(conversationHistory);
      
      // Enhance prompt with feedback context if available
      let enhancedPrompt = structuredPrompt;
      if (recentFeedback.length > 0) {
        const feedbackContext = recentFeedback.map(fb => 
          `Previous response "${fb.messageContent.substring(0, 50)}..." received ${fb.feedback} feedback`
        ).join('. ');
        
        enhancedPrompt += `\n\nFeedback Context: ${feedbackContext}. Please adjust your response style accordingly - if previous responses received negative feedback, try a different approach in tone, detail level, or cultural authenticity.`;
      }
      
      // Call the preferred AI service (Gemini by default)
      const aiResponse = await this.callGeminiService(enhancedPrompt, isUserMessagePatois, conversationHistory);
      
      return {
        message: aiResponse,
        isPatois: mode === 'translation_to_patois' || mode === 'chat' || isUserMessagePatois,
        translationOffered: mode === 'translation_to_patois' || mode === 'translation_to_english'
      };
      
    } catch (error) {
      console.error('LocationAwareService Error:', error);
      return this.handleError(isUserMessagePatois);
    }
  }

  /**
   * Get recent feedback for context
   */
  private getRecentFeedback(conversationHistory: Message[]): Array<{messageContent: string, feedback: string, timestamp: Date}> {
    // This would ideally come from a feedback tracking system
    // For now, return empty array - this can be enhanced later
    return [];
  }

  /**
   * Call Gemini service with structured prompt
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
   * Handle service errors with appropriate responses
   */
  private handleError(isUserMessagePatois: boolean): LocationAwareResponse {
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

export const locationAwareService = new LocationAwareService();
