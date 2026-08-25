import api from '../lib/api';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const sendMessage = async (message: string, sessionId?: string): Promise<{ answer: string, sessionId: string }> => {
  const response = await api.post('/chat', { message, sessionId });
  return response.data;
};
