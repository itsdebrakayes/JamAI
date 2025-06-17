
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

import { geminiService } from '@/services/geminiService';
import { openaiService } from '@/services/openaiService';

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

// AI-powered Patois quiz generation
export const generatePatoisQuiz = async (currentService: 'gemini' | 'openai' = 'gemini'): Promise<string> => {
  try {
    const prompt = `Generate a fun Patois quiz question with 3 multiple choice options (A, B, C). The question should test knowledge of Jamaican Patois words, phrases, or meanings. Format it exactly like this:

🧠 Patois Quiz Time! 🇯🇲

[Question about Patois]

A) [Option 1]
B) [Option 2] 
C) [Option 3]

Tink bout it and tell mi yuh answer! Reply wid A, B, or C.

Make it educational and fun!`;

    const service = currentService === 'gemini' ? geminiService : openaiService;
    const response = await service.generateResponse(prompt, false, []);
    return response.message;
  } catch (error) {
    console.error('Error generating quiz:', error);
    return `🧠 Patois Quiz Time! 🇯🇲\n\nWah dis mean: "Wah gwaan"?\n\nA) How are you?\nB) Where you going?\nC) What's happening?\n\nTink bout it and tell mi yuh answer! Reply wid A, B, or C.`;
  }
};

export const checkQuizAnswer = async (userAnswer: string, lastQuestion: string, currentService: 'gemini' | 'openai' = 'gemini'): Promise<string> => {
  try {
    if (!lastQuestion) return "Mi nuh have no question fi check right now!";
    
    const prompt = `Here was the Patois quiz question:
"${lastQuestion}"

The user answered: "${userAnswer}"

Please check if their answer is correct and respond in Jamaican Patois style. If correct, congratulate them and ask if they want another question. If wrong, tell them the correct answer and encourage them to try again. Keep the response friendly and encouraging in Patois style.`;

    const service = currentService === 'gemini' ? geminiService : openaiService;
    const response = await service.generateResponse(prompt, false, []);
    return response.message;
  } catch (error) {
    console.error('Error checking quiz answer:', error);
    return "Mi cyaan check dat answer right now, but keep practicing yuh Patois!";
  }
};

// This function now ALWAYS uses AI for responses
export const generatePatoisResponse = async (userMessage: string, currentService: 'gemini' | 'openai' = 'gemini'): Promise<string> => {
  try {
    const service = currentService === 'gemini' ? geminiService : openaiService;
    const response = await service.generateResponse(userMessage, false, []);
    return response.message;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Mi have some trouble right now, but mi here fi help yuh.";
  }
};
