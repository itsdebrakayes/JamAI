
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

    console.log('Starting localStorage to Supabase migration...');

    // Get old localStorage data
    const oldMessages = getChatHistory();
    const oldChatHistory = loadChatHistory();

    let migratedChats = 0;
    let migratedMessages = 0;

    console.log(`Found ${oldChatHistory.length} chat histories and ${oldMessages.length} standalone messages`);

    // Migrate old chat history first
    for (const chat of oldChatHistory) {
      try {
        console.log(`Migrating chat: ${chat.title} with ${chat.messages.length} messages`);
        
        // Create new chat session
        const sessionId = await createChatSession(chat.title);
        if (!sessionId) {
          console.error('Failed to create session for chat:', chat.title);
          continue;
        }

        // Migrate messages for this chat in order
        for (const message of chat.messages) {
          const success = await saveMessageToDatabase(
            sessionId,
            message.text,
            message.isUser,
            'text',
            { migrated: true, originalTimestamp: message.timestamp.toISOString() }
          );
          if (success) {
            migratedMessages++;
          } else {
            console.warn('Failed to save message:', message.id);
          }
        }

        // Update session with intelligent title if available
        if (chat.autoTitle) {
          await supabase
            .from('chat_sessions')
            .update({ 
              auto_title: chat.autoTitle,
              keywords: chat.keywords || [],
              summary: chat.summary || null,
              message_count: chat.messages.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);
        }

        migratedChats++;
        console.log(`✅ Migrated chat: ${chat.title}`);
      } catch (error) {
        console.error('Error migrating chat:', chat.id, error);
      }
    }

    // Migrate standalone messages (if any exist without being part of chat history)
    if (oldMessages.length > 0 && oldChatHistory.length === 0) {
      try {
        console.log(`Migrating ${oldMessages.length} standalone messages`);
        const sessionId = await createChatSession('Migrated Chat');
        if (sessionId) {
          for (const message of oldMessages) {
            const success = await saveMessageToDatabase(
              sessionId,
              message.text,
              message.isUser,
              'text',
              { migrated: true, originalTimestamp: message.timestamp.toISOString() }
            );
            if (success) migratedMessages++;
          }
          migratedChats++;
        }
      } catch (error) {
        console.error('Error migrating standalone messages:', error);
      }
    }

    console.log(`✅ Migration completed: ${migratedChats} chats, ${migratedMessages} messages`);

    // Mark migration as completed ONLY after successful migration
    if (migratedChats > 0 || migratedMessages > 0) {
      const migrationKey = `migration_completed_${user.id}`;
      localStorage.setItem(migrationKey, 'true');
      
      // Clean up old localStorage data
      clearHistory();
      saveChatHistory([]);
      
      console.log('🧹 Cleaned up localStorage data after successful migration');
    }

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
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
    
    const hasDataToMigrate = oldMessages.length > 0 || oldChatHistory.length > 0;
    
    console.log(`Migration check: completed=${!!migrationCompleted}, hasData=${hasDataToMigrate}`);
    
    return !migrationCompleted && hasDataToMigrate;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

// Force migration for cases where data was accidentally stored in localStorage
export const forceMigration = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found, cannot force migration');
      return false;
    }

    // Temporarily remove migration completion flag
    const migrationKey = `migration_completed_${user.id}`;
    const wasCompleted = localStorage.getItem(migrationKey);
    localStorage.removeItem(migrationKey);

    console.log('🔄 Force migrating all localStorage data...');
    
    const result = await migrateLocalStorageToSupabase();
    
    // Restore completion flag if migration fails and it was previously completed
    if (!result && wasCompleted) {
      localStorage.setItem(migrationKey, wasCompleted);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Force migration failed:', error);
    return false;
  }
};
