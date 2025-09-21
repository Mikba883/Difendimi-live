import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Precheck function called:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { caseText, caseType = 'general', previousContext = null } = body;
    
    if (!caseText) {
      console.error('Case text is missing');
      throw new Error('Case text is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Analyzing case with OpenAI...');

    // Prompt system per analisi legale
    const systemPrompt = `Sei un assistente legale AI esperto nel diritto italiano. Il tuo compito è analizzare un caso legale e:
1. Valutare la completezza delle informazioni fornite
2. Identificare gli elementi mancanti critici
3. Generare domande mirate per ottenere informazioni mancanti
4. Suggerire istituti giuridici e fonti normative rilevanti

Devi rispondere SEMPRE in formato JSON con questa struttura:
{
  "completeness": {
    "score": 0-100,
    "status": "incomplete|sufficient|complete",
    "missingElements": ["elemento1", "elemento2"]
  },
  "nextQuestion": {
    "text": "domanda specifica",
    "type": "text|date|choice|multiselect",
    "options": ["opzione1", "opzione2"]
  },
  "analysis": {
    "keyFacts": ["fatto1", "fatto2"],
    "legalIssues": ["questione1", "questione2"],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "relevantInstitutes": ["istituto1", "istituto2"],
    "recommendedDocuments": ["relazione", "diffida", "adr"]
  }
}`;

    const userPrompt = previousContext 
      ? `Caso precedente: ${previousContext}\n\nNuove informazioni: ${caseText}\n\nTipo di caso: ${caseType}`
      : `Analizza questo caso legale:\n${caseText}\n\nTipo di caso: ${caseType}`;

    console.log('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    console.log('Case analysis completed:', analysis.completeness?.status);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in precheck function:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the edge function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});