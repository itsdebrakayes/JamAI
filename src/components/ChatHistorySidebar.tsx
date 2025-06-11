
import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
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
}

const ChatHistorySidebar = ({ 
  chatHistory, 
  currentChatId, 
  onNewChat, 
  onLoadChat 
}: ChatHistorySidebarProps) => {
  const { setOpenMobile } = useSidebar();

  const handleChatSelect = (chatId: string) => {
    onLoadChat(chatId);
    setOpenMobile(false); // Close sidebar on mobile after selection
  };

  const handleNewChat = () => {
    onNewChat();
    setOpenMobile(false); // Close sidebar on mobile after creating new chat
  };

  return (
    <Sidebar side="left" className="border-r">
      <SidebarHeader className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-3 h-12 bg-card hover:bg-accent text-foreground border border-border"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Chat</span>
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarMenu>
          {chatHistory.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                onClick={() => handleChatSelect(chat.id)}
                isActive={chat.id === currentChatId}
                className="w-full justify-start gap-3 py-3 px-3 text-left"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <span className="text-2xl">🇯🇦</span>
          <span className="font-medium">JamAI Chat</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ChatHistorySidebar;
