import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import ChatTypingIndicator from './ChatTypingIndicator';
import { sendMessage, getChatHistory, clearChatHistory, type ChatMessage } from '../../services/chatbot.api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';


interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWindow({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const { user } = useAuth();
  const { isDark } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const initChat = async () => {
    setSessionId(crypto.randomUUID());
    
    if (user?.id) {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          // Add default init message at start if not present, though usually we can just show history
          setMessages(history.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          return;
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    }
    
    setMessages([{
      id: 'init',
      text: 'Hi! I am the WeDonate AI Assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }]);
  };

  const handleClearChat = async () => {
    if (user?.id) {
      try {
        await clearChatHistory();
      } catch (error) {
        console.error("Failed to clear chat history", error);
      }
    }
    setSessionId(crypto.randomUUID());
    setMessages([{
      id: 'init',
      text: 'Hi! I am the WeDonate AI Assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }]);
  };

  // Reset chat and close window when user changes (login/logout)
  useEffect(() => {
    initChat();
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle escape and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (windowRef.current && !windowRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSend = async (text: string) => {
    const newUserMsg: ChatMessage = { id: crypto.randomUUID(), text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendMessage(text, sessionId);
      const newBotMsg: ChatMessage = { id: crypto.randomUUID(), text: response.answer, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { id: crypto.randomUUID(), text: 'Sorry, I am having trouble connecting right now.', isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStarterQuestions = () => {
    if (!user) {
      return ["What is WeDonate?", "How do I create an account?", "How do donations work?"];
    }
    if (user.role === 'KEBELE_ADMIN') {
      return ["How do I verify a user?", "How do I create an assisted citizen?", "Which requests require my approval?"];
    }
    if (user.role === 'CITY_ADMIN') {
      return ["How do I approve an organization?", "How do I create a Kebele Admin?", "What approvals are waiting for me?"];
    }
    return ["How do I verify my account?", "Why can't I request support?", "Where is my support request?"];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={windowRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[550px] max-h-[calc(100vh-100px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden z-50',
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          )}
        >
          <ChatHeader onClose={onClose} onReset={handleClearChat} />
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {isLoading && <ChatTypingIndicator />}
            
            {/* Starter Questions (only show if few messages) */}
            {messages.length < 3 && !isLoading && (
              <div className="flex flex-wrap gap-2 mt-4">
                {getStarterQuestions().map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)}
                    className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors',
                      isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-green-200 text-green-700 hover:bg-green-50'
                    )}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
