import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleAuth } from "https://deno.land/x/google_auth@v1.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('Audio data is required');
    }

    // Decode base64 audio
    const audioBytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Google Cloud credentials
    const googleAuth = new GoogleAuth({
      credentials: {
        client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessToken = await googleAuth.getAccessToken();

    // Call Google Speech-to-Text API
    const response = await fetch(
      'https://speech.googleapis.com/v1/speech:recognize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'it-IT',
            model: 'latest_long',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google STT error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const result = await response.json();
    const transcript = result.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .join(' ') || '';

    console.log('Transcription successful:', transcript);

    return new Response(
      JSON.stringify({ text: transcript }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in STT function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});