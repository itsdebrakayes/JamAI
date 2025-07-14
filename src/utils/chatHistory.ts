import { Message } from '@/types/Message';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'jamai_chat_history';
const CHAT_HISTORY_KEY = 'jamai_chat_list';

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
}

interface ChatSession {
  id: string;
  title: string;
  auto_title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number | null;
  keywords?: string[] | null;
  summary?: string | null;
}

interface DatabaseMessage {
  id: string;
  content: string;
  is_user: boolean;
  message_type: string;
  metadata: any;
  created_at: string;
}

// Generate proper UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Enhanced intelligent title generation with comprehensive pattern recognition
export function generateIntelligentTitle(messages: Message[]): string {
  console.log('🤖 Generating intelligent title for', messages.length, 'messages');
  
  if (messages.length === 0) {
    console.log('⚠️ No messages found for title generation');
    return 'New Chat';
  }
  
  const firstUserMessage = messages.find(m => m.isUser)?.text || '';
  
  if (firstUserMessage.length === 0) {
    console.log('⚠️ No user message found for title generation');
    return 'New Chat';
  }
  
  console.log('📝 First user message for title:', firstUserMessage.substring(0, 50) + '...');
  
  const text = firstUserMessage.toLowerCase();
  const cleanText = firstUserMessage
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Enhanced pattern matching for more descriptive titles
  
  // Weather queries
  if (text.includes('weather') || text.includes('temperature') || text.includes('forecast')) {
    const locationMatch = text.match(/weather.*?(?:in|for|at)\s+([a-zA-Z\s]+?)(?:\s|$|[?.,])/);
    const location = locationMatch ? locationMatch[1].trim() : '';
    return location ? `Weather in ${location}` : 'Weather Forecast';
  }
  
  // Recipe and cooking
  if (text.includes('recipe') || text.includes('cook') || text.includes('bake') || text.includes('ingredients')) {
    const dishMatch = text.match(/(?:recipe|cook|bake|make)\s+(?:for\s+)?([a-zA-Z\s]+?)(?:\s|$|[?.,])/);
    const dish = dishMatch ? dishMatch[1].trim().split(' ').slice(0, 2).join(' ') : '';
    return dish ? `Recipe: ${dish}` : 'Cooking Help';
  }
  
  // Translation and language
  if (text.includes('translate') || text.includes('patois') || text.includes('creole') || text.includes('dialect')) {
    if (text.includes('patois') || text.includes('creole')) {
      return 'Patois Translation';
    }
    return 'Translation Help';
  }
  
  // Questions and help
  if (text.startsWith('what') || text.startsWith('how') || text.startsWith('why') || text.startsWith('when') || text.startsWith('where')) {
    const questionType = text.split(' ')[0];
    const topic = text.split(' ').slice(1, 4).join(' ').replace(/[?.,]/g, '');
    return topic ? `${questionType.charAt(0).toUpperCase() + questionType.slice(1)}: ${topic}` : 'Question';
  }
  
  // Help requests
  if (text.includes('help') || text.includes('assist') || text.includes('support')) {
    const helpTopic = text.split(/help|assist|support/)[1]?.trim().split(' ').slice(0, 3).join(' ');
    return helpTopic ? `Help: ${helpTopic}` : 'Help Request';
  }
  
  // Jamaica and culture
  if (text.includes('jamaica') || text.includes('jamaican') || text.includes('caribbean')) {
    if (text.includes('culture') || text.includes('tradition')) {
      return 'Jamaican Culture';
    }
    if (text.includes('history')) {
      return 'Jamaican History';
    }
    return 'About Jamaica';
  }
  
  // Travel and location
  if (text.includes('travel') || text.includes('visit') || text.includes('vacation') || text.includes('trip')) {
    const locationMatch = text.match(/(?:to|in|visit)\s+([a-zA-Z\s]+?)(?:\s|$|[?.,])/);
    const location = locationMatch ? locationMatch[1].trim() : '';
    return location ? `Travel: ${location}` : 'Travel Planning';
  }
  
  // News and current events
  if (text.includes('news') || text.includes('latest') || text.includes('current') || text.includes('today')) {
    return 'News & Updates';
  }
  
  // Technology and tech support
  if (text.includes('computer') || text.includes('software') || text.includes('app') || text.includes('phone') || text.includes('tech')) {
    return 'Tech Support';
  }
  
  // Health and medical
  if (text.includes('health') || text.includes('medical') || text.includes('doctor') || text.includes('symptom')) {
    return 'Health Inquiry';
  }
  
  // Education and learning
  if (text.includes('learn') || text.includes('study') || text.includes('explain') || text.includes('understand')) {
    const topic = text.split(/learn|study|explain|understand/)[1]?.trim().split(' ').slice(0, 2).join(' ');
    return topic ? `Learning: ${topic}` : 'Learning Help';
  }
  
  // Business and work
  if (text.includes('business') || text.includes('work') || text.includes('job') || text.includes('career')) {
    return 'Business & Career';
  }
  
  // Entertainment
  if (text.includes('movie') || text.includes('music') || text.includes('song') || text.includes('book')) {
    return 'Entertainment';
  }
  
  // Financial
  if (text.includes('money') || text.includes('budget') || text.includes('finance') || text.includes('invest')) {
    return 'Financial Advice';
  }
  
  // Fall back to extracting key phrases or using meaningful first sentence
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 5 && firstSentence.length <= 50) {
      return firstSentence;
    }
    if (firstSentence.length > 50) {
      return firstSentence.substring(0, 47) + '...';
    }
  }
  
  // Final fallback: use first meaningful words
  const words = cleanText.split(' ').filter(word => word.length > 2);
  const meaningfulWords = words.slice(0, 6).join(' ');
  const title = meaningfulWords.length > 50 
    ? meaningfulWords.substring(0, 47) + '...'
    : meaningfulWords || 'New Chat';
  
  console.log('💬 Generated enhanced title:', title);
  return title;
}

// Extract conversation keywords
function extractKeywords(messages: Message[]): string[] {
  const text = messages.map(m => m.text).join(' ').toLowerCase();
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'i', 'you', 'me', 'my', 'your'];
  const words = text.match(/\b\w{3,}\b/g) || [];
  
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    if (!commonWords.includes(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Generate conversation summary
function generateSummary(messages: Message[]): string {
  if (messages.length < 4) return '';
  
  const userMessages = messages.filter(m => m.isUser).slice(0, 3);
  const topics = userMessages.map(m => {
    const text = m.text.length > 60 ? m.text.substring(0, 60) + '...' : m.text;
    return text;
  });
  
  return `Discussed: ${topics.join('; ')}`;
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
    localStorage.removeItem(CHAT_HISTORY_KEY);
    return [];
  }
};

// Enhanced Supabase functions with better error handling and reliable title generation
export const createChatSession = async (title: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('🔐 Auth error, using local storage for chat session');
      return generateUUID();
    }
    
    if (!user) {
      console.log('🔐 No authenticated user found, using local storage');
      return generateUUID();
    }

    // For authenticated users, use user.id as the session ID
    const sessionId = user.id;
    
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (existingSession) {
      console.log(`✅ Using existing chat session: ${sessionId}`);
      return sessionId;
    }

    // Create new session with user.id as the ID
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ id: sessionId, title, user_id: user.id }])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating chat session:', error);
      return sessionId; // Return user.id anyway for consistency
    }
    
    console.log(`✅ Created new chat session: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    return generateUUID();
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

// Improved message saving with reliable intelligent title generation
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

    // Save the message
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

    console.log(`✅ Message saved to database - User: ${isUser}, Session: ${sessionId}`);

    // Update chat session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    // Generate intelligent title and metadata after AI response (not user message)
    if (!isUser) {
      console.log('🤖 AI message saved, generating intelligent title...');
      
      try {
        // Get all messages for this session to generate intelligent data
        const { data: sessionMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('❌ Error fetching session messages for title generation:', messagesError);
          return true; // Message was saved, just title generation failed
        }

        if (sessionMessages && sessionMessages.length > 0) {
          console.log(`📚 Found ${sessionMessages.length} messages for intelligent title generation`);
          
          const messages: Message[] = sessionMessages.map((msg: DatabaseMessage) => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.is_user,
            timestamp: new Date(msg.created_at)
          }));

          // Generate intelligent data
          const autoTitle = generateIntelligentTitle(messages);
          const keywords = extractKeywords(messages);
          const summary = generateSummary(messages);

          console.log('🎯 Generated intelligent data:', {
            autoTitle,
            keywords: keywords.slice(0, 3),
            summary: summary.substring(0, 50) + '...',
            messageCount: messages.length
          });

          // Update the chat session with intelligent data
          const { error: updateError } = await supabase
            .from('chat_sessions')
            .update({ 
              auto_title: autoTitle,
              keywords: keywords,
              summary: summary,
              message_count: messages.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('❌ Error updating chat session with intelligent data:', updateError);
          } else {
            console.log(`✅ Successfully generated intelligent title: "${autoTitle}" for session ${sessionId}`);
          }
        } else {
          console.log('⚠️ No messages found for session, cannot generate intelligent title');
        }
      } catch (titleError) {
        console.error('❌ Error in intelligent title generation process:', titleError);
      }
    }

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

// New function to backfill missing intelligent titles for existing chats - NOW EXPORTED
export const backfillMissingTitles = async (): Promise<void> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('🔐 Cannot backfill titles without authenticated user');
      return;
    }

    // Get sessions that don't have auto_title or have empty auto_title
    const { data: sessionsNeedingTitles, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, title')
      .eq('user_id', user.id)
      .or('auto_title.is.null,auto_title.eq.');

    if (sessionsError) {
      console.error('❌ Error fetching sessions needing titles:', sessionsError);
      return;
    }

    if (!sessionsNeedingTitles || sessionsNeedingTitles.length === 0) {
      console.log('✅ No sessions need title backfill');
      return;
    }

    console.log(`🔄 Backfilling titles for ${sessionsNeedingTitles.length} sessions...`);

    for (const session of sessionsNeedingTitles) {
      try {
        // Get messages for this session
        const { data: sessionMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (messagesError || !sessionMessages || sessionMessages.length === 0) {
          console.log(`⚠️ No messages found for session ${session.id}, skipping`);
          continue;
        }

        const messages: Message[] = sessionMessages.map((msg: DatabaseMessage) => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at)
        }));

        // Generate intelligent data
        const autoTitle = generateIntelligentTitle(messages);
        const keywords = extractKeywords(messages);
        const summary = generateSummary(messages);

        // Update the session
        await supabase
          .from('chat_sessions')
          .update({ 
            auto_title: autoTitle,
            keywords: keywords,
            summary: summary,
            message_count: messages.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id)
          .eq('user_id', user.id);

        console.log(`✅ Backfilled title for session ${session.id}: "${autoTitle}"`);
      } catch (sessionError) {
        console.error(`❌ Error backfilling title for session ${session.id}:`, sessionError);
      }
    }

    console.log('🎉 Completed title backfill process');
  } catch (error) {
    console.error('❌ Error in backfill process:', error);
  }
};

export const updateChatWithIntelligentData = async (sessionId: string, messages: Message[]): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const autoTitle = generateIntelligentTitle(messages);
    const keywords = extractKeywords(messages);
    const summary = generateSummary(messages);

    await supabase
      .from('chat_sessions')
      .update({ 
        auto_title: autoTitle,
        keywords: keywords,
        summary: summary,
        message_count: messages.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    console.log(`📚 Updated chat ${sessionId} with intelligent data:`, { autoTitle, keywords, summary });
  } catch (error) {
    console.error('❌ Error updating chat with intelligent data:', error);
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
