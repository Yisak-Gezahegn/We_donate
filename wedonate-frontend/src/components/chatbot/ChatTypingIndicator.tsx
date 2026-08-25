import { motion } from 'framer-motion';

export default function ChatTypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 p-3 bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm w-fit">
      <motion.div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-400 rounded-full"
        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
      <motion.div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-400 rounded-full"
        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
      <motion.div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-400 rounded-full"
        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
    </div>
  );
}
