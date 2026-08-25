import { KnowledgeChunkInput, RoleScope } from '../chatbot.types';

export function chunkMarkdown(
  documentName: string,
  markdown: string,
  roleScope: RoleScope = 'GENERAL'
): KnowledgeChunkInput[] {
  const lines = markdown.split('\n');
  const chunks: KnowledgeChunkInput[] = [];
  
  let currentSection = 'Overview';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      // Save previous section if it has content
      if (currentContent.length > 0) {
        const text = currentContent.join('\n').trim();
        if (text) {
          chunks.push({
            documentName,
            section: currentSection,
            content: text,
            roleScope
          });
        }
      }
      // Start new section
      currentSection = line.replace(/#+\s/, '').trim();
      currentContent = [line]; // Include header in the chunk
    } else {
      currentContent.push(line);
    }
  }
  
  // Save final section
  if (currentContent.length > 0) {
    const text = currentContent.join('\n').trim();
    if (text) {
      chunks.push({
        documentName,
        section: currentSection,
        content: text,
        roleScope
      });
    }
  }
  
  return chunks;
}
