
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistantRequest {
  userMessage: string;
  sessionId: string;
  userId: string;
  conversationHistory?: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, sessionId, userId, conversationHistory = [] } = await req.json() as AssistantRequest;

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OpenAI_API') || Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use your existing assistant ID
    const assistantId = Deno.env.get('Api_Assisstant') || 'asst_w0jwx4pIWZto4yw1ozet5Mrb';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create thread for this session
    let threadId: string;
    
    // Check if we have a stored thread for this session
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData?.metadata?.threadId) {
      // Create new thread
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        console.error('Failed to create thread:', errorText);
        throw new Error(`Thread creation failed: ${errorText}`);
      }

      const thread = await threadResponse.json();
      threadId = thread.id;

      // Store thread ID in session metadata
      await supabase
        .from('chat_sessions')
        .update({
          metadata: { threadId }
        })
        .eq('id', sessionId);
    } else {
      threadId = sessionData.metadata.threadId;
    }

    // Get user memories for context
    let memoryContext = '';
    if (userId && userId !== 'user') {
      try {
        const { data: memories } = await supabase
          .from('user_memories')
          .select('title, content, category, keywords')
          .eq('user_id', userId)
          .order('importance_score', { ascending: false })
          .limit(3);
          
        if (memories && memories.length > 0) {
          memoryContext = '\n\nRelevant memories:\n' + 
            memories.map(m => `- ${m.title}: ${JSON.stringify(m.content)}`).join('\n');
        }
      } catch (error) {
        console.error('Error fetching memories:', error);
      }
    }

    // Send message to thread with memory context
    const fullMessage = userMessage + memoryContext;
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: fullMessage
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to send message:', errorText);
      throw new Error(`Message sending failed: ${errorText}`);
    }

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Failed to run assistant:', errorText);
      throw new Error(`Assistant run failed: ${errorText}`);
    }

    const run = await runResponse.json();

    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timeout');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check run status');
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // Get the assistant's response
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to retrieve messages');
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    const responseText = assistantMessage.content[0]?.text?.value || 'No response generated';

    // Store memory if this is a significant interaction
    if (userId && userId !== 'user' && responseText.length > 20) {
      try {
        await supabase
          .from('user_memories')
          .insert({
            user_id: userId,
            title: userMessage.substring(0, 50),
            content: { 
              user_query: userMessage, 
              ai_response: responseText.substring(0, 200)
            },
            category: 'conversation',
            keywords: userMessage.toLowerCase().split(' ').slice(0, 5),
            importance_score: responseText.length > 100 ? 5 : 3
          });
      } catch (error) {
        console.error('Error storing memory:', error);
      }
    }

    return new Response(
      JSON.stringify({
        message: responseText,
        threadId: threadId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in openai-assistant-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
