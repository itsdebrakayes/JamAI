
// Jamaican Patois responses for the AI
export const patoisGreetings = [
  "Wah gwaan! Mi deh yah fi help yuh out today!",
  "Big up yuself! How mi can assist yuh?",
  "Irie! Mi ready fi chat wid yuh!",
  "Bless up! Wah yuh waan know?",
  "Walk good! Mi here fi help yuh out!"
];

export const patoisResponses = [
  "Seen! Mi understand wah yuh a seh.",
  "Dat sound good enuh! Tell mi more bout dat.",
  "Respect! Dat a one interesting ting yuh bring up.",
  "Fi real? Dat nice man!",
  "Mi feel yuh pon dat one!",
  "Cho! Dat easy fi deal wid.",
  "No problem at all, bredrin!",
  "Yuh know seh mi always ready fi help!",
  "Dat make whole heap a sense!",
  "Blessed! Mi glad fi share dis wid yuh."
];

export const patoisFarewells = [
  "Walk good and tek care a yuself!",
  "Until next time, stay blessed!",
  "One love! See yuh soon!",
  "Big up yuself and have a irie day!",
  "Respect and blessings! Chat soon!"
];

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

export const generatePatoisResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return getPatoisGreeting();
  }
  
  // Farewells
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    return getPatoisFarewell();
  }
  
  // Questions about Jamaica
  if (lowerMessage.includes('jamaica') || lowerMessage.includes('jamaican')) {
    return "Big up! Jamaica nice man! Beautiful island wid di best people and culture inna di world! Yuh ever visit?";
  }
  
  // Music related
  if (lowerMessage.includes('music') || lowerMessage.includes('reggae') || lowerMessage.includes('dancehall')) {
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
