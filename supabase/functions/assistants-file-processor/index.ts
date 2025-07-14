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

    // Step 1: Use existing assistant
    const assistantId = 'asst_w0jwx4pIWZto4yw1ozet5Mrb';
    console.log('Using existing assistant:', assistantId);

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

    // Step 6: Poll for completion and handle function calls
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
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

      // Handle function calls if required
      if (runStatus === 'requires_action') {
        console.log('Assistant requires action - handling function calls...');
        
        const toolCalls = statusData.required_action?.submit_tool_outputs?.tool_calls || [];
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'search_and_process_uploaded_files') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log('Function call arguments:', args);
            
            try {
              // Search for user files in Supabase storage
              const { data: files, error: filesError } = await supabase.storage
                .from('user-uploads')
                .list(userId, {
                  limit: args.limit || 10,
                  sortBy: { column: 'created_at', order: 'desc' }
                });
              
              if (filesError) {
                console.error('Error fetching files:', filesError);
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: 'Failed to fetch files from storage' })
                });
                continue;
              }
              
              // Filter by file types if specified
              let filteredFiles = files || [];
              if (args.file_types && args.file_types.length > 0) {
                filteredFiles = filteredFiles.filter(file => {
                  const extension = file.name.split('.').pop()?.toUpperCase();
                  return args.file_types.some((type: string) => type.toUpperCase() === extension);
                });
              }
              
              // Return file information
              const fileInfo = filteredFiles.map(file => ({
                name: file.name,
                size: file.metadata?.size,
                created_at: file.created_at,
                updated_at: file.updated_at
              }));
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  files: fileInfo,
                  count: fileInfo.length,
                  message: `Found ${fileInfo.length} files matching your criteria.`,
                  prompt: args.prompt
                })
              });
              
            } catch (error) {
              console.error('Error in function call:', error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Failed to process function call' })
              });
            }
          }
        }
        
        // Submit tool outputs if any
        if (toolOutputs.length > 0) {
          const toolResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}/submit_tool_outputs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              tool_outputs: toolOutputs
            })
          });
          
          if (!toolResponse.ok) {
            const errorText = await toolResponse.text();
            console.error('Failed to submit tool outputs:', errorText);
          } else {
            console.log('Tool outputs submitted successfully');
          }
        }
      }
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