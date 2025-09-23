// supabase/functions/precheck/index.ts
// Funzione intelligente: analizza il caso iniziale, genera domande mirate, poi handoff a `generate`

import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

// --- Utils ---
function makeJobId() {
  return crypto.randomUUID();
}

async function callOpenAI(openAIApiKey: string, systemPrompt: string, userPrompt: string) {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: "json_object" as const },
  };

  const doFetch = () =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let resp = await doFetch();
  if (resp.status === 429 || resp.status >= 500) {
    await new Promise((r) => setTimeout(r, 400));
    resp = await doFetch();
  }
  if (!resp.ok) {
    const t = await resp.text().catch(() => "<no-body>");
    throw new Error(`OpenAI API error: ${resp.status} - ${t}`);
  }
  const data = await resp.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid response from OpenAI");
  }
  return JSON.parse(content);
}

async function handoffToGenerate(projectRef: string, serviceRoleKey: string, payload: unknown) {
  const url = `https://${projectRef}.supabase.co/functions/v1/generate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "X-Source": "precheck",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`generate failed: ${res.status} - ${t}`);
  }
  return true;
}

// --- Handler ---
Deno.serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Parse body
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { latestResponse = "", previousContext = [], currentQuestions = [], allQuestionsAnswered = false } = body ?? {};
    
    console.log('=== PRECHECK START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Latest Response:', latestResponse);
    console.log('Previous Context Length:', Array.isArray(previousContext) ? previousContext.length : 0);
    console.log('Current Questions:', currentQuestions);
    console.log('All Questions Answered Flag:', allQuestionsAnswered);
    
    // Validate input
    if (!latestResponse || typeof latestResponse !== "string" || !latestResponse.trim()) {
      return jsonResponse({ error: "Latest response is required" }, 400);
    }

    // Env
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const projectRef = Deno.env.get("SP_PROJECT_REF");
    const serviceRoleKey = Deno.env.get("SP_SERVICE_ROLE_KEY");
    if (!openAIApiKey) return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 500);
    if (!projectRef) return jsonResponse({ error: "SP_PROJECT_REF not configured" }, 500);
    if (!serviceRoleKey) return jsonResponse({ error: "SP_SERVICE_ROLE_KEY not configured" }, 500);
    
    // Leggi il parametro allQuestionsAnswered dal body
    const allQuestionsAnswered = body?.allQuestionsAnswered || false;

    // Build conversation history
    let conversationHistory = '';
    if (Array.isArray(previousContext)) {
      conversationHistory = previousContext.map((msg: any) => 
        `${msg.role === 'user' ? 'Utente' : 'Assistente'}: ${msg.content}`
      ).join('\n');
    }

    // Determina se è la prima esposizione del caso o una risposta a domande
    const isInitialCaseDescription = previousContext.length === 0 || 
      (previousContext.length === 1 && previousContext[0].role === 'assistant');
    
    let response: any;

    if (isInitialCaseDescription) {
      // FASE 1: Analizza il caso iniziale e genera domande intelligenti
      console.log('📋 FASE 1: Analisi caso iniziale e generazione domande');
      
      const systemPrompt = `Sei Lexy, un assistente AI legale esperto e empatico.
      
L'utente ha appena descritto il suo caso legale. Devi:
1. Analizzare ATTENTAMENTE la situazione descritta
2. Valutare quali informazioni ESSENZIALI mancano per fornire assistenza legale accurata
3. Generare SOLO le domande STRETTAMENTE NECESSARIE (minimo 1, massimo 6)

CRITERI FONDAMENTALI:
- Se il caso è già molto dettagliato → genera 1-2 domande di precisazione
- Se mancano informazioni critiche → genera fino a 6 domande, ma SOLO quelle essenziali
- Ogni domanda deve avere un ALTO VALORE INFORMATIVO
- MAI domande di riempimento o generiche

Le domande devono essere:
- INTELLIGENTI e mostrare comprensione profonda del caso
- ORDINATE per importanza legale/urgenza
- SPECIFICHE e contestualizzate alla situazione
- NON SOVRAPPOSTE (ogni domanda deve coprire un aspetto unico)
- FORMULATE in modo professionale ma comprensibile

Valuta sempre:
- Termini di prescrizione o scadenze urgenti
- Prove e documentazione disponibile
- Parti coinvolte e loro ruoli
- Precedenti azioni legali intraprese
- Obiettivi concreti del cliente

Rispondi SEMPRE in questo formato JSON:
{
  "phase": "initial_analysis",
  "caseAnalysis": {
    "caseType": "tipo di caso identificato",
    "keyFacts": ["fatto chiave 1", "fatto chiave 2"],
    "legalArea": "area del diritto",
    "complexity": "bassa|media|alta",
    "informationCompleteness": "percentuale 0-100 di info già disponibili"
  },
  "questions": [
    {
      "id": 1,
      "text": "domanda specifica e contestualizzata",
      "category": "tempistica|importi|parti|documenti|obiettivi|contesto",
      "importance": "critica|alta|media",
      "reason": "perché questa info è importante per il caso"
    }
  ],
  "estimatedCompleteness": 20
}`;

      const userPrompt = `Il cliente ha descritto il seguente caso:
"${latestResponse}"

Analizza il caso e genera SOLO le domande VERAMENTE NECESSARIE.
IMPORTANTE:
- Se il caso è già sufficientemente dettagliato, genera solo 1-2 domande di approfondimento critico
- Se mancano informazioni fondamentali, genera fino a 6 domande (ma solo quelle essenziali)
- Ogni domanda deve portare valore concreto per la risoluzione del caso
- NON fare domande su informazioni già fornite o implicite
- NON aggiungere domande di "riempimento" solo per arrivare a 6
- Personalizza ogni domanda mostrando che hai compreso il caso specifico`;

      const analysis = await callOpenAI(openAIApiKey, systemPrompt, userPrompt);
      
      console.log('📊 Analisi iniziale completata');
      console.log('Tipo caso:', analysis?.caseAnalysis?.caseType);
      console.log('Numero domande generate:', analysis?.questions?.length || 0);
      
      response = {
        status: "questions_generated",
        phase: "initial_analysis",
        caseAnalysis: analysis.caseAnalysis,
        questions: analysis.questions || [],
        estimatedCompleteness: analysis.estimatedCompleteness || 20
      };
      
    } else {
      // FASE 2: Valuta se abbiamo tutte le risposte necessarie
      console.log('📝 FASE 2: Valutazione completezza risposte');
      
      // Estrai tutte le risposte dell'utente
      const userResponses = previousContext
        .filter((msg: any) => msg.role === 'user')
        .map((msg: any) => msg.content);
      userResponses.push(latestResponse);
      
      // Se abbiamo domande pendenti, verifica se sono state tutte risposte
      const numberOfQuestions = currentQuestions?.length || 0;
      const numberOfResponses = userResponses.length - 1; // -1 per escludere la descrizione iniziale
      
      console.log(`Domande: ${numberOfQuestions}, Risposte: ${numberOfResponses}`);
      console.log(`AllQuestionsAnswered flag from client: ${allQuestionsAnswered}`);
      
      // Se il frontend dice che tutte le domande sono state risposte O abbiamo ricevuto abbastanza risposte
      if (allQuestionsAnswered || numberOfResponses >= numberOfQuestions || numberOfResponses >= 6) {
        console.log('✅ Tutte le domande hanno ricevuto risposta - procedo con generate');
        
        // Prepara il caso completo per la generazione
        const job_id = makeJobId();
        const fullCaseText = userResponses.join('\n\n');
        
        const systemPromptFinal = `Analizza il caso completo e estrai le informazioni chiave per il report legale.

Rispondi in formato JSON:
{
  "caseType": "tipo di caso",
  "keyFacts": ["fatto 1", "fatto 2"],
  "legalIssues": ["questione legale 1", "questione legale 2"],
  "suggestedKeywords": ["keyword1", "keyword2"],
  "recommendedDocuments": ["documento1", "documento2"],
  "summary": "riassunto breve del caso"
}`;

        const finalAnalysis = await callOpenAI(
          openAIApiKey,
          systemPromptFinal,
          `Caso completo:\n${fullCaseText}`
        );
        
        console.log('📤 Handoff a generate function');
        
        const generatePayload = {
          job_id,
          caseType: finalAnalysis?.caseType || "general",
          caseData: {
            previousContext: conversationHistory,
            caseText: fullCaseText,
            fromPrecheck: {
              keyFacts: finalAnalysis?.keyFacts || [],
              legalIssues: finalAnalysis?.legalIssues || [],
              suggestedKeywords: finalAnalysis?.suggestedKeywords || [],
              recommendedDocuments: finalAnalysis?.recommendedDocuments || [],
              summary: finalAnalysis?.summary || ""
            },
          },
          meta: {
            requestedAt: new Date().toISOString(),
            source: "precheck",
            userAgent: req.headers.get("user-agent") ?? null,
          },
        };

        await handoffToGenerate(projectRef, serviceRoleKey, generatePayload);
        
        response = {
          status: "complete",
          job_id,
          message: "Ho raccolto tutte le informazioni necessarie. Sto preparando il tuo report legale completo...",
          analysis: finalAnalysis
        };
        
      } else {
        // Ancora in attesa di risposte
        console.log('⏳ In attesa di ulteriori risposte');
        
        response = {
          status: "waiting_responses",
          remainingQuestions: numberOfQuestions - numberOfResponses,
          message: "Grazie per la risposta. Continua a rispondere alle domande."
        };
      }
    }

    return jsonResponse(response);
    
  } catch (error) {
    console.error("=== PRECHECK ERROR ===");
    console.error("Error:", String(error));
    return jsonResponse(
      { error: "Internal error", details: String(error) },
      500
    );
  }
});