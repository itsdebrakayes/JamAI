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

import chatSuggestionsData from '@/data/chatSuggestions.json';
import { geminiService } from '@/services/geminiService';

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
export const generatePatoisQuiz = async (): Promise<string> => {
  try {
    const prompt = `Generate a fun Patois quiz question with 3 multiple choice options (A, B, C). The question should test knowledge of Jamaican Patois words, phrases, or meanings. Format it exactly like this:

🧠 Patois Quiz Time! 🇯🇲

[Question about Patois]

A) [Option 1]
B) [Option 2] 
C) [Option 3]

Tink bout it and tell mi yuh answer! Reply wid A, B, or C.

Make it educational and fun!`;

    const response = await geminiService.generateResponse(prompt, false, []);
    return response.message;
  } catch (error) {
    console.error('Error generating quiz:', error);
    return `🧠 Patois Quiz Time! 🇯🇲\n\nWah dis mean: "Wah gwaan"?\n\nA) How are you?\nB) Where you going?\nC) What's happening?\n\nTink bout it and tell mi yuh answer! Reply wid A, B, or C.`;
  }
};

export const checkQuizAnswer = async (userAnswer: string, lastQuestion: string): Promise<string> => {
  try {
    if (!lastQuestion) return "Mi nuh have no question fi check right now!";
    
    const prompt = `Here was the Patois quiz question:
"${lastQuestion}"

The user answered: "${userAnswer}"

Please check if their answer is correct and respond in Jamaican Patois style. If correct, congratulate them and ask if they want another question. If wrong, tell them the correct answer and encourage them to try again. Keep the response friendly and encouraging in Patois style.`;

    const response = await geminiService.generateResponse(prompt, false, []);
    return response.message;
  } catch (error) {
    console.error('Error checking quiz answer:', error);
    return "Mi cyaan check dat answer right now, but keep practicing yuh Patois!";
  }
};

export const generatePatoisResponse = async (userMessage: string): Promise<string> => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for suggestion-based responses (exclude quiz)
  for (const suggestion of chatSuggestionsData.suggestions) {
    if (suggestion.id !== 'quiz' && (
        lowerMessage.includes(suggestion.text.toLowerCase()) || 
        (suggestion.id === 'patois' && (lowerMessage.includes('patois') || lowerMessage.includes('teach me'))) ||
        (suggestion.id === 'recipe' && (lowerMessage.includes('recipe') || lowerMessage.includes('cook'))) ||
        (suggestion.id === 'culture' && lowerMessage.includes('culture')) ||
        (suggestion.id === 'music' && lowerMessage.includes('music')) ||
        (suggestion.id === 'places' && (lowerMessage.includes('places') || lowerMessage.includes('visit'))))) {
      
      const randomIndex = Math.floor(Math.random() * suggestion.responses.length);
      return suggestion.responses[randomIndex];
    }
  }
  
  // Enhanced language detection context
  const isPatoisInput = lowerMessage.includes('mi ') || lowerMessage.includes('yuh ') || 
                       lowerMessage.includes('wah gwaan') || lowerMessage.includes('big up');
  
  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return getPatoisGreeting();
  }
  
  // Farewells
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    return getPatoisFarewell();
  }
  
  // Quiz functionality - generate AI-powered quiz questions
  if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('question')) {
    return await generatePatoisQuiz();
  }
  
  // Questions about Jamaica
  if (lowerMessage.includes('jamaica') || lowerMessage.includes('jamaican')) {
    return "Big up! Jamaica nice man! Beautiful island wid di best people and culture inna di world! Yuh ever visit?";
  }
  
  // Music related
  if (lowerMessage.includes('reggae') || lowerMessage.includes('dancehall')) {
    return "Yow! Reggae and dancehall music sweet enuh! From Bob Marley to di new generation, Jamaica music touch every corner a di earth!";
  }
  
  // Food related
  if (lowerMessage.includes('food') || lowerMessage.includes('jerk') || lowerMessage.includes('curry')) {
    return "Cho! Jamaican food wicked! Jerk chicken, curry goat, rice and peas - everything tasty and full a flavor!";
  }
  
  // Thanks
  if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
    return "No problem at all! Mi glad fi help yuh out anytime!";
  }
  
  // Default responses
  return getRandomPatoisResponse();
};
