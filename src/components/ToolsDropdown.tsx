import React from 'react';
import { 
  Image, 
  Eye, 
  Mic, 
  GraduationCap, 
  Heart, 
  Brain, 
  ChefHat, 
  Cloud, 
  Calendar 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ToolsDropdownProps {
  onToolSelect: (toolPrompt: string) => void;
  disabled?: boolean;
}

const tools = [
  {
    icon: Image,
    title: "Create an image",
    description: "Generate artwork, logos, or any visual",
    prompt: "Create an image for me"
  },
  {
    icon: Eye,
    title: "Analyze image",
    description: "Upload and analyze any image",
    prompt: "Help me analyze an image"
  },
  {
    icon: Mic,
    title: "Voice chat",
    description: "Have a conversation using voice",
    prompt: "Let's have a voice conversation"
  },
  {
    icon: GraduationCap,
    title: "Teach me Patois",
    description: "Learn Jamaican Patois phrases",
    prompt: "Teach me some Jamaican Patois"
  },
  {
    icon: Heart,
    title: "Jamaican proverbs",
    description: "Share wisdom through proverbs",
    prompt: "Tell me a Jamaican proverb and explain its meaning"
  },
  {
    icon: Brain,
    title: "Cultural quiz",
    description: "Test your knowledge of Jamaica",
    prompt: "Give me a quiz about Jamaican culture"
  },
  {
    icon: ChefHat,
    title: "Jamaican recipes",
    description: "Cook authentic Jamaican dishes",
    prompt: "Teach me how to cook a traditional Jamaican dish"
  },
  {
    icon: Cloud,
    title: "Weather in Jamaica",
    description: "Current weather conditions",
    prompt: "What's the weather like in Jamaica today?"
  },
  {
    icon: Calendar,
    title: "Cultural events",
    description: "Upcoming festivals and events",
    prompt: "Tell me about upcoming Jamaican cultural events"
  }
];

const ToolsDropdown = ({ onToolSelect, disabled }: ToolsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          className="h-10 w-10 rounded-2xl hover:bg-muted/50 transition-all duration-200"
        >
          <span className="text-lg">⚒️</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        side="top" 
        align="start" 
        className="w-80 bg-background border shadow-lg max-h-[400px] overflow-y-auto"
      >
        <div className="p-2 border-b">
          <h3 className="text-sm font-semibold text-foreground">JamAI Tools</h3>
          <p className="text-xs text-muted-foreground">Choose a tool to get started</p>
        </div>
        
        {tools.map((tool, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onToolSelect(tool.prompt)}
            className="cursor-pointer hover:bg-muted/50 p-3 flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <tool.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{tool.title}</div>
              <div className="text-xs text-muted-foreground">{tool.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ToolsDropdown;