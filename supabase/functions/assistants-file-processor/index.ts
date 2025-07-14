import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssistantRequest {
  files: File[];
  prompt: string;
  sessionId?: string;
  userId: string;
  threadId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Assistants file processor called');
    
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string;
    const threadId = formData.get('threadId') as string;
    
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    console.log(`Processing ${files.length} files for user ${userId}`);

    if (!prompt || !userId) {
      console.error('Missing required fields:', { prompt: !!prompt, userId: !!userId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OpenAI_API') || Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create or get assistant
    let assistantId = 'asst_jamaican_ai'; // We'll store this or make it dynamic
    
    try {
      // Try to retrieve existing assistant or create new one
      const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: "JamAI Assistant",
          instructions: `You are JamAI, a helpful Jamaican AI assistant. You can read and analyze user-uploaded files including PDFs, text files, images, and documents. When responding:
          
          1. Be warm and friendly with a Jamaican personality
          2. Analyze uploaded files thoroughly 
          3. Provide detailed insights about file contents
          4. Use Jamaican expressions naturally when appropriate
          5. Be helpful and informative
          
          If files are uploaded, make sure to reference and analyze their content in your response.`,
          tools: [{ type: "file_search" }],
          model: "gpt-4-1106-preview",
          temperature: 0.7
        })
      });

      if (!assistantResponse.ok) {
        const errorText = await assistantResponse.text();
        console.error('Failed to create assistant:', errorText);
        throw new Error(`Assistant creation failed: ${errorText}`);
      }

      const assistant = await assistantResponse.json();
      assistantId = assistant.id;
      console.log('Assistant created/retrieved:', assistantId);
    } catch (error) {
      console.error('Assistant setup error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to set up AI assistant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Upload files to OpenAI if any
    const uploadedFileIds: string[] = [];
    
    if (files.length > 0) {
      console.log('Uploading files to OpenAI...');
      
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('purpose', 'assistants');

          const fileResponse = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: formData
          });

          if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            console.error(`Failed to upload file ${file.name}:`, errorText);
            continue;
          }

          const uploadedFile = await fileResponse.json();
          uploadedFileIds.push(uploadedFile.id);
          console.log(`File uploaded: ${file.name} -> ${uploadedFile.id}`);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      }
    }

    // Step 3: Create or use existing thread
    let currentThreadId = threadId;
    
    if (!currentThreadId) {
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
      currentThreadId = thread.id;
      console.log('Thread created:', currentThreadId);
    }

    // Step 4: Add message to thread with file attachments
    const messageBody: any = {
      role: "user",
      content: prompt
    };

    if (uploadedFileIds.length > 0) {
      messageBody.attachments = uploadedFileIds.map(fileId => ({
        file_id: fileId,
        tools: [{ type: "file_search" }]
      }));
    }

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify(messageBody)
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to add message:', errorText);
      throw new Error(`Message creation failed: ${errorText}`);
    }

    console.log('Message added to thread');

    // Step 5: Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
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
    console.log('Assistant run started:', run.id);

    // Step 6: Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timeout');
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}`, {
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
      console.log(`Run status: ${runStatus} (attempt ${attempts})`);
    }

    if (runStatus !== 'completed') {
      console.error('Assistant run failed with status:', runStatus);
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // Step 7: Get the assistant's response
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
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
    console.log('Assistant response received');

    // Step 8: Save to database if sessionId provided
    if (sessionId) {
      try {
        // Save user message
        await supabase.from('messages').insert({
          content: prompt,
          is_user: true,
          session_id: sessionId,
          user_id: userId,
          message_type: files.length > 0 ? 'file_upload' : 'text',
          metadata: {
            file_count: files.length,
            thread_id: currentThreadId,
            file_ids: uploadedFileIds
          }
        });

        // Save AI response
        await supabase.from('messages').insert({
          content: responseText,
          is_user: false,
          session_id: sessionId,
          user_id: userId,
          message_type: 'text',
          metadata: {
            thread_id: currentThreadId,
            assistant_id: assistantId,
            run_id: run.id
          }
        });

        console.log('Messages saved to database');
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    return new Response(
      JSON.stringify({
        message: responseText,
        filesProcessed: files.length,
        threadId: currentThreadId,
        assistantId: assistantId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in assistants-file-processor:', error);
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