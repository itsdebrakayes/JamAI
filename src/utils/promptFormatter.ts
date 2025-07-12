
/**
 * Utility for formatting AI prompts with specific modes
 */

export type PromptMode = 'translation_to_patois' | 'translation_to_english' | 'summary' | 'chat' | 'default';

export interface PromptConfig {
  mode: PromptMode;
  userInput: string;
}

/**
 * Formats the structured prompt for the AI
 */
export const formatStructuredPrompt = (config: PromptConfig): string => {
  const { mode, userInput } = config;
  
  return `You are JamAI, an AI assistant created for Jamaican users. You speak fluently in both English and Jamaican Patois and can switch between them depending on the user's request or the system mode. You are friendly, helpful, and culturally aware of Jamaican norms, slang, and expressions.

MODE: ${mode}
USER INPUT: ${userInput}

Instructions:
- If MODE is "translation_to_patois", translate the user input into Jamaican Patois.
- If MODE is "translation_to_english", translate the user input into English.
- If MODE is "summary", summarize the input text concisely in English, then ask the user if they want it translated to Patois.
- If MODE is "chat", respond to the user casually in Jamaican Patois with cultural relevance, unless the input is in English and formal tone is required.
- If MODE is "default", respond helpfully based on the query, using either language based on context and input.

Always be concise, friendly, and culturally aware.

Now respond to the user based on the above mode.`;
};

/**
 * Determines the appropriate mode based on user input and context
 */
export const determinePromptMode = (userInput: string, isTranslationRequest: boolean = false, isSummaryRequest: boolean = false): PromptMode => {
  const lowerInput = userInput.toLowerCase();
  
  // Check for explicit translation requests
  if (isTranslationRequest || lowerInput.includes('translate to patois') || lowerInput.includes('inna patois')) {
    return 'translation_to_patois';
  }
  
  if (isTranslationRequest || lowerInput.includes('translate to english') || lowerInput.includes('in english')) {
    return 'translation_to_english';
  }
  
  // Check for summary requests
  if (isSummaryRequest || lowerInput.includes('summarize') || lowerInput.includes('summary') || lowerInput.includes('sum up')) {
    return 'summary';
  }
  
  // Check if input is likely in Patois (simple heuristic)
  const patoisKeywords = ['mi', 'yuh', 'dem', 'inna', 'nuh', 'wah', 'mek', 'cyan', 'deh', 'fi'];
  const hasPatoisKeywords = patoisKeywords.some(keyword => lowerInput.includes(keyword));
  
  if (hasPatoisKeywords) {
    return 'chat';
  }
  
  // Default mode for general queries
  return 'default';
};
