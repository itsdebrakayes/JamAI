
import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3 mr-4 shadow-lg">
        <div className="flex items-center space-x-1">
          <span className="text-sm opacity-70">AI a type...</span>
          <div className="flex space-x-1 ml-2">
            <div className="w-2 h-2 bg-current rounded-full typing-dot opacity-60"></div>
            <div className="w-2 h-2 bg-current rounded-full typing-dot opacity-60"></div>
            <div className="w-2 h-2 bg-current rounded-full typing-dot opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
