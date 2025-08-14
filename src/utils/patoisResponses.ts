
// Jamaican Patois responses for the AI
export const patoisGreetings = [
  "Wah gwaan! Mi deh yah fi help yuh out today!",
  "Big up yuself! How mi can assist yuh?",
  "Respect! Mi ready fi chat wid yuh!",
  "Bless up! Wah yuh wah know?",
  "Walk good! Mi here fi help yuh out!"
];

export const patoisResponses = [
  "Zeen! Mi understand wah ya seh.",
  "Dat sound good enuh! Tell mi more bout dat.",
  "Respect! Dat a one interesting ting yuh bring up.",
  "Fi real? Dat nice man!",
  "Mi feel yuh pon da one deh!",
  "Cho! Dat easy fi deal wid.",
  "No problem at all, bredrin!",
  "Yuh know seh mi always ready fi help!",
  "Dat make whole heap a sense!",
  "Bless! Mi glad fi share dis wid yuh.",
  "Ah, lemme get that started",
  "Dunce, sound like a mad ting, can get that for you rn!",
  "Up up mi g, bout fi maths dat up fi yuh",
  "Ah, watch dis."
];

export const patoisFarewells = [
  "Walk good and tek care a yuself!",
  "Until next time, up up!",
  "Dunce! See yuh soon!",
  "Big up yuself and have a nice day!",
  "Respect and blessings! Chat soon!"
];

import { apiService } from '@/services/apiService';

export const getRandomPatoisResponse = (): string => {
  const responses = [...patoisResponses];
  return responses[Math.floor(Math.random() * responses.length)];
};

export const getPatoisGreeting = (): string => {
  return patoisGreetings[Math.floor(Math.random() * patoisGreetings.length)];
};

export const getPatoisFarewell = (): string => {
  return patoisFarewells[Math.floor(Math.random() * patoisFarewells.length)];
};

// This function now ALWAYS uses AI for responses - no special quiz handling
export const generatePatoisResponse = async (userMessage: string, currentService: 'gemini' | 'openai' = 'gemini'): Promise<string> => {
  try {
    const response = currentService === 'gemini' 
      ? await apiService.generateGeminiResponse(userMessage, false, [])
      : await apiService.generateOpenAIResponse(userMessage, false, []);
    return response.message;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Mi have some trouble right now, but mi here fi help yuh.";
  }
};
