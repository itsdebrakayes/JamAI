
import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent text-secondary-foreground flex items-center justify-center text-lg font-medium modern-shadow overflow-hidden">
            <img 
              src="/lovable-uploads/f7360586-ff1c-4d5e-b846-feaceed45e61.png" 
              alt="JamAI Logo" 
              className="w-18 h-18 object-contain"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl px-5 py-4 modern-shadow border border-secondary/20 inline-block">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">AI a type...</span>
              <div className="flex space-x-1 ml-2">
                <div className="w-2 h-2 bg-secondary rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-secondary rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-secondary rounded-full typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
