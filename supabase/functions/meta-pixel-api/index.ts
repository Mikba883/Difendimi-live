import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PIXEL_ID = Deno.env.get('META_PIXEL_ID');
const ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
const API_VERSION = 'v21.0';

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
    const { eventName, eventData, userData } = await req.json();

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error('Missing Meta Pixel configuration');
      return new Response(
        JSON.stringify({ error: 'Meta Pixel not configured' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare the event data for Meta Conversions API
    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: eventData.event_source_url || '',
        user_data: {
          ...userData,
          // Hash sensitive data as required by Meta
          em: userData?.email ? await hashData(userData.email) : undefined,
          ph: userData?.phone ? await hashData(userData.phone) : undefined,
        },
        custom_data: eventData.custom_data || {},
        action_source: 'website',
      }],
      test_event_code: eventData.test_event_code || undefined,
    };

    // Send event to Meta Conversions API
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          access_token: ACCESS_TOKEN,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta Pixel API error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send event to Meta', details: result }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Event sent successfully:', eventName, result);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in meta-pixel-api function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}