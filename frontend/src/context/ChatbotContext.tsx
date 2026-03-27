import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatbotContextType {
  isOpen: boolean;
  toggleChatbot: () => void;
  closeChatbot: () => void;
  openChatbot: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => setIsOpen(prev => !prev);
  const closeChatbot = () => setIsOpen(false);
  const openChatbot = () => setIsOpen(true);

  return (
    <ChatbotContext.Provider value={{ isOpen, toggleChatbot, closeChatbot, openChatbot }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
