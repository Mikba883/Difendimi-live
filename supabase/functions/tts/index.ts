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
    const { text, voice = 'it-IT-Wavenet-D' } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    // Google Cloud credentials
    const googleAuth = new GoogleAuth({
      credentials: {
        client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
        private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessToken = await googleAuth.getAccessToken();

    // Call Google Text-to-Speech API
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'it-IT',
            name: voice,
            ssmlGender: voice.includes('Wavenet-A') || voice.includes('Wavenet-C') ? 'FEMALE' : 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google TTS error:', error);
      throw new Error('Failed to synthesize speech');
    }

    const result = await response.json();
    console.log('TTS synthesis successful');

    return new Response(
      JSON.stringify({ audio: result.audioContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in TTS function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});