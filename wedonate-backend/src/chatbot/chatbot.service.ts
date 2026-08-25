import { RoleScope } from './chatbot.types';
import { retrieveRelevantKnowledge } from './rag/retrieval.service';
import { aiProvider } from './rag/embeddings.service';
import { getSystemPrompt } from './chatbot.prompt';
import { getCurrentUserStatus } from './tools/getCurrentUserStatus';
import { getKebeleWorkSummary } from './tools/getKebeleWorkSummary';
import { getCityWorkSummary } from './tools/getCityWorkSummary';
import { LRUCache } from 'lru-cache';

// Response Cache for repeated deterministic questions
const responseCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes cache
});

const GREETINGS = ['hi', 'hey', 'hello', 'good morning', 'good afternoon', 'good evening'];
const OUT_OF_SCOPE = ['who are you', 'weather', 'code', 'python', 'javascript'];

function handleGreeting(message: string, role: RoleScope): string | null {
  const normalized = message.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  
  if (GREETINGS.includes(normalized)) {
    if (role === 'KEBELE_ADMIN') return "Hi! I’m the WeDonate AI Assistant. I can help you with individual verification, support requests, assisted requests, donations, and Kebele workflows. What would you like help with?";
    if (role === 'CITY_ADMIN') return "Hi! I’m the WeDonate AI Assistant. I can help you with organization approvals, campaigns, Kebele administration, assisted requests, donations, and City-level workflows. What can I help you with today?";
    if (role === 'UNAUTHENTICATED') return "Hi! I’m the WeDonate AI Assistant. I can answer basic questions about what WeDonate is and how to sign up. What would you like to know?";
    return "Hi! I’m the WeDonate AI Assistant. I can help you understand how WeDonate works, guide you through requests, verification, donations, and explain what you can do based on your role. What can I help you with today?";
  }

  // Deterministic basic questions
  if (normalized.includes('what is wedonate') || normalized.includes('platform used for')) {
    return "WeDonate is a platform that connects donors with verified individuals and organizations seeking support. Verified citizens can request financial or material aid, and verified organizations can launch large fundraising campaigns.";
  }
  
  if (normalized.includes('how do i create an account') || normalized.includes('how to register')) {
    return "To create an account, click the 'Register' button. You will need to provide your details and select your Kebele. If you want to request support, you must verify your identity after registration.";
  }

  // Out of scope
  if (OUT_OF_SCOPE.some(word => normalized.includes(word))) {
    return "I can only help with questions about using WeDonate, your account, requests, donations, verification, and administrative workflows.";
  }

  return null;
}

export async function processChatMessage(userId: string, role: RoleScope, message: string): Promise<string> {
  const startTime = Date.now();
  if (process.env.CHATBOT_DEBUG === 'true') {
    console.log(`\n[CHATBOT_DEBUG] === New Request ===`);
    console.log(`[CHATBOT_DEBUG] Role: ${role} | UserId: ${userId}`);
    console.log(`[CHATBOT_DEBUG] Message: "${message}"`);
  }

  // 1. Simple Conversational Greeting Bypass (Deterministic)
  const deterministicResponse = handleGreeting(message, role);
  if (deterministicResponse) {
    if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Handler: Deterministic bypass. Latency: ${Date.now() - startTime}ms`);
    return deterministicResponse;
  }

  // 1.5 Cache Check (Bypass LLM completely if we've seen this exact question for this role)
  const cacheKey = `${role}:${message.trim().toLowerCase()}`;
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse) {
    if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Handler: Cache hit. Latency: ${Date.now() - startTime}ms`);
    return cachedResponse;
  }

  // 2. Safe Live Tool Gathering
  let liveContext = "";
  try {
    // Only query database if the message actually asks for status
    const isStatusQuery = /(my status|my request|waiting for me|pending|verify|pending work|summary)/i.test(message);
    if (isStatusQuery) {
      if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Tool intent detected for role: ${role}`);
      if (role === 'USER') {
        liveContext = await getCurrentUserStatus(userId);
      } else if (role === 'KEBELE_ADMIN') {
        liveContext = await getKebeleWorkSummary(userId);
      } else if (role === 'CITY_ADMIN') {
        liveContext = await getCityWorkSummary(userId);
      }
      if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Tool executed successfully.`);
    }
  } catch (error) {
    console.error("[CHATBOT_DEBUG] Tool execution failed (FALLBACK_TOOL_ERROR):", error);
    liveContext = "Tool execution failed. Unable to fetch live context.";
  }

  // 3. RAG Retrieval (Skip for UNAUTHENTICATED)
  let retrievedContext = "";
  if (role !== 'UNAUTHENTICATED') {
    try {
      if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] RAG Retrieval started...`);
      // Conservative topK=3 to save Gemini tokens and improve relevance
      retrievedContext = await retrieveRelevantKnowledge(message, role, 3);
      if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] RAG Retrieval complete.`);
    } catch (error) {
      console.error("[CHATBOT_DEBUG] Retrieval failed (FALLBACK_NO_RETRIEVAL):", error);
      return "I couldn't access the WeDonate knowledge base right now. Please try again later.";
    }
  }

  // 4. Construct Prompt and Generate Response
  const systemPrompt = getSystemPrompt(role, liveContext);
  const finalPrompt = role === 'UNAUTHENTICATED' 
    ? `User Question: ${message}` 
    : `Retrieved Documentation:\n${retrievedContext}\n\nUser Question: ${message}`;

  try {
    if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Sending to LLM...`);
    const generatedResponse = await aiProvider.generateResponse(systemPrompt, finalPrompt);
    
    if (!generatedResponse || generatedResponse.trim() === '') {
      console.error("[CHATBOT_DEBUG] FALLBACK_EMPTY_MODEL_RESPONSE");
      return "I'm sorry, I couldn't formulate a response right now. Please try again.";
    }

    // Only cache if it's not relying heavily on live context, or if it's a general question
    if (!liveContext) {
      responseCache.set(cacheKey, generatedResponse);
    }
    
    if (process.env.CHATBOT_DEBUG === 'true') console.log(`[CHATBOT_DEBUG] Success! Latency: ${Date.now() - startTime}ms`);
    return generatedResponse;
  } catch (error) {
    console.error("[CHATBOT_DEBUG] LLM Generation failed (FALLBACK_MODEL_ERROR):", error);
    return "WeDonate AI Assistant is temporarily unavailable. Please try again later.";
  }
}
