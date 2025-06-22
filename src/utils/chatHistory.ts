import { Message } from '@/types/Message';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'jamai_chat_history';
const CHAT_HISTORY_KEY = 'jamai_chat_list';

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatSession {
  id: string;
  title: string;
  auto_title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number | null;
}

interface DatabaseMessage {
  id: string;
  content: string;
  is_user: boolean;
  message_type: string;
  metadata: any;
  created_at: string;
}

// Legacy localStorage functions (kept for backward compatibility)
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

export const saveChatHistory = (chats: ChatHistory[]) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chat history list:', error);
  }
};

export const loadChatHistory = (): ChatHistory[] => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading chat history list:', error);
    return [];
  }
};

// New Supabase-based functions for authenticated users
export const createChatSession = async (title: string): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title, user_id: user.id }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating chat session:', error);
    return null;
  }
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
};

export const saveMessageToDatabase = async (
  sessionId: string,
  content: string,
  isUser: boolean,
  messageType: string = 'text',
  metadata: any = {}
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('messages')
      .insert([{
        session_id: sessionId,
        content,
        is_user: isUser,
        message_type: messageType,
        metadata,
        user_id: user.id
      }]);

    if (error) throw error;
    
    // Update chat session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return true;
  } catch (error) {
    console.error('Error saving message to database:', error);
    return false;
  }
};

export const getMessagesForSession = async (sessionId: string): Promise<Message[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((msg: DatabaseMessage) => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.is_user,
      timestamp: new Date(msg.created_at)
    }));
  } catch (error) {
    console.error('Error fetching messages for session:', error);
    return [];
  }
};

export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
};

export const updateChatSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating chat session title:', error);
    return false;
  }
};

// Enhanced function to get user's API key for a service
export const getUserApiKey = async (serviceName: string): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('service_name', serviceName)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.encrypted_key || null;
  } catch (error) {
    console.error(`Error fetching API key for ${serviceName}:`, error);
    return null;
  }
};

// Function to check if user has API key for service
export const hasUserApiKey = async (serviceName: string): Promise<boolean> => {
  const apiKey = await getUserApiKey(serviceName);
  return !!apiKey;
};
