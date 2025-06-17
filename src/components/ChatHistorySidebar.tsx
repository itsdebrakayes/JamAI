
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

interface ChatHistory {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
}

interface ChatHistorySidebarProps {
  chatHistory: ChatHistory[];
  currentChatId: string;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChats: (chatIds: string[]) => void;
  onClearAllHistory: () => void;
}

const ChatHistorySidebar = ({ 
  chatHistory, 
  currentChatId, 
  onNewChat, 
  onLoadChat,
  onDeleteChats,
  onClearAllHistory
}: ChatHistorySidebarProps) => {
  const { setOpenMobile } = useSidebar();
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedChats);
      if (newSelected.has(chatId)) {
        newSelected.delete(chatId);
      } else {
        newSelected.add(chatId);
      }
      setSelectedChats(newSelected);
    } else {
      onLoadChat(chatId);
      setOpenMobile(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    setOpenMobile(false);
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedChats.size > 0) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteSelected = () => {
    onDeleteChats(Array.from(selectedChats));
    setSelectedChats(new Set());
    setIsSelectionMode(false);
    setDeleteDialogOpen(false);
  };

  const handleDeleteSingle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSingle = () => {
    if (chatToDelete) {
      onDeleteChats([chatToDelete]);
      setChatToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    onClearAllHistory();
    setClearAllDialogOpen(false);
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedChats.size === chatHistory.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(chatHistory.map(chat => chat.id)));
    }
  };

  return (
    <>
      <Sidebar side="left" className="border-r bg-white/95 backdrop-blur-md">
        <SidebarHeader className="p-4 bg-white/90 border-b border-border/30">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-3 h-12 bg-white hover:bg-gray-50 text-foreground border border-border shadow-sm mb-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Chat</span>
          </Button>
          
          {chatHistory.length > 0 && (
            <div className="flex gap-2">
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
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All History
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </SidebarHeader>
        
        <SidebarContent className="px-2 bg-white/90">
          <SidebarMenu>
            {chatHistory.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <div className="flex items-center gap-2 group">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedChats.has(chat.id)}
                      onChange={() => handleChatSelect(chat.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  )}
                  
                  <SidebarMenuButton
                    onClick={() => handleChatSelect(chat.id)}
                    isActive={chat.id === currentChatId && !isSelectionMode}
                    className="flex-1 justify-start gap-3 py-3 px-3 text-left hover:bg-gray-100 data-[active=true]:bg-gray-200 data-[active=true]:font-medium"
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-sm">{chat.title}</span>
                  </SidebarMenuButton>
                  
                  {!isSelectionMode && (
                    <Button
                      onClick={(e) => handleDeleteSingle(chat.id, e)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 bg-white/90 border-t border-border/30">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <span className="text-2xl">🇯🇲</span>
            <span className="font-medium">JamAI Chat</span>
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
              className="bg-red-600 hover:bg-red-700"
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
              className="bg-red-600 hover:bg-red-700"
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
