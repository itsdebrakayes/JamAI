import { geminiService } from './geminiService';
import { openaiService } from './openaiService';
import { googleMapsService } from './googleMapsService';
import { Message } from '@/types/Message';

/**
 * Interface defining the structure for location data returned by Google Maps
 */
interface LocationData {
  places: Place[];
}

/**
 * Interface defining the structure for a place returned by Google Maps
 */
interface Place {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Interface defining the structure of AI response objects
 * Used to maintain consistency across different AI services
 */
interface AIResponse {
  message: string;              // The generated response text
  isPatois: boolean;           // Whether response is in Jamaican Patois
  translationOffered?: boolean; // Whether translation was offered (optional)
}

/**
 * Interface defining the structure of a location query
 */
interface LocationQuery {
  isLocationQuery: boolean;
  query: string | null;
  type: 'restaurant' | 'hotel' | null;
}

export class LocationAwareService {
  private defaultService: 'gemini' | 'openai' = 'gemini'; // Prioritize Gemini

  constructor() {
    // No API key needed here, using edge functions
  }

  /**
   * Checks if the service is properly configured
   * @returns Always true since API keys are managed server-side
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Extracts location-based query from user message
   * @param message - The user's message
   * @returns LocationQuery object with query and type
   */
  private extractLocationQuery(message: string): LocationQuery {
    const lowerCaseMessage = message.toLowerCase();
    
    // Check for restaurant queries
    if (lowerCaseMessage.includes('restaurant') || lowerCaseMessage.includes('food') || lowerCaseMessage.includes('eat')) {
      const query = message.replace(/restaurant|food|eat|nearby|near me/gi, '').trim();
      return {
        isLocationQuery: true,
        query: query,
        type: 'restaurant'
      };
    }
    
    // Check for hotel queries
    if (lowerCaseMessage.includes('hotel') || lowerCaseMessage.includes('lodging') || lowerCaseMessage.includes('accommodation')) {
      const query = message.replace(/hotel|lodging|accommodation|nearby|near me/gi, '').trim();
      return {
        isLocationQuery: true,
        query: query,
        type: 'hotel'
      };
    }
    
    // Not a location-based query
    return {
      isLocationQuery: false,
      query: null,
      type: null
    };
  }

  /**
   * Retrieves location data from Google Maps API
   * @param query - The location query
   * @param type - The type of location (restaurant or hotel)
   * @returns LocationData object with places
   */
  private async getLocationData(query: string, type: 'restaurant' | 'hotel'): Promise<LocationData> {
    try {
      return await googleMapsService.searchPlaces(query, type);
    } catch (error) {
      console.error('Google Maps API error:', error);
      throw new Error('Failed to retrieve location data');
    }
  }

  /**
   * Builds a location-aware prompt for the AI
   * @param userMessage - The user's original message
   * @param locationData - The location data from Google Maps API
   * @param isPatois - Whether the user wrote in Jamaican Patois
   * @returns Enhanced prompt string
   */
  private buildLocationAwarePrompt(userMessage: string, locationData: LocationData, isPatois: boolean): string {
    const placeNames = locationData.places.map(place => place.name).join(', ');
    const prompt = isPatois
      ? `User ask bout: "${userMessage}". Mi find some place nearby: ${placeNames}. Tell dem bout it inna Jamaican style, nuh?`
      : `The user asked about: "${userMessage}". I found these places nearby: ${placeNames}. Please respond in a helpful and informative manner.`;
    return prompt;
  }

  async processQuery(
    userMessage: string,
    isPatois: boolean,
    conversationHistory: Message[] = [],
    preferredService?: 'gemini' | 'openai'
  ) {
    try {
      // Use Gemini as default unless specifically requested otherwise
      const serviceToUse = preferredService || this.defaultService;
      
      // Check if this is a location-based query
      const locationQuery = this.extractLocationQuery(userMessage);
      
      if (locationQuery.isLocationQuery && locationQuery.query) {
        try {
          const locationData = await this.getLocationData(locationQuery.query, locationQuery.type);
          
          if (locationData.places && locationData.places.length > 0) {
            // Enhanced prompt for location-aware responses
            const enhancedPrompt = this.buildLocationAwarePrompt(userMessage, locationData, isPatois);
            
            if (serviceToUse === 'gemini') {
              return await geminiService.generateResponse(enhancedPrompt, isPatois, conversationHistory);
            } else {
              return await openaiService.generateResponse(enhancedPrompt, isPatois, conversationHistory);
            }
          }
        } catch (error) {
          console.warn('Location service failed, falling back to regular response:', error);
        }
      }
      
      // Regular AI response without location data
      if (serviceToUse === 'gemini') {
        return await geminiService.generateResponse(userMessage, isPatois, conversationHistory);
      } else {
        return await openaiService.generateResponse(userMessage, isPatois, conversationHistory);
      }
      
    } catch (error) {
      console.error('LocationAwareService error:', error);
      
      // Fallback to the other service if primary fails
      try {
        const fallbackService = serviceToUse === 'gemini' ? 'openai' : 'gemini';
        if (fallbackService === 'gemini') {
          return await geminiService.generateResponse(userMessage, isPatois, conversationHistory);
        } else {
          return await openaiService.generateResponse(userMessage, isPatois, conversationHistory);
        }
      } catch (fallbackError) {
        console.error('Both services failed:', fallbackError);
        return {
          message: isPatois 
            ? "Mi sorry, mi having some trouble right now. Try again later, nuh?"
            : "I'm sorry, I'm having some technical difficulties right now. Please try again later.",
          isPatois: isPatois
        };
      }
    }
  }
}

export const locationAwareService = new LocationAwareService();
