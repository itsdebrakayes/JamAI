import { supabase } from '@/integrations/supabase/client';

// Interfaces
export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  distance?: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationAwareResponse {
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

class LocationService {
  private apiKey: string = 'AIzaSyBRXbxox2Sz4zDgmuvJGyoDIAJ3v2LQRt0';
  // These are only available at runtime in the browser
  private placesService: any = null;
  private geocoder: any = null;

  constructor() {
    this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps() {
    if (typeof window !== 'undefined' && !(window as any).google) {
      await this.loadGoogleMapsScript();
    }
    if ((window as any).google) {
      const map = new (window as any).google.maps.Map(document.createElement('div'));
      this.placesService = new (window as any).google.maps.places.PlacesService(map);
      this.geocoder = new (window as any).google.maps.Geocoder();
    }
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  }

  private getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          resolve({ lat: 18.0179, lng: -76.8099 }); // Default to Kingston, Jamaica
        },
        { timeout: 10000 }
      );
    });
  }

  async searchNearbyPlaces(query: string): Promise<PlaceResult[]> {
    try {
      await this.initializeGoogleMaps();
      if (!(window as any).google || !this.placesService) {
        return [];
      }
      const location = await this.getCurrentLocation();
      return new Promise((resolve, reject) => {
        if (!this.placesService) {
          reject(new Error('Places service not initialized'));
          return;
        }
        // Use 'any' for TextSearchRequest and LatLng
        const request = {
          query: `${query} Jamaica`,
          location: new (window as any).google.maps.LatLng(location.lat, location.lng),
          radius: 50000,
        };
        this.placesService.textSearch(request, (results: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
            const places = results.slice(0, 5).map((place: any) => ({
              name: place.name || 'Unknown',
              address: place.formatted_address || 'Address not available',
              rating: place.rating,
              priceLevel: place.price_level,
              isOpen: place.opening_hours?.isOpen(),
              phoneNumber: place.formatted_phone_number,
              website: place.website
            }));
            resolve(places);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      return [];
    }
  }

  isLocationQuery(query: string): boolean {
    const locationKeywords = [
      'nearby', 'near me', 'close to me', 'around here', 'local',
      'where can i', 'where to', 'find', 'location', 'address',
      'patties', 'jerk chicken', 'restaurant', 'food', 'shop',
      'store', 'market', 'beach', 'hotel', 'pharmacy', 'bank'
    ];
    const lowercaseQuery = query.toLowerCase();
    return locationKeywords.some(keyword => lowercaseQuery.includes(keyword));
  }

  formatPlacesForResponse(places: PlaceResult[]): string {
    if (places.length === 0) {
      return "Mi sorry, mi couldn't find any places for dat right now. Try being more specific or check if yuh location is on.";
    }
    let response = "Here are some places mi find fi yuh:\n\n";
    places.forEach((place, index) => {
      response += `${index + 1}. **${place.name}**\n`;
      response += `   📍 ${place.address}\n`;
      if (place.rating) {
        response += `   ⭐ ${place.rating}/5 stars\n`;
      }
      if (place.phoneNumber) {
        response += `   📞 ${place.phoneNumber}\n`;
      }
      if (place.isOpen !== undefined) {
        response += `   ${place.isOpen ? '🟢 Open now' : '🔴 Closed'}\n`;
      }
      response += '\n';
    });
    return response;
  }

  // Location-aware JamAI personality response
  async processQuery(userMessage: string, isUserMessagePatois: boolean = false, conversationHistory: Message[] = []): Promise<LocationAwareResponse> {
    try {
      const isTutorMode = this.detectTutorMode(userMessage);
      let enhancedPrompt = userMessage;
      if (isTutorMode) {
        enhancedPrompt = `Mi need help understanding dis school topic. Please explain it in a way dat easy fi understand, using both Patois and English as needed: ${userMessage}`;
      }
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          userMessage: enhancedPrompt,
          isUserMessagePatois,
          conversationHistory: conversationHistory.slice(-10),
          storedKnowledge: ''
        }
      });
      if (error) throw error;
      const isResponsePatois = this.detectPatois(data.message);
      return {
        message: data.message || 'Sorry, mi cyaan understand dat right now.',
        isPatois: isResponsePatois,
        translationOffered: false
      };
    } catch (error) {
      return this.handleError(isUserMessagePatois);
    }
  }

  private detectTutorMode(message: string): boolean {
    const tutorIndicators = [
      'help', 'explain', 'understand', 'learn', 'teach', 'homework', 'study',
      'school', 'assignment', 'essay', 'math', 'science', 'history', 'english',
      'what is', 'how to', 'why does', 'can you explain'
    ];
    const lowerMessage = message.toLowerCase();
    return tutorIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  private detectPatois(text: string): boolean {
    const patoisIndicators = [
      'mi', 'yuh', 'dem', 'seh', 'nuh', 'weh', 'mek', 'fi', 'wi', 'cyaan',
      'waan', 'ting', 'tings', 'deh', 'yah', 'bout', 'inna', 'wid', 'dat'
    ];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => patoisIndicators.includes(word)).length > 0;
  }

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

export const locationService = new LocationService();
