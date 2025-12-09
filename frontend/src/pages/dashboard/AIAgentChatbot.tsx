import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useChatbot } from '../../context/ChatbotContext';
import agentLogo from '../../assets/agentlogo.png';
import { getGeminiResponse } from './services/geminiService';

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

const AIAgentChatbot: React.FC = () => {
  const { isOpen, toggleChatbot, closeChatbot } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      text: 'Hello! I am your Lok-Vaani AI assistant. How can I help you analyze the data today?',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const responseText = await getGeminiResponse(userText);
      const newAgentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newAgentMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: "I'm sorry, I'm having trouble connecting right now.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 right-0 h-full z-50 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col",
              "w-1/2" // Takes half the screen
            )}
          >
            {/* Header */}
            <div className="bg-blue-900 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 ">
                  <Bot className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Lok-Vaani AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-blue-100 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeChatbot}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white ">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                      msg.role === 'user'
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-200 dark:text-black border border-gray-200 dark:border-gray-300 rounded-bl-none"
                    )}
                  >
                    {msg.text}
                    <div className={cn(
                      "text-[10px] mt-1 opacity-70 text-right",
                      msg.role === 'user' ? "text-white" : "text-black"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start w-full"
                >
                  <div className="bg-white dark:bg-gray-200 p-4 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-300 shadow-sm flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-200 border-t border-gray-200 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about trends, sentiment, or summaries..."
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-white-800 border border-gray-400 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-black dark:text-black placeholder:text-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - Only visible when closed */}
      {!isOpen && (
        <>
          <div className="fixed bottom-0 left-0 w-full h-8 bg-gray-500/60 border-t border-gray-500/60 z-20" />
          <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50">
            <Tooltip title="Chat with AI Agent" arrow placement="top">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChatbot}
                className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] flex items-center justify-center transition-shadow duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden"
              >
                <img src={agentLogo} alt="AI Agent" className="w-full h-full object-cover" />
              </motion.button>
            </Tooltip>
          </div>
        </>
      )}
    </>
  );
};

export default AIAgentChatbot;
