import fs from 'fs';
import path from 'path';
import { KnowledgeDocumentInput, RoleScope } from '../chatbot.types';

export function loadKnowledgeDocuments(): KnowledgeDocumentInput[] {
  // We need to resolve the path relative to the backend execution context.
  // Assuming this script runs from the wedonate-backend root.
  const docsDir = path.join(process.cwd(), '../docs/ai-knowledge');
  
  if (!fs.existsSync(docsDir)) {
    throw new Error(`Knowledge base directory not found at ${docsDir}`);
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
  
  const documents: KnowledgeDocumentInput[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    
    // Determine RoleScope based on filename
    let roleScope: RoleScope = 'GENERAL';
    if (file.includes('user-guide')) roleScope = 'USER';
    else if (file.includes('kebele-admin-guide')) roleScope = 'KEBELE_ADMIN';
    else if (file.includes('city-admin-guide')) roleScope = 'CITY_ADMIN';
    
    documents.push({
      name: file,
      content,
      roleScope
    });
  }
  
  return documents;
}
