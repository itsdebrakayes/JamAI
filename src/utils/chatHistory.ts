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

// Enhanced localStorage functions with better error handling
export const getChatHistory = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('📚 No chat history found in localStorage');
      return [];
    }
    
    const parsed = JSON.parse(stored);
    const messages = parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    console.log(`📚 Loaded ${messages.length} messages from localStorage`);
    return messages;
  } catch (error) {
    console.error('❌ Error loading chat history from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const addToHistory = (userMessage: Message, aiMessage: Message) => {
  try {
    const history = getChatHistory();
    const newHistory = [...history, userMessage, aiMessage];
    
    // Keep only last 100 messages to avoid storage bloat
    const trimmed = newHistory.slice(-100);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log(`📚 Saved ${trimmed.length} messages to localStorage`);
  } catch (error) {
    console.error('❌ Error saving to chat history:', error);
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    console.log('📚 Cleared all chat history from localStorage');
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
  }
};

export const saveChatHistory = (chats: ChatHistory[]) => {
  try {
    const serializedChats = chats.map(chat => ({
      ...chat,
      createdAt: chat.createdAt.toISOString(),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    }));
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serializedChats));
    console.log(`📚 Saved ${chats.length} chat histories to localStorage`);
  } catch (error) {
    console.error('❌ Error saving chat history list:', error);
  }
};

export const loadChatHistory = (): ChatHistory[] => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) {
      console.log('📚 No chat history list found in localStorage');
      return [];
    }
    
    const parsed = JSON.parse(stored);
    const chats = parsed.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
    
    console.log(`📚 Loaded ${chats.length} chat histories from localStorage`);
    return chats;
  } catch (error) {
    console.error('❌ Error loading chat history list:', error);
    // Clear corrupted data
    localStorage.removeItem(CHAT_HISTORY_KEY);
    return [];
  }
};

// Enhanced Supabase functions with better error handling and fallbacks
export const createChatSession = async (title: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, using local storage for chat session');
      return null;
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found, using local storage');
      return null;
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ title, user_id: user.id }])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating chat session:', error);
      return null;
    }
    
    console.log(`✅ Created chat session: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    return null;
  }
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, returning empty chat sessions');
      return [];
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching chat sessions:', error);
      return [];
    }
    
    console.log(`📚 Loaded ${data?.length || 0} chat sessions from database`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching chat sessions:', error);
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, cannot save to database');
      return false;
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found, cannot save to database');
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

    if (error) {
      console.error('❌ Error saving message to database:', error);
      return false;
    }
    
    // Update chat session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    console.log('✅ Message saved to database');
    return true;
  } catch (error) {
    console.error('❌ Error saving message to database:', error);
    return false;
  }
};

export const getMessagesForSession = async (sessionId: string): Promise<Message[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, cannot load messages');
      return [];
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages for session:', error);
      return [];
    }

    const messages = (data || []).map((msg: DatabaseMessage) => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.is_user,
      timestamp: new Date(msg.created_at)
    }));
    
    console.log(`📚 Loaded ${messages.length} messages for session ${sessionId}`);
    return messages;
  } catch (error) {
    console.error('❌ Error fetching messages for session:', error);
    return [];
  }
};

export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, cannot delete session');
      return false;
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting chat session:', error);
      return false;
    }
    
    console.log(`✅ Deleted chat session: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting chat session:', error);
    return false;
  }
};

export const updateChatSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, cannot update title');
      return false;
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error updating chat session title:', error);
      return false;
    }
    
    console.log(`✅ Updated chat session title: ${title}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating chat session title:', error);
    return false;
  }
};

// API key functions remain the same
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

    if (error && error.code !== 'PGRST116') {
      console.error(`❌ Error fetching API key for ${serviceName}:`, error);
      return null;
    }
    return data?.encrypted_key || null;
  } catch (error) {
    console.error(`❌ Error fetching API key for ${serviceName}:`, error);
    return null;
  }
};

export const hasUserApiKey = async (serviceName: string): Promise<boolean> => {
  const apiKey = await getUserApiKey(serviceName);
  return !!apiKey;
};
