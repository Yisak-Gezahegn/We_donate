import { type ChatMessage } from '../../services/chatbot.api';
import { cn } from '../../lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.isUser;
  
  return (
    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-green-600 text-white' : 'bg-amber-500 text-white')}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={cn('p-3 text-sm prose prose-sm dark:prose-invert max-w-none',
        isUser ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm' 
               : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm')}>
        <ReactMarkdown
          components={{
            p: ({node, ...props}) => <p className="m-0" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-200 underline" target="_blank" rel="noopener noreferrer" {...props} />,
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
