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
      console.error("Missing fields - job_id:", job_id, "caseData:", !!caseData);
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    console.log(`Processing job ${job_id} of type ${caseType}`);
    console.log("Meta received:", JSON.stringify(meta));

    // Extract user ID - from direct call or from meta passed by precheck
    let userId = null;
    
    // Check if we have an auth token in meta (from precheck)
    if (meta?.authToken) {
      console.log("Auth token found in meta, extracting user...");
      const token = meta.authToken.replace("Bearer ", "");
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error("Error extracting user from token:", error);
        } else if (user) {
          userId = user.id;
          console.log(`User ID extracted from precheck auth: ${userId}`);
        }
      }
    } else {
      console.log("No auth token in meta");
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
      console.error("WARNING: No valid user ID found - attempting to save without user");
      // Prova a recuperare l'ID utente dal job_id precedente se esiste
      const { data: existingCase } = await supabase
        .from("cases")
        .select("created_by")
        .eq("job_id", job_id)
        .maybeSingle();
      
      if (existingCase?.created_by) {
        userId = existingCase.created_by;
        console.log(`User ID recovered from existing job: ${userId}`);
      }
    }

    // Generate legal analysis with correct structure
    const systemPrompt = `Sei un assistente legale AI specializzato nel diritto italiano. 
Genera un report legale dettagliato basato sul caso fornito.

IMPORTANTE: Il report deve essere in formato JSON con questa ESATTA struttura usando snake_case:
{
  "title": "Titolo del caso",
  "classification": {
    "case_type": "tipo di caso",
    "jurisdiction": "giurisdizione", 
    "area_of_law": ["area1", "area2"],
    "urgency": "alta|media|bassa",
    "complexity": "alta|media|bassa"
  },
  "report": {
    "executive_summary": {
      "summary": "Riassunto completo del caso e delle raccomandazioni principali",
      "key_points": ["punto chiave 1", "punto chiave 2", "punto chiave 3"]
    },
    "qualificazione_giuridica": {
      "description": "Analisi giuridica dettagliata del caso secondo il diritto italiano",
      "articles": ["Art. X Codice Civile", "Art. Y Codice Penale", "Legge N/Anno"]
    },
    "fonti": {
      "items": [
        {
          "title": "Nome della legge o regolamento (es. Codice Civile)",
          "official_url": "https://www.normativa.it/...",
          "description": "Descrizione della rilevanza per il caso"
        }
      ]
    },
    "opzioni": {
      "rows": [
        {
          "name": "Nome dell'opzione strategica",
          "pro": "Vantaggi di questa opzione",
          "contro": "Svantaggi e rischi",
          "tempi": "Tempistiche stimate (es. 2-3 mesi)",
          "costi": "Costi stimati (es. €1000-2000)",
          "esito": "Probabilità di successo e risultato atteso"
        }
      ]
    },
    "passi_operativi": {
      "checklist": [
        {
          "id": "step_1",
          "text": "Descrizione del passo da compiere",
          "completed": false
        }
      ]
    },
    "termini": {
      "deadlines": [
        {
          "description": "Descrizione della scadenza",
          "date": "2024-MM-DD",
          "type": "prescription|decadenza|other"
        }
      ],
      "prescription": "Informazioni generali sulla prescrizione applicabile",
      "decadenza": "Informazioni generali sulla decadenza applicabile"
    },
    "allegati": {
      "present": ["Documento già disponibile 1", "Documento già disponibile 2"],
      "missing": ["Documento mancante necessario 1", "Documento mancante necessario 2"],
      "nice_to_have": ["Documento opzionale 1", "Documento opzionale 2"]
    },
    "disclaimer": "Questo report è fornito a scopo informativo. Si consiglia di consultare un avvocato qualificato per una consulenza legale specifica."
  },
  "documents": {
    "items": [
      {
        "id": "doc_1",
        "title": "Titolo del documento generato",
        "rationale": "Motivo per cui questo documento è necessario",
        "storage_path": "",
        "signed_url": "",
        "size_bytes": 0
      }
    ]
  }
}

REGOLE IMPORTANTI:
1. Usa sempre snake_case (underscore) per i nomi dei campi, NON camelCase
2. Fai riferimento a leggi italiane reali da normativa.it
3. Fornisci tempistiche e costi realistici
4. Includi tutti i campi richiesti nella struttura`;

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
    
    // Prepare the data with the correct structure
    const caseDbData = {
      job_id,
      created_by: userId,
      title: result.title || "Caso senza titolo",
      case_type: caseType,
      status: "ready" as const,
      classification: result.classification || {},
      report: result.report || {},
      documents: result.documents || { items: [] },
      cards_json: result.report || {}, 
      jurisdiction: result.classification?.jurisdiction || "unknown",
      area_of_law: result.classification?.area_of_law || [],
      doc_availability: {
        relazione: false,
        diffida: false,
        adr: false,
      },
      // Non salviamo più i dati utente nel database
      case_text: null,
      previous_context: null,
    };
    
    // Check if documents were generated and update availability
    if (result.documents?.items && Array.isArray(result.documents.items)) {
      caseDbData.doc_availability = {
        relazione: result.documents.items.some((d: any) => d.title?.toLowerCase().includes("relazione")),
        diffida: result.documents.items.some((d: any) => d.title?.toLowerCase().includes("diffida")),
        adr: result.documents.items.some((d: any) => d.title?.toLowerCase().includes("adr")),
      };
    }
    
    // Save to database
    const { data: caseRecord, error: dbError } = await supabase
      .from("cases")
      .insert(caseDbData)
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
