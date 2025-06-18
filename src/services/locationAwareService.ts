
import { googleMapsService } from './googleMapsService';
import { geminiService } from './geminiService';
import { openaiService } from './openaiService';

/**
 * Location-aware service that integrates Google Maps with AI responses
 * Handles location-based queries and enriches AI responses with local information
 */

interface LocationAwareResponse {
  message: string;
  isPatois: boolean;
  hasLocationData: boolean;
}

export class LocationAwareService {
  /**
   * Process user query and provide location-aware response
   */
  async processQuery(
    userMessage: string, 
    isUserMessagePatois: boolean, 
    conversationHistory: any[], 
    currentService: 'gemini' | 'openai'
  ): Promise<LocationAwareResponse> {
    
    // Check if this is a location-based query
    if (googleMapsService.isLocationQuery(userMessage)) {
      try {
        // Search for nearby places
        const places = await googleMapsService.searchNearbyPlaces(userMessage);
        const placesInfo = googleMapsService.formatPlacesForResponse(places);
        
        // Get AI response with location context
        const aiService = currentService === 'gemini' ? geminiService : openaiService;
        const enhancedPrompt = `${userMessage}\n\nLocation information found:\n${placesInfo}\n\nProvide a helpful response that incorporates this location data.`;
        
        const aiResponse = await aiService.generateResponse(
          enhancedPrompt, 
          isUserMessagePatois, 
          conversationHistory
        );
        
        return {
          message: aiResponse.message,
          isPatois: aiResponse.isPatois,
          hasLocationData: places.length > 0
        };
        
      } catch (error) {
        console.error('Location service error:', error);
        
        // Fallback to regular AI response
        const aiService = currentService === 'gemini' ? geminiService : openaiService;
        const response = await aiService.generateResponse(
          userMessage, 
          isUserMessagePatois, 
          conversationHistory
        );
        
        return {
          message: response.message,
          isPatois: response.isPatois,
          hasLocationData: false
        };
      }
    } else {
      // Regular AI response for non-location queries
      const aiService = currentService === 'gemini' ? geminiService : openaiService;
      const response = await aiService.generateResponse(
        userMessage, 
        isUserMessagePatois, 
        conversationHistory
      );
      
      return {
        message: response.message,
        isPatois: response.isPatois,
        hasLocationData: false
      };
    }
  }
}

export const locationAwareService = new LocationAwareService();
