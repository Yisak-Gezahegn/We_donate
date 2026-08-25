import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from './ChatWindow';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              aria-label="Ask WeDonate AI"
              className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center text-white transition-colors group relative"
            >
              <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
              
              {/* Optional unread indicator could go here */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
