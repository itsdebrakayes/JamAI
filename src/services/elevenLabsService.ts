
import { ElevenLabsClient } from 'elevenlabs';

class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private apiKey: string = '';

  constructor() {
    this.apiKey = 'sk_4fcefa57080e6d06ec2c4239d852eb307dd1c0fcf07bc4a9';
    this.client = new ElevenLabsClient({ apiKey: this.apiKey });
  }

  async textToSpeech(text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<HTMLAudioElement> {
    if (!this.client || !text.trim()) {
      console.log('ElevenLabs client not initialized or empty text');
      throw new Error('Client not initialized or empty text');
    }

    try {
      console.log('Starting ElevenLabs speech synthesis for:', text.substring(0, 50) + '...');
      
      const audio = await this.client.textToSpeech.convert(voiceId, {
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      // Handle Node.js Readable stream properly
      const chunks: Uint8Array[] = [];
      
      // Use async iterator to read from the Readable stream
      for await (const chunk of audio) {
        chunks.push(new Uint8Array(chunk));
      }
      
      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('Audio data length:', audioData.length);

      // Create audio element
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      
      // Set volume and ensure it's audible
      audioElement.volume = 1.0;
      audioElement.preload = 'auto';
      
      // Return a promise that resolves with the audio element
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          URL.revokeObjectURL(audioUrl);
        };

        audioElement.addEventListener('ended', () => {
          console.log('Audio playback completed');
          cleanup();
        });

        audioElement.addEventListener('error', (e) => {
          console.error('Audio element error:', e);
          cleanup();
          reject(new Error('Audio playback failed'));
        });

        // Try to play the audio
        audioElement.play()
          .then(() => {
            console.log('ElevenLabs speech synthesis playback started successfully');
            resolve(audioElement);
          })
          .catch((playError) => {
            console.error('Audio playback failed:', playError);
            
            // Try user interaction to enable autoplay
            const handleUserInteraction = () => {
              audioElement.play()
                .then(() => {
                  console.log('Audio playback started after user interaction');
                  document.removeEventListener('click', handleUserInteraction);
                  document.removeEventListener('keydown', handleUserInteraction);
                  resolve(audioElement);
                })
                .catch((retryError) => {
                  console.error('Audio playback failed after user interaction:', retryError);
                  cleanup();
                  reject(new Error('Failed to play audio - check browser autoplay settings'));
                });
            };

            // Add event listeners for user interaction
            document.addEventListener('click', handleUserInteraction);
            document.addEventListener('keydown', handleUserInteraction);
            
            // Show a message to user about clicking to enable audio
            console.log('Audio requires user interaction - click anywhere to play');
            
            // Fallback: resolve anyway but audio won't play until interaction
            setTimeout(() => {
              resolve(audioElement);
            }, 1000);
          });
      });
      
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  isSupported(): boolean {
    return !!this.client && !!this.apiKey;
  }
}

export const elevenLabsService = new ElevenLabsService();
