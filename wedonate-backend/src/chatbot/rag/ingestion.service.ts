import prisma from '../../lib/prisma';
import { aiProvider } from './embeddings.service';
import { chunkMarkdown } from './chunker';
import { loadKnowledgeDocuments } from './knowledgeLoader';
import { v4 as uuidv4 } from 'uuid';

export async function ingestKnowledgeBase() {
  console.log('Loading documents...');
  const docs = loadKnowledgeDocuments();
  console.log(`Found ${docs.length} documents.`);

  for (const doc of docs) {
    console.log(`Processing: ${doc.name}`);
    
    // Check if document exists and delete it to make ingestion idempotent
    const existing = await prisma.knowledgeDocument.findUnique({
      where: { name: doc.name }
    });
    
    if (existing) {
      console.log(`Document ${doc.name} already exists. Replacing it.`);
      await prisma.knowledgeDocument.delete({ where: { id: existing.id } });
    }

    const documentRecord = await prisma.knowledgeDocument.create({
      data: { name: doc.name }
    });

    const chunks = chunkMarkdown(doc.name, doc.content, doc.roleScope);
    console.log(`Generated ${chunks.length} chunks. Creating embeddings...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await aiProvider.createEmbedding(chunk.content);
      
      const chunkId = uuidv4();
      const stringifiedEmbedding = `[${embedding.join(',')}]`;

      // Use raw SQL to insert the vector type
      await prisma.$executeRawUnsafe(`
        INSERT INTO "knowledge_chunks" ("id", "documentId", "section", "content", "roleScope", "embedding", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5::"RoleScope", $6::vector, NOW(), NOW())
      `, 
        chunkId, 
        documentRecord.id, 
        chunk.section, 
        chunk.content, 
        chunk.roleScope, 
        stringifiedEmbedding
      );
    }
    
    console.log(`Completed processing: ${doc.name}`);
  }
  
  console.log('Knowledge Base ingestion complete!');
}
