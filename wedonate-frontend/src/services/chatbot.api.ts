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

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  const response = await api.get('/chat');
  return response.data;
};

export const clearChatHistory = async (): Promise<void> => {
  await api.delete('/chat');
};
