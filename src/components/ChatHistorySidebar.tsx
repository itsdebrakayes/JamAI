
import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { groupChatsByTime } from '@/utils/chatGrouping';

// Import the ChatHistory type from chatHistory.ts
type ChatHistory = {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
};

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
  onRenameChat?: (chatId: string, newTitle: string) => void; // Callback to rename chat
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
 * - Rename chats via right-click context menu
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
  onClearAllHistory,
  onRenameChat
}: ChatHistorySidebarProps) => {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  
  // Group chats by time periods
  const groupedChats = groupChatsByTime(chatHistory);
  
  console.log('📊 ChatHistorySidebar render:', {
    totalChats: chatHistory.length,
    groupedChats: groupedChats.map(g => ({ label: g.label, count: g.chats.length })),
    sampleTitles: chatHistory.slice(0, 3).map(c => ({ 
      id: c.id, 
      title: c.title, 
      autoTitle: c.autoTitle,
      displayTitle: c.autoTitle || c.title 
    }))
  });

  // ============================
  // STATE MANAGEMENT
  // ============================
  
  /**
   * Hook to control mobile sidebar visibility
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

  /**
   * Rename dialog state
   */
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

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

  /**
   * Initiates renaming of a chat
   */
  const handleRenameChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setChatToRename(chatId);
      setNewChatTitle(getDisplayTitle(chat));
      setRenameDialogOpen(true);
    }
  };

  /**
   * Confirms and executes chat rename
   */
  const confirmRename = () => {
    if (chatToRename && newChatTitle.trim() && onRenameChat) {
      onRenameChat(chatToRename, newChatTitle.trim());
      setRenameDialogOpen(false);
      setChatToRename(null);
      setNewChatTitle('');
    }
  };

  /**
   * Cancels chat rename
   */
  const cancelRename = () => {
    setRenameDialogOpen(false);
    setChatToRename(null);
    setNewChatTitle('');
  };

  // Helper function to get display title for a chat
  const getDisplayTitle = (chat: ChatHistory) => {
    // Prefer autoTitle over title for intelligent naming
    return chat.autoTitle || chat.title || 'New Chat';
  };

  // ============================
  // RENDER
  // ============================
  
  if (isMobile) {
    return (
      <>
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="pb-4">
              <DrawerTitle className="text-left flex items-center gap-2">
                <span className="text-lg font-bold">🇯🇲</span>
                <span className="font-bold jamaican-text-gradient">JamAI Chat</span>
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col px-4">
              {/* New chat button */}
              <DrawerClose asChild>
                <Button 
                  onClick={handleNewChat}
                  className="w-full justify-start gap-3 h-12 bg-background hover:jamaican-gradient hover:text-white text-foreground border border-border shadow-sm mb-4 transition-all duration-200"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">New Chat</span>
                </Button>
              </DrawerClose>

              {/* Chat management controls */}
              {chatHistory.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {!isSelectionMode && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48" align="start">
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
                  
                  <Button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className="justify-start gap-2 h-8 text-sm px-3"
                    variant="ghost"
                    size="sm"
                  >
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </Button>
                  
                  {isSelectionMode && (
                    <>
                      <Button 
                        onClick={toggleSelectAll}
                        className="justify-start gap-2 h-8 text-sm px-3"
                        variant="ghost"
                        size="sm"
                      >
                        {selectedChats.size === chatHistory.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      
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

              {/* Grouped chat list */}
              <div className="flex-1 overflow-y-auto">
                {groupedChats.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedChats.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <h3 className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded sticky top-0 z-10">
                          {group.label} ({group.chats.length})
                        </h3>
                        <div className="space-y-1">
                          {group.chats.map((chat) => (
                            <ContextMenu key={chat.id}>
                              <ContextMenuTrigger asChild>
                                <div className="flex items-center gap-2 group">
                                  {isSelectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedChats.has(chat.id)}
                                      onChange={() => handleChatSelect(chat.id)}
                                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                                    />
                                  )}
                                  
                                  <DrawerClose asChild>
                                    <button
                                      onClick={() => handleChatSelect(chat.id)}
                                      className={`flex-1 justify-start gap-3 py-2 px-3 text-left hover:bg-muted rounded-lg transition-colors ${
                                        chat.id === currentChatId && !isSelectionMode ? 'bg-accent text-accent-foreground font-medium' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate text-sm">{getDisplayTitle(chat)}</span>
                                      </div>
                                    </button>
                                  </DrawerClose>
                                  
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
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => handleRenameChat(chat.id)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Rename
                                </ContextMenuItem>
                                <ContextMenuItem 
                                  onClick={() => handleDeleteSingle(chat.id, {} as React.MouseEvent)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

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

        {/* Rename dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
              <DialogDescription>
                Enter a new name for this chat.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Chat title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmRename();
                }
                if (e.key === 'Escape') {
                  cancelRename();
                }
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={cancelRename}>
                Cancel
              </Button>
              <Button onClick={confirmRename} disabled={!newChatTitle.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      <Sidebar side="left" className="border-r border-border bg-background/95 backdrop-blur-md">
        {/* Sidebar header with new chat button and controls */}
        <SidebarHeader className="p-4 bg-background/90 border-b border-border/30">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-3 h-12 bg-background hover:jamaican-gradient hover:text-white text-foreground border border-border shadow-sm mb-2 transition-all duration-200"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Chat</span>
          </Button>
          
          {chatHistory.length > 0 && (
            <div className="flex gap-2">
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
              
              <Button 
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className="justify-start gap-2 h-8 text-sm px-3"
                variant="ghost"
                size="sm"
              >
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Button>
              
              {isSelectionMode && (
                <>
                  <Button 
                    onClick={toggleSelectAll}
                    className="justify-start gap-2 h-8 text-sm px-3"
                    variant="ghost"
                    size="sm"
                  >
                    {selectedChats.size === chatHistory.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
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
        
        {/* Sidebar content with chat list */}
        <SidebarContent className="px-2 bg-background/90">
          {groupedChats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedChats.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground px-3 py-1 bg-muted/50 rounded sticky top-0 z-10">
                    {group.label} ({group.chats.length})
                  </h3>
                  <SidebarMenu>
                    {group.chats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <div className="flex items-center gap-2 group">
                              {isSelectionMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedChats.has(chat.id)}
                                  onChange={() => handleChatSelect(chat.id)}
                                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                                />
                              )}
                              
                              <SidebarMenuButton
                                onClick={() => handleChatSelect(chat.id)}
                                isActive={chat.id === currentChatId && !isSelectionMode}
                                className="flex-1 justify-start gap-3 py-3 px-3 text-left hover:bg-muted data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium"
                              >
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-sm">{getDisplayTitle(chat)}</span>
                              </SidebarMenuButton>
                              
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
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleRenameChat(chat.id)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Rename
                            </ContextMenuItem>
                            <ContextMenuItem 
                              onClick={() => handleDeleteSingle(chat.id, {} as React.MouseEvent)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              ))}
            </div>
          )}
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

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this chat.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Chat title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmRename();
              }
              if (e.key === 'Escape') {
                cancelRename();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={cancelRename}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!newChatTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHistorySidebar;
