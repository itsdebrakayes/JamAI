import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface SuggestionDropdownProps {
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
}

const SuggestionDropdown = ({ suggestions, onSuggestionSelect, disabled }: SuggestionDropdownProps) => {
  if (suggestions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 text-xs border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all duration-200"
        >
          <ChevronDown className="w-3 h-3 mr-1" />
          Add more
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        side="top" 
        align="start" 
        className="w-60 bg-background border shadow-lg"
      >
        {suggestions.map((suggestion, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSuggestionSelect(suggestion)}
            className="cursor-pointer hover:bg-muted/50 text-sm"
          >
            {suggestion}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SuggestionDropdown;