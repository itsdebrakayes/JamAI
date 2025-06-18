
import { ElevenLabsClient } from 'elevenlabs';

class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private apiKey: string = '';

  constructor() {
    this.apiKey = 'sk_4fcefa57080e6d06ec2c4239d852eb307dd1c0fcf07bc4a9';
    this.client = new ElevenLabsClient({ apiKey: this.apiKey });
  }

  async textToSpeech(text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<void> {
    if (!this.client || !text.trim()) {
      console.log('ElevenLabs client not initialized or empty text');
      return;
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

      // Create audio element and play
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      
      // Set volume and ensure it's audible
      audioElement.volume = 1.0;
      audioElement.preload = 'auto';
      
      // Handle playback with proper error handling
      try {
        await audioElement.play();
        console.log('ElevenLabs speech synthesis playback started successfully');
      } catch (playError) {
        console.error('Audio playback failed:', playError);
        // Try to play again after a brief delay (sometimes helps with autoplay restrictions)
        setTimeout(async () => {
          try {
            await audioElement.play();
            console.log('ElevenLabs speech synthesis playback started on retry');
          } catch (retryError) {
            console.error('Audio playback failed on retry:', retryError);
            throw new Error('Failed to play audio - check browser autoplay settings');
          }
        }, 100);
      }
      
      // Clean up when audio finishes
      audioElement.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        console.log('Audio playback completed and resources cleaned up');
      });

      // Also clean up on error
      audioElement.addEventListener('error', (e) => {
        console.error('Audio element error:', e);
        URL.revokeObjectURL(audioUrl);
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
