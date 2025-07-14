
import React from 'react';

/**
 * Formats AI messages to display text between asterisks as bold
 * @param text - The original message text
 * @returns JSX elements with proper formatting
 */
export const formatMessageWithBold = (text: string): React.ReactNode => {
  // Split text by asterisks and format alternating segments as bold
  const parts = text.split('*');
  
  return parts.map((part, index) => {
    // Every odd index (1, 3, 5...) should be bold
    if (index % 2 === 1) {
      return React.createElement('strong', { key: index }, part);
    }
    return part;
  });
};

/**
 * Checks if a message contains markdown formatting
 * @param text - The message text to check
 * @returns boolean indicating if markdown formatting is present
 */
export const hasMarkdownFormatting = (text: string): boolean => {
  // Check for various markdown patterns
  const markdownPatterns = [
    /\*\*.*?\*\*/,     // Bold **text**
    /\*.*?\*/,         // Italic *text*
    /`.*?`/,           // Inline code `code`
    /```[\s\S]*?```/,  // Code blocks ```code```
    /^#{1,6}\s/m,      // Headers # ## ###
    /^\* /m,           // Lists * item
    /^\d+\. /m,        // Numbered lists 1. item
    /\[.*?\]\(.*?\)/,  // Links [text](url)
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

/**
 * Legacy function for backward compatibility
 * @param text - The message text to check
 * @returns boolean indicating if asterisks are present
 */
export const hasAsteriskFormatting = (text: string): boolean => {
  return hasMarkdownFormatting(text);
};
