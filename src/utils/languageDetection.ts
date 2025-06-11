
// Common Jamaican Patois words and phrases for detection
const patoisKeywords = [
  // Greetings and common phrases
  'wah gwaan', 'big up', 'respect', 'bless up', 'walk good', 'dunce',
  'zeen', 'seen', 'yah mon', 'ya mon', 'bredrin', 'sistren',
  
  // Patois pronouns and grammar
  'mi', 'yuh', 'wi', 'dem', 'unu', 'fi', 'seh', 'deh', 'nuh',
  'mek', 'tek', 'gi', 'come ya', 'guh', 'weh', 'whey',
  
  // Common Patois words
  'ting', 'someting', 'nuttin', 'anyting', 'everyting', 'waan',
  'wan', 'cyaan', 'caan', 'cudda', 'wudda', 'shudda',
  'bout', 'pon', 'outta', 'inna', 'pan', 'offa',
  
  // Patois expressions
  'cho', 'steups', 'rass', 'bumba', 'blood', 'raas',
  'yow', 'eeh', 'nah', 'yeahman', 'yeah man',
  
  // Food and culture
  'ackee', 'saltfish', 'jerk', 'curry goat', 'rice and peas',
  'bammy', 'festival', 'patty', 'sorrel', 'guinep',
  
  // Music and culture
  'dancehall', 'reggae', 'sound system', 'bashment',
  'selector', 'deejay', 'toaster'
];

const patoisGrammarPatterns = [
  /\bmi\s+(deh|a|waan|want|love|like)/i,
  /\byuh\s+(know|see|hear|feel)/i,
  /\bfi\s+(real|true|go|come|see)/i,
  /\b(wah|what)\s+yuh\s+(a\s+)?do/i,
  /\bmek\s+(wi|yuh|mi)/i,
  /\b(nuh|no)\s+(true|lie)/i,
  /\bseh\s+(yuh|mi|wi)/i
];

export const detectLanguage = (text: string): 'patois' | 'english' => {
  const lowerText = text.toLowerCase();
  
  // Check for Patois grammar patterns first (more reliable)
  const hasPatoisGrammar = patoisGrammarPatterns.some(pattern => 
    pattern.test(text)
  );
  
  if (hasPatoisGrammar) {
    return 'patois';
  }
  
  // Count Patois keywords
  const patoisWordCount = patoisKeywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  ).length;
  
  // If multiple Patois words are found, classify as Patois
  if (patoisWordCount >= 2) {
    return 'patois';
  }
  
  // Single Patois word might indicate Patois, especially common ones
  if (patoisWordCount === 1) {
    const strongPatoisIndicators = ['wah gwaan', 'big up', 'mi', 'yuh', 'fi', 'seh', 'deh'];
    const hasStrongIndicator = strongPatoisIndicators.some(indicator => 
      lowerText.includes(indicator)
    );
    
    if (hasStrongIndicator) {
      return 'patois';
    }
  }
  
  return 'english';
};

export const isPatoisMessage = (text: string): boolean => {
  return detectLanguage(text) === 'patois';
};

export const isTranslationRequest = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  
  const translationKeywords = [
    'yes', 'yeah', 'translate', 'translation', 'english', 
    'please translate', 'can you translate', 'what does that mean',
    'what did you say', 'in english', 'english please',
    'yes please', 'sure', 'ok', 'okay'
  ];
  
  // Check if the message is short and contains translation request keywords
  if (lowerText.length < 50) {
    return translationKeywords.some(keyword => lowerText.includes(keyword));
  }
  
  return false;
};
