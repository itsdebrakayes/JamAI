import React, { useState } from 'react';
import { 
  Image, 
  Search, 
  Globe, 
  FileText, 
  Code, 
  Calculator, 
  Languages, 
  Lightbulb,
  GraduationCap,
  Heart,
  ChefHat,
  Calendar,
  Menu
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
    title: "Generate image",
    description: "Create artwork, logos, or any visual",
    prompt: "Generate an image of "
  },
  {
    icon: Search,
    title: "Search the web",
    description: "Find current information online",
    prompt: "Search the web for "
  },
  {
    icon: Globe,
    title: "Deep web search", 
    description: "Comprehensive research and analysis",
    prompt: "Do a deep web search about "
  },
  {
    icon: FileText,
    title: "Write content",
    description: "Create articles, essays, or documents",
    prompt: "Write "
  },
  {
    icon: Code,
    title: "Code assistance",
    description: "Help with programming and debugging",
    prompt: "Help me code "
  },
  {
    icon: Calculator,
    title: "Solve math",
    description: "Calculate and solve equations",
    prompt: "Calculate "
  },
  {
    icon: Languages,
    title: "Translate",
    description: "Translate between languages",
    prompt: "Translate "
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    description: "Generate creative solutions",
    prompt: "Brainstorm ideas for "
  },
  {
    icon: GraduationCap,
    title: "Teach me Patois",
    description: "Learn Jamaican Patois phrases",
    prompt: "Teach me Patois about "
  },
  {
    icon: Heart,
    title: "Jamaican proverbs",
    description: "Share wisdom through proverbs",
    prompt: "Tell me a Jamaican proverb about "
  },
  {
    icon: ChefHat,
    title: "Jamaican recipes",
    description: "Cook authentic Jamaican dishes",
    prompt: "Give me a Jamaican recipe for "
  },
  {
    icon: Calendar,
    title: "Cultural events",
    description: "Upcoming festivals and events",
    prompt: "Tell me about Jamaican events related to "
  }
];

const ToolsDropdown = ({ onToolSelect, disabled }: ToolsDropdownProps) => {
  const getItemColor = (index: number) => {
    const colors = ['text-black', 'text-green-600', 'text-yellow-500'];
    return colors[index % 3];
  };
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
          <Menu className="w-5 h-5" />
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
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center`}>
              <tool.icon className={`w-4 h-4 ${getItemColor(index)}`} />
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