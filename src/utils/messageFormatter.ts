
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
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
};

/**
 * Checks if a message contains asterisk formatting
 * @param text - The message text to check
 * @returns boolean indicating if asterisks are present
 */
export const hasAsteriskFormatting = (text: string): boolean => {
  return text.includes('*');
};
