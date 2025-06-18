


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

      // Convert the Readable stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      // Create audio element and play
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      
      await audioElement.play();
      console.log('ElevenLabs speech synthesis completed');
      
      // Clean up
      audioElement.addEventListener('ended', () => {
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


