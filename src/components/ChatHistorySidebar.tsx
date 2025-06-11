
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
    <Sidebar side="left" className="border-r bg-white/95 backdrop-blur-md">
      <SidebarHeader className="p-4 bg-white/90 border-b border-border/30">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-3 h-12 bg-white hover:bg-gray-50 text-foreground border border-border shadow-sm"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Chat</span>
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="px-2 bg-white/90">
        <SidebarMenu>
          {chatHistory.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                onClick={() => handleChatSelect(chat.id)}
                isActive={chat.id === currentChatId}
                className="w-full justify-start gap-3 py-3 px-3 text-left hover:bg-gray-100 data-[active=true]:bg-gray-200 data-[active=true]:font-medium"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </SidebarMenuButton>
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
  );
};

export default ChatHistorySidebar;
