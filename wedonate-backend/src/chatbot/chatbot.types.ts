export type RoleScope = 'GENERAL' | 'USER' | 'KEBELE_ADMIN' | 'CITY_ADMIN' | 'UNAUTHENTICATED';

export interface KnowledgeDocumentInput {
  name: string;
  content: string;
  roleScope: RoleScope;
}

export interface KnowledgeChunkInput {
  documentName: string;
  section: string;
  content: string;
  roleScope: RoleScope;
}

export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
}

export interface ChatMessageResponse {
  answer: string;
  sessionId: string;
  sources: string[];
}
