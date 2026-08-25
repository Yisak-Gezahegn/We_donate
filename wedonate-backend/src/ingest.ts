import { ingestKnowledgeBase } from './chatbot/rag/ingestion.service';

async function run() {
  try {
    await ingestKnowledgeBase();
    process.exit(0);
  } catch (err) {
    console.error('Ingestion failed:', err);
    process.exit(1);
  }
}

run();
