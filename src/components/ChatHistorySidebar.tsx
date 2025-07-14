import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerHeader, DrawerClose } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  MoreVertical, 
  Edit2, 
  Clock 
} from 'lucide-react';

// ============================
// TYPE DEFINITIONS
// ============================

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPatois?: boolean;
}

type ChatHistory = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  autoTitle?: string;
  keywords?: string[];
  summary?: string;
};

interface ChatHistorySidebarProps {
  chatHistory: ChatHistory[];
  currentChatId: string;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChats: (chatIds: string[]) => void;
  onClearAllHistory: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

// ============================
// UTILITY FUNCTIONS
// ============================

const groupChatsByDate = (chats: ChatHistory[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { period: string; chats: ChatHistory[] }[] = [];
  
  const todayChats = chats.filter(chat => chat.createdAt >= today);
  const yesterdayChats = chats.filter(chat => chat.createdAt >= yesterday && chat.createdAt < today);
  const lastWeekChats = chats.filter(chat => chat.createdAt >= lastWeek && chat.createdAt < yesterday);
  const lastMonthChats = chats.filter(chat => chat.createdAt >= lastMonth && chat.createdAt < lastWeek);
  const olderChats = chats.filter(chat => chat.createdAt < lastMonth);

  if (todayChats.length > 0) groups.push({ period: 'Today', chats: todayChats });
  if (yesterdayChats.length > 0) groups.push({ period: 'Yesterday', chats: yesterdayChats });
  if (lastWeekChats.length > 0) groups.push({ period: 'Last 7 days', chats: lastWeekChats });
  if (lastMonthChats.length > 0) groups.push({ period: 'Last 30 days', chats: lastMonthChats });
  if (olderChats.length > 0) groups.push({ period: 'Older', chats: olderChats });

  return groups;
};

// ============================
// MAIN COMPONENT
// ============================

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  chatHistory,
  currentChatId,
  onNewChat,
  onLoadChat,
  onDeleteChats,
  onClearAllHistory,
  onRenameChat,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // ============================
  // STATE MANAGEMENT
  // ============================
  
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

  // ============================
  // COMPUTED VALUES
  // ============================
  
  const groupedChats = groupChatsByDate(chatHistory);

  // ============================
  // EVENT HANDLERS AND HELPER FUNCTIONS
  // ============================

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
    }
  };

  const handleNewChat = () => {
    onNewChat();
    // Reset selection mode when starting a new chat
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedChats.size > 0) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteSelected = async () => {
    await onDeleteChats(Array.from(selectedChats));
    setSelectedChats(new Set());
    setIsSelectionMode(false);
    setDeleteDialogOpen(false);
  };

  const handleDeleteSingle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSingle = async () => {
    if (chatToDelete) {
      await onDeleteChats([chatToDelete]);
      setChatToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = async () => {
    await onClearAllHistory();
    setSelectedChats(new Set());
    setIsSelectionMode(false);
    setClearAllDialogOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedChats.size === chatHistory.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(chatHistory.map(chat => chat.id)));
    }
  };

  const handleRenameChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setChatToRename(chatId);
      setNewChatTitle(getDisplayTitle(chat));
      setRenameDialogOpen(true);
    }
  };

  const confirmRename = async () => {
    if (chatToRename && newChatTitle.trim()) {
      await onRenameChat(chatToRename, newChatTitle.trim());
      cancelRename();
    }
  };

  const cancelRename = () => {
    setChatToRename(null);
    setNewChatTitle('');
    setRenameDialogOpen(false);
  };

  const getDisplayTitle = (chat: ChatHistory): string => {
    // Use the current title (which gets updated by rename), fallback to autoTitle, then 'New Chat'
    return chat.title || chat.autoTitle || 'New Chat';
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
          <DrawerContent className="h-[85vh] flex flex-col">
            <DrawerHeader className="pb-4 flex-shrink-0">
              <DrawerTitle className="text-left flex items-center gap-2">
                <span className="text-lg font-bold">🇯🇲</span>
                <span className="font-bold jamaican-text-gradient">JamAI Chat</span>
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col px-4 min-h-0">
              {/* New chat button */}
              <DrawerClose asChild>
                <Button 
                  onClick={handleNewChat}
                  className="w-full justify-start gap-3 h-12 bg-background hover:jamaican-gradient hover:text-white text-foreground border border-border shadow-sm mb-4 transition-all duration-200 flex-shrink-0"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">New Chat</span>
                </Button>
              </DrawerClose>

              {/* Chat management controls */}
              {chatHistory.length > 0 && (
                <div className="flex gap-2 mb-4 flex-shrink-0">
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

              {/* Chat list - scrollable middle section */}
              <div className="flex-1 overflow-y-auto bg-background/90 min-h-0">
                {groupedChats.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chat history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedChats.map((group) => (
                      <div key={group.period} className="space-y-2">
                        <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
                          {group.period}
                        </h3>
                        <div className="space-y-1">
                          {group.chats.map((chat) => (
                            <ContextMenu key={chat.id}>
                              <ContextMenuTrigger asChild>
                                <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/80 cursor-pointer transition-colors group">
                                  {isSelectionMode && (
                                    <Checkbox
                                      checked={selectedChats.has(chat.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(selectedChats);
                                        if (checked) {
                                          newSelected.add(chat.id);
                                        } else {
                                          newSelected.delete(chat.id);
                                        }
                                        setSelectedChats(newSelected);
                                      }}
                                    />
                                  )}
                                  
                                  <DrawerClose asChild>
                                    <div 
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => handleChatSelect(chat.id)}
                                    >
                                      <p className={`text-sm font-medium truncate transition-colors duration-200 ${
                                        currentChatId === chat.id 
                                          ? 'text-primary font-semibold' 
                                          : 'text-foreground hover:text-primary'
                                      }`}>
                                        {getDisplayTitle(chat)}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">
                                          {chat.createdAt.toLocaleDateString()}
                                        </p>
                                        {chat.keywords && chat.keywords.length > 0 && (
                                          <div className="flex gap-1 ml-auto">
                                            {chat.keywords.slice(0, 2).map((keyword, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                {keyword}
                                              </Badge>
                                            ))}
                                            {chat.keywords.length > 2 && (
                                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                +{chat.keywords.length - 2}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </DrawerClose>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isSelectionMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={(e) => handleDeleteSingle(chat.id, e)}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </Button>
                                    )}
                                  </div>
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

              {/* Fixed footer at bottom - separate from scrollable content */}
              <div className="p-4 bg-background/90 border-t border-border/30 flex-shrink-0">
                <div className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="text-lg font-bold">🇯🇲</span>
                  <span className="font-bold jamaican-text-gradient">JamAI Chat</span>
                </div>
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
                  e.preventDefault();
                  cancelRename();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={cancelRename}>
                Cancel
              </Button>
              <Button onClick={confirmRename} disabled={!newChatTitle.trim()}>
                Rename
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop version
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  return (
    <>
      <Sidebar className="border-r border-border bg-background/95 backdrop-blur-md" collapsible="icon">
        <SidebarHeader className="p-4">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-3 h-12 bg-background hover:jamaican-gradient hover:text-white text-foreground border border-border shadow-sm transition-all duration-200"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span className="font-medium">New Chat</span>}
          </Button>
          
          {!collapsed && chatHistory.length > 0 && (
            <div className="flex gap-2 mt-2">
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
        
        <SidebarContent className="overflow-y-auto">
          {groupedChats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {!collapsed && <p className="text-sm">No chat history yet</p>}
            </div>
          ) : (
            <div className="space-y-4 px-2">
              {groupedChats.map((group) => (
                <SidebarGroup key={group.period}>
                  {!collapsed && (
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
                      {group.period}
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.chats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div className="flex items-center gap-2 w-full group">
                                {!collapsed && isSelectionMode && (
                                  <Checkbox
                                    checked={selectedChats.has(chat.id)}
                                    onCheckedChange={(checked) => {
                                      const newSelected = new Set(selectedChats);
                                      if (checked) {
                                        newSelected.add(chat.id);
                                      } else {
                                        newSelected.delete(chat.id);
                                      }
                                      setSelectedChats(newSelected);
                                    }}
                                  />
                                )}
                                
                                <SidebarMenuButton
                                  isActive={currentChatId === chat.id}
                                  onClick={() => handleChatSelect(chat.id)}
                                  className="flex-1 justify-start"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {getDisplayTitle(chat)}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">
                                          {chat.createdAt.toLocaleDateString()}
                                        </p>
                                        {chat.keywords && chat.keywords.length > 0 && (
                                          <div className="flex gap-1 ml-auto">
                                            {chat.keywords.slice(0, 1).map((keyword, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                {keyword}
                                              </Badge>
                                            ))}
                                            {chat.keywords.length > 1 && (
                                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                +{chat.keywords.length - 1}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </SidebarMenuButton>
                                
                                {!collapsed && !isSelectionMode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleDeleteSingle(chat.id, e)}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
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
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </div>
          )}
        </SidebarContent>
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
                e.preventDefault();
                cancelRename();
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelRename}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!newChatTitle.trim()}>
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHistorySidebar;