import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { files, prompt, sessionId, userId } = await req.json();
    
    if (!files || !Array.isArray(files) || !prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    let fileContents = [];
    
    // Process each file
    for (const fileInfo of files) {
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('user-uploads')
          .download(fileInfo.path);

        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          continue;
        }

        let content = '';
        
        // Process based on file type
        if (fileInfo.type.startsWith('image/')) {
          // For images, we'll send the base64 data to OpenAI
          const arrayBuffer = await fileData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          content = `data:${fileInfo.type};base64,${base64}`;
          
          fileContents.push({
            type: 'image',
            name: fileInfo.name,
            content: content,
            mimeType: fileInfo.type
          });
        } else if (fileInfo.type === 'application/pdf') {
          // For PDFs, we'll extract text (simplified - in production you'd use a proper PDF parser)
          content = `[PDF File: ${fileInfo.name} - Content extraction would require specialized PDF parsing]`;
          
          fileContents.push({
            type: 'document',
            name: fileInfo.name,
            content: content,
            mimeType: fileInfo.type
          });
        } else if (fileInfo.type.startsWith('text/') || fileInfo.type === 'application/json') {
          // For text files, read the content directly
          content = await fileData.text();
          
          fileContents.push({
            type: 'text',
            name: fileInfo.name,
            content: content,
            mimeType: fileInfo.type
          });
        } else {
          // For other file types
          content = `[File: ${fileInfo.name} - Binary content of type ${fileInfo.type}]`;
          
          fileContents.push({
            type: 'other',
            name: fileInfo.name,
            content: content,
            mimeType: fileInfo.type
          });
        }
      } catch (error) {
        console.error('Error processing file:', fileInfo.name, error);
      }
    }

    // Prepare OpenAI request
    const openAIApiKey = Deno.env.get('OpenAI_API');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the message content
    const messageContent = [
      {
        type: 'text',
        text: `You are JamAI, a friendly Jamaican AI assistant. A user has uploaded ${fileContents.length} file(s) and asked: "${prompt}"\n\nHere are the files:\n\n`
      }
    ];

    // Add each file to the message
    fileContents.forEach((file, index) => {
      if (file.type === 'image') {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: file.content
          }
        });
        messageContent.push({
          type: 'text',
          text: `Image ${index + 1}: ${file.name}\n`
        });
      } else {
        messageContent.push({
          type: 'text',
          text: `File ${index + 1}: ${file.name} (${file.mimeType})\nContent:\n${file.content}\n\n`
        });
      }
    });

    messageContent.push({
      type: 'text',
      text: 'Please respond in your authentic Jamaican style, helping the user with their request about these files.'
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are JamAI, a friendly Jamaican AI assistant. You help users with file analysis, document processing, image understanding, and various tasks in an authentic Jamaican style. Be helpful, engaging, and use appropriate Jamaican expressions when natural.'
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process files with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices[0].message.content;

    // Save message to database if sessionId provided
    if (sessionId) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            session_id: sessionId,
            user_id: userId,
            content: `Uploaded ${fileContents.length} file(s): ${fileContents.map(f => f.name).join(', ')}\nPrompt: ${prompt}`,
            is_user: true,
            message_type: 'file_upload',
            metadata: {
              files: fileContents.map(f => ({ name: f.name, type: f.mimeType })),
              file_count: fileContents.length
            }
          },
          {
            session_id: sessionId,
            user_id: userId,
            content: aiMessage,
            is_user: false,
            message_type: 'text'
          }
        ]);

      if (messageError) {
        console.error('Error saving messages:', messageError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        processedFiles: fileContents.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in file-processor function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});