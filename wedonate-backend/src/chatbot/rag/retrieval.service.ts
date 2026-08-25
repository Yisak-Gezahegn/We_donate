import prisma from '../../lib/prisma';
import { aiProvider } from './embeddings.service';
import { RoleScope } from '../chatbot.types';

export async function retrieveRelevantKnowledge(question: string, roleScope: RoleScope, topK: number = 5): Promise<string> {
  const queryEmbedding = await aiProvider.createEmbedding(question);
  const stringifiedEmbedding = `[${queryEmbedding.join(',')}]`;

  // Use raw SQL for pgvector similarity search
  // We use <=> for cosine distance. Lower is more similar.
  // We filter by roleScope = GENERAL OR roleScope = user's role.
  const results: any[] = await prisma.$queryRawUnsafe(`
    SELECT "section", "content", "documentId", 
           1 - ("embedding" <=> $1::vector) as similarity
    FROM "knowledge_chunks"
    WHERE "roleScope" = 'GENERAL' OR "roleScope" = $2::"RoleScope"
    ORDER BY "embedding" <=> $1::vector
    LIMIT $3
  `, stringifiedEmbedding, roleScope, topK);

  if (!results || results.length === 0) {
    return "";
  }

  // Combine the results into a single context string
  return results.map((r, index) => {
    return `--- Document Segment ${index + 1} ---\nSection: ${r.section}\nContent: ${r.content}\n`;
  }).join('\n');
}
