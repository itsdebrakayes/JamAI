
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
  
  // Check for suggestion-based responses
  for (const suggestion of chatSuggestionsData.suggestions) {
    if (lowerMessage.includes(suggestion.text.toLowerCase()) || 
        (suggestion.id === 'patois' && (lowerMessage.includes('patois') || lowerMessage.includes('teach me'))) ||
        (suggestion.id === 'recipe' && (lowerMessage.includes('recipe') || lowerMessage.includes('cook'))) ||
        (suggestion.id === 'culture' && lowerMessage.includes('culture')) ||
        (suggestion.id === 'music' && lowerMessage.includes('music')) ||
        (suggestion.id === 'places' && (lowerMessage.includes('places') || lowerMessage.includes('visit')))) {
      
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
  
  // Quiz functionality - fixed implementation
  if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('question')) {
    return generatePatoisQuiz();
  }
  
  // Thanks
  if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
    return "No problem at all! Mi glad fi help yuh out anytime!";
  }
  
  // Default responses
  return getRandomPatoisResponse();
};

// Fixed patois quiz function
export const generatePatoisQuiz = (): string => {
  const quizQuestions = [
    {
      question: "Wah dis mean: 'Wah gwaan'?",
      options: ["A) How are you? B) Where you going? C) What's happening?"],
      answer: "C) What's happening?"
    },
    {
      question: "How yuh seh 'I am going' inna Patois?",
      options: ["A) Mi a go B) Mi going C) Mi gone"],
      answer: "A) Mi a go"
    },
    {
      question: "Wah 'big up' mean?",
      options: ["A) Get bigger B) Respect/greetings C) Stand up"],
      answer: "B) Respect/greetings"
    },
    {
      question: "How yuh seh 'something' inna Patois?",
      options: ["A) Someting B) Sumting C) Sometin"],
      answer: "A) Someting"
    },
    {
      question: "Wah 'cho' express?",
      options: ["A) Happiness B) Frustration/annoyance C) Surprise"],
      answer: "B) Frustration/annoyance"
    }
  ];
  
  const randomQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  
  return `🧠 Patois Quiz Time! 🇯🇲\n\n${randomQuestion.question}\n\n${randomQuestion.options[0]}\n\nTink bout it and tell mi yuh answer! Di correct answer is: ${randomQuestion.answer}`;
};
