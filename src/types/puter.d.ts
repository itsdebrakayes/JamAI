
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<string>;
      };
      print: (content: string) => void;
    };
  }
}

export {};
