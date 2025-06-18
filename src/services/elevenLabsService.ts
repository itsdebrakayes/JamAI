
import { ElevenLabsClient } from 'elevenlabs';

class ElevenLabsService {
  private client: ElevenLabsClient | null = null;
  private apiKey: string = '';
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.apiKey = 'sk_4fcefa57080e6d06ec2c4239d852eb307dd1c0fcf07bc4a9';
    this.client = new ElevenLabsClient({ apiKey: this.apiKey });
  }

  async textToSpeech(text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<HTMLAudioElement> {
    if (!this.client || !text.trim()) {
      console.log('ElevenLabs client not initialized or empty text');
      throw new Error('Client not initialized or empty text');
    }

    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    try {
      console.log('Starting ElevenLabs speech synthesis for:', text.substring(0, 50) + '...');
      
      const audio = await this.client.textToSpeech.convert(voiceId, {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.2,
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

      console.log('Audio data received, length:', audioData.length);

      // Create audio element with proper settings
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      
      // Configure audio for natural playback
      audioElement.volume = 0.8;
      audioElement.playbackRate = 1.0; // Normal human speech rate
      audioElement.preload = 'auto';
      
      // Store reference to current audio
      this.currentAudio = audioElement;
      
      // Cleanup when audio ends
      audioElement.addEventListener('ended', () => {
        console.log('Audio playback completed');
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      });

      audioElement.addEventListener('error', (e) => {
        console.error('Audio element error:', e);
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      });

      // Try to play immediately
      try {
        await audioElement.play();
        console.log('ElevenLabs speech synthesis playback started successfully');
        return audioElement;
      } catch (playError) {
        console.log('Autoplay blocked, audio ready but waiting for user interaction');
        return audioElement;
      }
      
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isSupported(): boolean {
    return !!this.client && !!this.apiKey;
  }
}

export const elevenLabsService = new ElevenLabsService();
