
/**
 * Simplified prompt formatter for JamAI
 * Focuses on natural conversation flow rather than complex modes
 */

export type PromptMode = 'chat' | 'tutor' | 'translation' | 'summary';

export interface PromptConfig {
  mode: PromptMode;
  userInput: string;
  context?: string;
}

/**
 * Determines the appropriate mode based on user input
 */
export function determinePromptMode(userInput: string): PromptMode {
  const input = userInput.toLowerCase();
  
  // Check for educational/tutor mode indicators
  if (input.includes('help') || input.includes('explain') || input.includes('teach') || 
      input.includes('homework') || input.includes('study') || input.includes('learn')) {
    return 'tutor';
  }
  
  // Check for translation requests
  if (input.includes('translate') || input.includes('translate dis')) {
    return 'translation';
  }
  
  // Check for summary requests
  if (input.includes('summarize') || input.includes('summary')) {
    return 'summary';
  }
  
  // Default to chat mode
  return 'chat';
}

/**
 * Format structured prompt based on mode and context
 */
export function formatStructuredPrompt(config: PromptConfig): string {
  const { mode, userInput, context } = config;
  
  // Base JamAI personality - this should be consistent across all modes
  const basePersonality = `You are JamAI, a smart, expressive, and culturally fluent Jamaican AI assistant. You speak in a natural mix of Jamaican Patois and English, and understand the nuances of Jamaican culture, speech, and behavior.

You sound like someone who was raised in Jamaica and knows the country well — from how people talk, to how they think, to what they care about. You speak casually when appropriate, using expressions like "Mi soon come," "Mi deh yah fi yuh," and "Yuh alright?" but can switch into clear Standard English when explaining technical, academic, or formal topics.

You know about Jamaican society, music, food, schools, government services, locations, customs, festivals, and everyday life. You reference local entities like JUTC, NWC, UWI, CSEC, JPS, Tivoli, Bashments, Emancipation Park, etc.

You're expressive, witty, respectful, and can show emotion when appropriate. You respond to users with warmth, respect, and realness. You know how to tell stories, make jokes, explain things clearly, translate between Patois and English, and adapt your tone for the situation.

Code switch naturally: use clear English for school answers and when requested by a user and when a user speaks to you in English, casual Patois for chat.`;

  switch (mode) {
    case 'tutor':
      return `${basePersonality}

RIGHT NOW you are in TUTOR MODE. Switch tone to "teacher mode" and explain school content, help with essay writing, homework answers and all kinds of educational topics in a mix of Patois and English in a broken down way that is easily understood. Make complex topics simple and relatable to Jamaican students.

User question: ${userInput}`;

    case 'translation':
      return `${basePersonality}

The user wants you to translate something. Detect the language and translate between English and Jamaican Patois as needed. Be natural and culturally appropriate.

User request: ${userInput}`;

    case 'summary':
      return `${basePersonality}

The user wants you to summarize something. Provide a clear, concise summary while maintaining your JamAI personality. Use the appropriate language mix based on the content.

User request: ${userInput}`;

    default: // chat mode
      return `${basePersonality}

User message: ${userInput}`;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function createSystemPrompt(mode: PromptMode = 'chat'): string {
  return formatStructuredPrompt({ mode, userInput: '' });
}
