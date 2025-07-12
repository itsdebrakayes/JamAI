import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    const apiKey = Deno.env.get('OpenAI_API');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check if this is already a structured prompt
    const isStructuredPrompt = userMessage.includes('MODE:') && userMessage.includes('USER INPUT:');
    
    const messages = [];
    
    if (isStructuredPrompt) {
      // Use the structured prompt as the system message
      let systemContent = userMessage;
      
      if (storedKnowledge) {
        systemContent += `\n\nPrevious Knowledge:\n${storedKnowledge}`;
      }
      
      messages.push({
        role: "system",
        content: systemContent
      });
      
      // Add recent conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg: any) => {
          messages.push({
            role: msg.isUser ? "user" : "assistant",
            content: msg.text
          });
        });
      }
    } else {
      // Fallback to original system for backwards compatibility
      const systemPrompt = isUserMessagePatois 
        ? `You are JamAI, an AI assistant that can speak Jamaican Patois. When users write in Patois, respond naturally in Patois. Be helpful and provide complete, detailed answers when needed. For complex questions, give thorough explanations. For simple greetings or quick questions, be more concise. Use Patois naturally but make sure your responses are clear and informative.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}`
        : `You are JamAI, an AI assistant with knowledge of Jamaican culture. Respond in clear, natural English. Be helpful and provide complete, detailed answers when users ask complex questions. Give thorough explanations when needed, but be more concise for simple questions. You can reference Jamaican culture when relevant.

IMPORTANT: You have access to previous conversation history and comprehensive stored knowledge from past chats. Use this information to provide contextual responses and remember what has been discussed before.

${storedKnowledge ? `Previous Knowledge:\n${storedKnowledge}\n` : ''}`;

      messages.push({
        role: "system",
        content: systemPrompt
      });

      // Add recent conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg: any) => {
          messages.push({
            role: msg.isUser ? "user" : "assistant",
            content: msg.text
          });
        });
      }

      // Add current user message
      messages.push({
        role: "user",
        content: userMessage
      });
    }

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || 'Sorry, mi cyaan understand dat right now.';

    console.log(`Generated OpenAI response for user message: ${userMessage.substring(0, 50)}...`);

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
    console.error('Error in openai-chat function:', error);
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
