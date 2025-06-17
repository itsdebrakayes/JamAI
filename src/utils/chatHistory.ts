import { Message } from '@/types/Message';

const STORAGE_KEY = 'jamai_chat_history';

export const getChatHistory = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

export const addToHistory = (userMessage: Message, aiMessage: Message) => {
  try {
    const history = getChatHistory();
    const newHistory = [...history, userMessage, aiMessage];
    
    // Keep only last 50 messages to avoid storage bloat
    const trimmed = newHistory.slice(-50);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving to chat history:', error);
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};
