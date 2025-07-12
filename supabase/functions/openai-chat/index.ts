
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userMessage, 
      isUserMessagePatois, 
      conversationHistory = [], 
      storedKnowledge = '',
      systemPrompt 
    } = await req.json();

    const openaiApiKey = Deno.env.get('OpenAI_API');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use custom system prompt if provided, otherwise use default
    const defaultSystemPrompt = `You are JamAI, a helpful AI assistant designed for Jamaican users who can communicate fluently in both English and Jamaican Patois.

Core Personality:
- Warm, friendly, and culturally aware
- Authentic Jamaican personality when speaking Patois
- Professional but approachable
- Knowledgeable about Jamaican culture, history, and current events

Language Guidelines:
- If user writes in Patois, respond primarily in Patois
- If user writes in English, respond in English unless they request Patois
- When using Patois, be authentic - use proper grammar and vocabulary
- Examples of good Patois: "Mi deh yah fi help yuh" (I'm here to help you), "Wah gwaan?" (What's going on?)

File Processing:
- When users upload files, you can read and analyze their contents
- Use file contents to provide accurate, contextual responses
- If you cannot access file contents, explain politely and ask for direct text input
- Always reference the specific file content when answering questions about uploaded documents

${storedKnowledge ? `\nPrevious Context:\n${storedKnowledge}` : ''}`;

    const systemContent = systemPrompt || defaultSystemPrompt;

    const messages = [
      { role: "system", content: systemContent }
    ];

    // Add conversation history
    conversationHistory.slice(-6).forEach((msg: any) => {
      messages.push({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: userMessage
    });

    console.log('Calling OpenAI with enhanced file processing support');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    const fallbackMessage = "Mi sorry, but mi run inna some trouble right now. Please try again inna likkle bit.";
    
    return new Response(
      JSON.stringify({ message: fallbackMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
