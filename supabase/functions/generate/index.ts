// supabase/functions/generate/index.ts
// Process complete cases and generate legal reports

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// --- CORS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get("SP_URL") || "";
const serviceRoleKey = Deno.env.get("SP_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) throw new Error("OPENAI_API_KEY not configured");

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: "json_object" as const },
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "<no-body>");
    throw new Error(`OpenAI API error: ${resp.status} - ${t}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Invalid response from OpenAI");
  
  return JSON.parse(content);
}

// Handler
serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { job_id, caseType, caseData, meta } = body;
    if (!job_id || !caseData) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    console.log(`Processing job ${job_id} of type ${caseType}`);

    // Extract user ID - from direct call or from meta passed by precheck
    let userId = null;
    
    // Check if we have an auth token in meta (from precheck)
    if (meta?.authToken) {
      const token = meta.authToken.replace("Bearer ", "");
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          console.log(`User ID extracted from precheck auth: ${userId}`);
        }
      }
    }
    
    // If not from precheck, try direct authorization header
    if (!userId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && !authHeader.includes(serviceRoleKey)) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          console.log(`User ID extracted from direct auth: ${userId}`);
        }
      }
    }
    
    if (!userId) {
      console.error("No valid user ID found - case will be saved without user association");
    }

    // Generate legal analysis
    const systemPrompt = `Sei un assistente legale AI specializzato nel diritto italiano. 
Genera un report legale dettagliato basato sul caso fornito.

Il report deve essere in formato JSON con questa struttura:
{
  "title": "Titolo del caso",
  "classification": {
    "caseType": "tipo di caso",
    "jurisdiction": "giurisdizione",
    "areaOfLaw": ["area1", "area2"],
    "urgency": "alta|media|bassa",
    "complexity": "alta|media|bassa"
  },
  "report": {
    "executiveSummary": {
      "title": "Sintesi Esecutiva",
      "content": "Riassunto del caso e raccomandazioni principali"
    },
    "qualificazioneGiuridica": {
      "title": "Qualificazione Giuridica",
      "content": "Analisi giuridica dettagliata del caso"
    },
    "fonti": {
      "title": "Fonti Normative",
      "items": [
        {
          "type": "legge|articolo|giurisprudenza",
          "reference": "riferimento normativo",
          "relevance": "alta|media|bassa",
          "description": "descrizione"
        }
      ]
    },
    "opzioni": {
      "title": "Opzioni Strategiche",
      "rows": [
        {
          "option": "opzione",
          "pros": "vantaggi",
          "cons": "svantaggi",
          "risk": "alto|medio|basso"
        }
      ]
    },
    "passiOperativi": {
      "title": "Passi Operativi",
      "checklist": [
        {
          "step": "passo da fare",
          "priority": 1,
          "timeframe": "immediato|breve|medio|lungo termine"
        }
      ]
    },
    "termini": {
      "title": "Termini e Scadenze",
      "deadlines": [
        {
          "description": "descrizione scadenza",
          "date": "data (se applicabile)",
          "mandatory": true
        }
      ]
    },
    "allegati": {
      "title": "Documenti Suggeriti",
      "documents": ["documento1", "documento2"]
    }
  },
  "documents": [
    {
      "type": "relazione|diffida|adr",
      "title": "titolo documento",
      "purpose": "scopo del documento",
      "content": "contenuto del documento",
      "priority": "alta|media|bassa"
    }
  ]
}`;

    const userPrompt = `Analizza il seguente caso legale e genera un report completo:

Tipo di caso: ${caseType}
Contesto precedente: ${caseData.previousContext || "Nessuno"}
Testo del caso: ${caseData.caseText}

Dati dall'analisi preliminare:
- Fatti chiave: ${JSON.stringify(caseData.fromPrecheck?.keyFacts || [])}
- Questioni legali: ${JSON.stringify(caseData.fromPrecheck?.legalIssues || [])}
- Parole chiave: ${JSON.stringify(caseData.fromPrecheck?.suggestedKeywords || [])}
- Istituti rilevanti: ${JSON.stringify(caseData.fromPrecheck?.relevantInstitutes || [])}
- Documenti raccomandati: ${JSON.stringify(caseData.fromPrecheck?.recommendedDocuments || [])}`;

    const result = await callOpenAI(systemPrompt, userPrompt);

    // Save to database - only save if we have a valid user ID
    if (!userId) {
      console.error("Cannot save case without valid user ID");
      return jsonResponse({ 
        error: "Authentication required", 
        details: "No valid user ID found - please ensure you are logged in" 
      }, 401);
    }
    
    const { data: caseRecord, error: dbError } = await supabase
      .from("cases")
      .insert({
        job_id,
        created_by: userId,
        title: result.title || "Caso senza titolo",
        case_type: caseType,
        case_text: caseData.caseText,
        previous_context: caseData.previousContext,
        status: "ready",
        classification: result.classification || {},
        report: result.report || {},
        documents: result.documents || [],
        jurisdiction: result.classification?.jurisdiction || "unknown",
        area_of_law: result.classification?.areaOfLaw || [],
        doc_availability: {
          relazione: result.documents?.some((d: any) => d.type === "relazione") || false,
          diffida: result.documents?.some((d: any) => d.type === "diffida") || false,
          adr: result.documents?.some((d: any) => d.type === "adr") || false,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return jsonResponse({ error: "Failed to save case", details: dbError.message }, 500);
    }

    console.log(`Case ${job_id} processed and saved with ID ${caseRecord.id}`);

    return jsonResponse({
      success: true,
      job_id,
      case_id: caseRecord.id,
      status: "ready",
    });
  } catch (error) {
    console.error("generate error:", error);
    return jsonResponse(
      { error: "Internal error", details: String(error) },
      500
    );
  }
});
