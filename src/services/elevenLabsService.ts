
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
          stability: 0.5,
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

      console.log('Audio data received, total bytes:', totalLength);

      // Create multiple audio elements with different configurations to test
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Try creating audio element with explicit settings and faster playback
      const audioElement = new Audio();
      audioElement.src = audioUrl;
      audioElement.volume = 1.0; // Maximum volume
      audioElement.playbackRate = 1.15; // Slightly faster playback speed
      audioElement.preload = 'auto';
      audioElement.loop = false;
      audioElement.muted = false; // Explicitly unmute
      
      console.log('Audio element created with:');
      console.log('- src:', audioElement.src ? 'SET' : 'NOT SET');
      console.log('- volume:', audioElement.volume);
      console.log('- playbackRate:', audioElement.playbackRate);
      console.log('- muted:', audioElement.muted);
      console.log('- readyState:', audioElement.readyState);
      
      // Try to initialize audio context and resume it
      let audioContext;
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext state:', audioContext.state);
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('AudioContext resumed, new state:', audioContext.state);
        }
      } catch (contextError) {
        console.warn('AudioContext initialization failed:', contextError);
      }
      
      // Store reference to current audio
      this.currentAudio = audioElement;
      
      // Add comprehensive event listeners for debugging
      audioElement.addEventListener('loadstart', () => {
        console.log('🔵 Audio loading started');
      });

      audioElement.addEventListener('loadedmetadata', () => {
        console.log('🔵 Audio metadata loaded - duration:', audioElement.duration);
      });

      audioElement.addEventListener('canplay', () => {
        console.log('🟢 Audio can start playing - volume:', audioElement.volume, 'muted:', audioElement.muted);
      });

      audioElement.addEventListener('canplaythrough', () => {
        console.log('🟢 Audio can play through completely');
      });

      audioElement.addEventListener('volumechange', () => {
        console.log('🔊 Audio volume changed to:', audioElement.volume, 'muted:', audioElement.muted);
      });

      audioElement.addEventListener('play', () => {
        console.log('▶️ Audio play event fired - volume:', audioElement.volume, 'current time:', audioElement.currentTime);
      });

      audioElement.addEventListener('playing', () => {
        console.log('🎵 Audio is actually playing at volume:', audioElement.volume, 'time:', audioElement.currentTime);
      });

      audioElement.addEventListener('pause', () => {
        console.log('⏸️ Audio paused at time:', audioElement.currentTime);
      });

      audioElement.addEventListener('ended', () => {
        console.log('⏹️ Audio playback completed');
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      });

      audioElement.addEventListener('error', (e) => {
        console.error('❌ Audio element error:', e);
        console.error('❌ Audio error details:', audioElement.error);
        console.error('❌ Error code:', audioElement.error?.code);
        console.error('❌ Error message:', audioElement.error?.message);
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audioElement) {
          this.currentAudio = null;
        }
      });

      // Wait for audio to be ready with multiple fallbacks
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            console.log('✅ Audio element ready for playback');
            resolve(audioElement);
          }
        };
        
        audioElement.addEventListener('canplaythrough', resolveOnce);
        audioElement.addEventListener('canplay', resolveOnce);
        
        audioElement.addEventListener('error', () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Failed to load audio'));
          }
        });
        
        // Multiple fallback timeouts
        setTimeout(() => {
          if (!resolved && audioElement.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('⏰ Audio ready via short timeout, readyState:', audioElement.readyState);
            resolveOnce();
          }
        }, 1000);
        
        setTimeout(() => {
          if (!resolved && audioElement.readyState >= 1) { // HAVE_METADATA
            console.log('⏰ Audio ready via long timeout, readyState:', audioElement.readyState);
            resolveOnce();
          }
        }, 3000);
        
        // Force resolve as last resort
        setTimeout(() => {
          if (!resolved) {
            console.log('⏰ Audio forced ready as last resort, readyState:', audioElement.readyState);
            resolveOnce();
          }
        }, 5000);
      });
      
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      throw new Error('Failed to synthesize speech: ' + (error as Error).message);
    }
  }

  stopCurrentAudio(): void {
    if (this.currentAudio) {
      console.log('🛑 Stopping current audio');
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
