
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.24.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, isUserMessagePatois, conversationHistory, storedKnowledge } = await req.json();
    
    const apiKey = Deno.env.get('Gemini_API');
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      }
    });

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        const role = msg.isUser ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.text}\n`;
      });
    }

    // Check if this is already a structured prompt
    const isStructuredPrompt = userMessage.includes('MODE:') && userMessage.includes('USER INPUT:');
    
    let finalPrompt: string;
    
    if (isStructuredPrompt) {
      // Use the structured prompt as-is, but add context if available
      finalPrompt = userMessage;
      
      if (storedKnowledge) {
        finalPrompt += `\n\nPrevious Knowledge:\n${storedKnowledge}`;
      }
      
      if (conversationContext) {
        finalPrompt += `\n\nCurrent Conversation:\n${conversationContext}`;
      }
    } else {
      // Fallback to original system for backwards compatibility
      const systemPrompt = isUserMessagePatois 
        ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and provide complete, detailed answers when needed. For complex questions, give thorough explanations. For simple greetings or quick questions, be more concise. Use Patois naturally but make sure your responses are clear and informative.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}

${conversationContext ? `Current Conversation:\n${conversationContext}\n` : ''}`
        : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}

${conversationContext ? `Current Conversation:\n${conversationContext}\n` : ''}`;

      finalPrompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
    }

    // Generate response from Gemini
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const responseText = response.text();

    console.log(`Generated response for user message: ${userMessage.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ message: responseText }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
