
import { getChatHistory, loadChatHistory, clearHistory, saveChatHistory } from './chatHistory';
import { createChatSession, saveMessageToDatabase } from './chatHistory';
import { supabase } from '@/integrations/supabase/client';

export const migrateLocalStorageToSupabase = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found, skipping migration');
      return false;
    }

    // Check if migration has already been done
    const migrationKey = `migration_completed_${user.id}`;
    if (localStorage.getItem(migrationKey)) {
      console.log('Migration already completed for this user');
      return true;
    }

    console.log('Starting localStorage to Supabase migration...');

    // Get old localStorage data
    const oldMessages = getChatHistory();
    const oldChatHistory = loadChatHistory();

    let migratedChats = 0;
    let migratedMessages = 0;

    // Migrate old chat history
    for (const chat of oldChatHistory) {
      try {
        // Create new chat session
        const sessionId = await createChatSession(chat.title);
        if (!sessionId) continue;

        // Migrate messages for this chat
        for (const message of chat.messages) {
          const success = await saveMessageToDatabase(
            sessionId,
            message.text,
            message.isUser,
            'text',
            {}
          );
          if (success) migratedMessages++;
        }

        // Generate intelligent title for the chat
        await supabase.rpc('generate_chat_title', { session_id: sessionId });
        migratedChats++;
      } catch (error) {
        console.error('Error migrating chat:', chat.id, error);
      }
    }

    // Migrate standalone messages (if any)
    if (oldMessages.length > 0 && oldChatHistory.length === 0) {
      try {
        const sessionId = await createChatSession('Migrated Chat');
        if (sessionId) {
          for (const message of oldMessages) {
            const success = await saveMessageToDatabase(
              sessionId,
              message.text,
              message.isUser,
              'text',
              {}
            );
            if (success) migratedMessages++;
          }
          await supabase.rpc('generate_chat_title', { session_id: sessionId });
          migratedChats++;
        }
      } catch (error) {
        console.error('Error migrating standalone messages:', error);
      }
    }

    console.log(`Migration completed: ${migratedChats} chats, ${migratedMessages} messages`);

    // Mark migration as completed
    localStorage.setItem(migrationKey, 'true');
    
    // Clean up old localStorage data
    clearHistory();
    saveChatHistory([]);

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

export const shouldRunMigration = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const migrationKey = `migration_completed_${user.id}`;
    const migrationCompleted = localStorage.getItem(migrationKey);
    
    // Check if there's old data to migrate
    const oldMessages = getChatHistory();
    const oldChatHistory = loadChatHistory();
    
    return !migrationCompleted && (oldMessages.length > 0 || oldChatHistory.length > 0);
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};
