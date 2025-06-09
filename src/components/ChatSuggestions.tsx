
import React from 'react';
import chatSuggestionsData from '@/data/chatSuggestions.json';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const ChatSuggestions = ({ onSuggestionClick }: ChatSuggestionsProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-muted-foreground mb-2">
          Not sure where to start? Try these:
        </h2>
      </div>
      
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {chatSuggestionsData.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="group px-4 py-3 rounded-full border-2 border-secondary bg-card text-card-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <span className="group-hover:scale-105 transition-transform duration-200 inline-block">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSuggestions;
