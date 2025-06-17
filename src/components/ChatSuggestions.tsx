
import React from 'react';
import chatSuggestionsData from '@/data/chatSuggestions.json';

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const ChatSuggestions = ({ onSuggestionClick }: ChatSuggestionsProps) => {
  return (
    <div className="px-4">
      <div className="max-w-3xl mx-auto">
        {/* First row - 3 suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {chatSuggestionsData.suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group px-5 py-4 rounded-2xl border-2 border-secondary/30 bg-card/60 backdrop-blur-sm hover:bg-secondary/10 hover:border-secondary/60 transition-all duration-300 text-sm font-medium modern-shadow hover:modern-shadow-lg text-left hover:scale-[1.02]"
            >
              <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-200">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>
        
        {/* Second row - 3 suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {chatSuggestionsData.suggestions.slice(3, 6).map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="group px-5 py-4 rounded-2xl border-2 border-secondary/30 bg-card/60 backdrop-blur-sm hover:bg-secondary/10 hover:border-secondary/60 transition-all duration-300 text-sm font-medium modern-shadow hover:modern-shadow-lg text-left hover:scale-[1.02]"
            >
              <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-200">
                {suggestion.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSuggestions;
