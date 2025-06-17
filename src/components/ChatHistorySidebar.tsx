import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Interface defining the structure of chat history entries
 * Used for displaying and managing saved conversations
 */
interface ChatHistory {
  id: string;          // Unique identifier for the chat
  title: string;       // Display title (usually truncated first message)
  messages: any[];     // Array of messages in this chat
  createdAt: Date;     // When this chat was created
}

/**
 * Props interface for the ChatHistorySidebar component
 * Defines all callbacks and data needed for sidebar functionality
 */
interface ChatHistorySidebarProps {
  chatHistory: ChatHistory[];                    // Array of all saved chats
  currentChatId: string;                         // ID of currently active chat
  onNewChat: () => void;                         // Callback to start new chat
  onLoadChat: (chatId: string) => void;          // Callback to load specific chat
  onDeleteChats: (chatIds: string[]) => void;    // Callback to delete multiple chats
  onClearAllHistory: () => void;                 // Callback to clear all history
}

/**
 * ChatHistorySidebar Component
 * 
 * This component provides a sidebar interface for managing chat history.
 * It allows users to:
 * - Start new conversations
 * - Browse and load previous chats
 * - Delete individual or multiple chats
 * - Clear entire chat history
 * - Bulk select chats for operations
 * 
 * The sidebar is responsive and collapses on mobile devices.
 * Now fully supports dark mode with proper color schemes.
 */
const ChatHistorySidebar = ({ 
  chatHistory, 
  currentChatId, 
  onNewChat, 
  onLoadChat,
  onDeleteChats,
  onClearAllHistory
}: ChatHistorySidebarProps) => {
  // ============================
  // STATE MANAGEMENT
  // ============================
  
  /**
   * Hook to control mobile sidebar visibility
   */
  const { setOpenMobile } = useSidebar();
  
  /**
   * Set of currently selected chat IDs for bulk operations
   */
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  
  /**
   * Whether the sidebar is in selection mode for bulk operations
   */
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  /**
   * Controls visibility of delete confirmation dialog
   */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  /**
   * Controls visibility of clear all confirmation dialog
   */
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  
  /**
   * ID of single chat being deleted (when not in bulk mode)
   */
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // ============================
  // EVENT HANDLERS
  // ============================
  
  /**
   * Handles clicking on a chat item
   * Behavior depends on whether we're in selection mode or normal mode
   * @param chatId - The ID of the clicked chat
   */
  const handleChatSelect = (chatId: string) => {
    if (isSelectionMode) {
      // In selection mode: toggle selection state
      const newSelected = new Set(selectedChats);
      if (newSelected.has(chatId)) {
        newSelected.delete(chatId);
      } else {
        newSelected.add(chatId);
      }
      setSelectedChats(newSelected);
    } else {
      // Normal mode: load the chat and close mobile sidebar
      onLoadChat(chatId);
      setOpenMobile(false);
    }
  };

  /**
   * Handles creating a new chat
   * Resets selection state and closes mobile sidebar
   */
  const handleNewChat = () => {
    onNewChat();
    setOpenMobile(false);
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  /**
   * Initiates deletion of selected chats
   * Shows confirmation dialog if chats are selected
   */
  const handleDeleteSelected = () => {
    if (selectedChats.size > 0) {
      setDeleteDialogOpen(true);
    }
  };

  /**
   * Confirms and executes deletion of selected chats
   */
  const confirmDeleteSelected = () => {
    onDeleteChats(Array.from(selectedChats));
    setSelectedChats(new Set());
    setIsSelectionMode(false);
    setDeleteDialogOpen(false);
  };

  /**
   * Initiates deletion of a single chat
   * @param chatId - ID of chat to delete
   * @param e - Click event (to prevent propagation)
   */
  const handleDeleteSingle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering chat selection
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  /**
   * Confirms and executes deletion of single chat
   */
  const confirmDeleteSingle = () => {
    if (chatToDelete) {
      onDeleteChats([chatToDelete]);
      setChatToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  /**
   * Initiates clearing all chat history
   */
  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  /**
   * Confirms and executes clearing all history
   */
  const confirmClearAll = () => {
    onClearAllHistory();
    setClearAllDialogOpen(false);
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  /**
   * Toggles selection of all chats
   * If all are selected, deselects all; otherwise selects all
   */
  const toggleSelectAll = () => {
    if (selectedChats.size === chatHistory.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(chatHistory.map(chat => chat.id)));
    }
  };

  // ============================
  // RENDER
  // ============================
  
  return (
    <>
      {/* Main sidebar component with dark mode support */}
      <Sidebar side="left" className="border-r border-border bg-background/95 backdrop-blur-md">
        {/* Sidebar header with new chat button and controls */}
        <SidebarHeader className="p-4 bg-background/90 border-b border-border/30">
          {/* Primary new chat button with Jamaican gradient hover */}
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-3 h-12 bg-background hover:jamaican-gradient hover:text-white text-foreground border border-border shadow-sm mb-2 transition-all duration-200"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Chat</span>
          </Button>
          
          {/* Chat management controls - only shown if there are chats */}
          {chatHistory.length > 0 && (
            <div className="flex gap-2">
              {/* Options menu - only shown when not in selection mode */}
              {!isSelectionMode && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <Button 
                      onClick={handleClearAll}
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All History
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Toggle selection mode button */}
              <Button 
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className="justify-start gap-2 h-8 text-sm px-3"
                variant="ghost"
                size="sm"
              >
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Button>
              
              {/* Selection mode controls */}
              {isSelectionMode && (
                <>
                  {/* Select/Deselect all button */}
                  <Button 
                    onClick={toggleSelectAll}
                    className="justify-start gap-2 h-8 text-sm px-3"
                    variant="ghost"
                    size="sm"
                  >
                    {selectedChats.size === chatHistory.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  {/* Delete selected button - only shown when chats are selected */}
                  {selectedChats.size > 0 && (
                    <Button 
                      onClick={handleDeleteSelected}
                      className="h-8 px-2"
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </SidebarHeader>
        
        {/* Sidebar content with chat list - dark mode support */}
        <SidebarContent className="px-2 bg-background/90">
          <SidebarMenu>
            {chatHistory.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <div className="flex items-center gap-2 group">
                  {/* Checkbox for selection mode with dark mode styling */}
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedChats.has(chat.id)}
                      onChange={() => handleChatSelect(chat.id)}
                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                  )}
                  
                  {/* Main chat button with dark mode hover states */}
                  <SidebarMenuButton
                    onClick={() => handleChatSelect(chat.id)}
                    isActive={chat.id === currentChatId && !isSelectionMode}
                    className="flex-1 justify-start gap-3 py-3 px-3 text-left hover:bg-muted data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium"
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-sm">{chat.title}</span>
                  </SidebarMenuButton>
                  
                  {/* Individual delete button - only shown on hover and not in selection mode */}
                  {!isSelectionMode && (
                    <Button
                      onClick={(e) => handleDeleteSingle(chat.id, e)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        
        {/* Sidebar footer with app branding - dark mode support */}
        <SidebarFooter className="p-4 bg-background/90 border-t border-border/30">
          <div className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="text-lg font-bold">🇯🇲</span>
            <span className="font-bold jamaican-text-gradient">JamAI Chat</span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat{selectedChats.size > 1 || chatToDelete ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              {chatToDelete 
                ? "Are you sure you want to delete this chat? This action cannot be undone."
                : `Are you sure you want to delete ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={chatToDelete ? confirmDeleteSingle : confirmDeleteSelected}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Chat History?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all chat history? This will permanently remove all {chatHistory.length} chat{chatHistory.length !== 1 ? 's' : ''} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatHistorySidebar;
