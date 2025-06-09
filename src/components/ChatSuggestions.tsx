
import React from 'react';
import chatSuggestionsData from '@/data/chatSuggestions.json';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const ChatSuggestions = ({ onSuggestionClick }: ChatSuggestionsProps) => {
  return (
    <div className="px-4">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {chatSuggestionsData.suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group px-4 py-3 rounded-2xl border-2 border-secondary/30 bg-background hover:bg-secondary/10 hover:border-secondary/50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md text-left"
            >
              <span className="group-hover:scale-[1.02] transition-transform duration-200 inline-block text-foreground/80 group-hover:text-foreground">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>
        
        {/* Fifth suggestion centered below */}
        <div className="flex justify-center">
          <button
            onClick={() => onSuggestionClick(chatSuggestionsData.suggestions[4].text)}
            className="group px-4 py-3 rounded-2xl border-2 border-secondary/30 bg-background hover:bg-secondary/10 hover:border-secondary/50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <span className="group-hover:scale-[1.02] transition-transform duration-200 inline-block text-foreground/80 group-hover:text-foreground">
              {chatSuggestionsData.suggestions[4].text}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSuggestions;
