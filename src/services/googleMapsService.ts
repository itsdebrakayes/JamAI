
/**
 * Google Maps Service for location-based queries
 * Handles geolocation and Places API requests for Jamaican businesses
 */

interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  distance?: string;
}

interface LocationCoordinates {
  lat: number;
  lng: number;
}

// Extend the global Window interface to include google
declare global {
  interface Window {
    google: typeof google;
  }
}

export class GoogleMapsService {
  private apiKey: string = 'AIzaSyBRXbxox2Sz4zDgmuvJGyoDIAJ3v2LQRt0';
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.initializeGoogleMaps();
  }

  /**
   * Initialize Google Maps API
   */
  private async initializeGoogleMaps() {
    if (typeof window !== 'undefined' && !window.google) {
      await this.loadGoogleMapsScript();
    }
    
    // Initialize services
    if (window.google) {
      const map = new google.maps.Map(document.createElement('div'));
      this.placesService = new google.maps.places.PlacesService(map);
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Load Google Maps JavaScript API
   */
  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
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

  /**
   * Get user's current location
   */
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
          // Default to Kingston, Jamaica if location access denied
          resolve({ lat: 18.0179, lng: -76.8099 });
        },
        { timeout: 10000 }
      );
    });
  }

  /**
   * Search for places based on query and location
   */
  async searchNearbyPlaces(query: string): Promise<PlaceResult[]> {
    try {
      await this.initializeGoogleMaps();
      
      if (!window.google || !this.placesService) {
        console.warn('Google Maps API not available');
        return [];
      }
      
      const location = await this.getCurrentLocation();

      return new Promise((resolve, reject) => {
        if (!this.placesService) {
          reject(new Error('Places service not initialized'));
          return;
        }

        const request: google.maps.places.TextSearchRequest = {
          query: `${query} Jamaica`,
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: 50000, // 50km radius
        };

        this.placesService.textSearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places = results.slice(0, 5).map(place => ({
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
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Check if a query is location-related
   */
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

  /**
   * Format places results for AI response
   */
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
}

export const googleMapsService = new GoogleMapsService();
