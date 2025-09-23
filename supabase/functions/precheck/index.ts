// supabase/functions/precheck/index.ts
// Funzione di triage: se incomplete → guida l’utente; se complete → handoff a `generate`

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
    model: "gpt-4o-mini", // Già ottimizzato per velocità
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2, // Più deterministic per risposte consistenti
    max_tokens: 800, // Ridotto per risposte più rapide
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

  // mini-retry per 429/5xx
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
  // con response_format=json_object dovrebbe già essere JSON puro
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

    const { latestResponse = "", previousContext = [] } = body ?? {};
    
    // Enhanced logging for debugging
    console.log('=== PRECHECK START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Latest Response:', latestResponse);
    console.log('Previous Context Type:', Array.isArray(previousContext) ? 'array' : typeof previousContext);
    console.log('Previous Context Length:', Array.isArray(previousContext) ? previousContext.length : 0);
    
    // Log conversation flow
    if (Array.isArray(previousContext) && previousContext.length > 0) {
      console.log('--- Conversation History ---');
      previousContext.forEach((msg: any, idx: number) => {
        console.log(`[${idx}] ${msg.role}: ${msg.content?.substring(0, 50)}...`);
      });
      
      const lastAssistantMessage = [...previousContext].reverse().find((msg: any) => msg.role === 'assistant');
      const lastUserMessage = [...previousContext].reverse().find((msg: any) => msg.role === 'user');
      console.log('Last Assistant Question:', lastAssistantMessage?.content || 'none');
      console.log('Last User Response:', lastUserMessage?.content || 'none');
      console.log('Current User Response:', latestResponse);
      
      // Check for potential issues
      if (lastUserMessage && lastUserMessage.content === latestResponse) {
        console.warn('⚠️ WARNING: Current response matches last user message - possible duplicate!');
      }
    }
    
    // Validate input
    if (!latestResponse || typeof latestResponse !== "string" || !latestResponse.trim()) {
      return jsonResponse({ error: "Latest response is required" }, 400);
    }

    // Env
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const projectRef = Deno.env.get("SP_PROJECT_REF"); // Use correct env var
    const serviceRoleKey = Deno.env.get("SP_SERVICE_ROLE_KEY"); // Use correct env var
    if (!openAIApiKey) return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 500);
    if (!projectRef)   return jsonResponse({ error: "SP_PROJECT_REF not configured" }, 500);
    if (!serviceRoleKey) return jsonResponse({ error: "SP_SERVICE_ROLE_KEY not configured" }, 500);

    // Build conversation history with validation
    let conversationHistory = '';
    if (Array.isArray(previousContext)) {
      conversationHistory = previousContext.map((msg: any) => 
        `${msg.role === 'user' ? 'Utente' : 'Assistente'}: ${msg.content}`
      ).join('\n');
    }
    
    console.log('Conversation History Built:', conversationHistory ? 'yes' : 'no');
    console.log('History Length:', conversationHistory.length);

    // LIMITE MASSIMO 6 DOMANDE - Calcolo intelligente della completezza
    const messageCount = Array.isArray(previousContext) ? previousContext.length : 0;
    const userMessages = Array.isArray(previousContext) ? 
      previousContext.filter((msg: any) => msg.role === 'user').length : 0;
    const questionsAsked = Math.floor(messageCount / 2); // Ogni scambio ha 2 messaggi
    
    // FORZA COMPLETAMENTO DOPO 6 DOMANDE
    const maxQuestions = 6;
    let completenessScore = 0;
    const collectedInfo: string[] = [];
    const allResponses = conversationHistory.toLowerCase() + ' ' + latestResponse.toLowerCase();
    
    // Se abbiamo raggiunto il limite, forza completamento
    if (questionsAsked >= maxQuestions) {
      completenessScore = 100;
      console.log(`🔴 LIMITE RAGGIUNTO: ${questionsAsked} domande su massimo ${maxQuestions}`);
    } else {
      // Calcolo progressivo basato sul numero di domande (aumenta rapidamente)
      completenessScore = Math.min(90, (questionsAsked / maxQuestions) * 100);
      
      // Tipo di problema (20%)
      if (allResponses.includes('multa') || allResponses.includes('contratto') || allResponses.includes('lavoro') || 
          allResponses.includes('incidente') || allResponses.includes('affitto') || allResponses.includes('danni') ||
          allResponses.includes('pagat') || allResponses.includes('licenzia')) {
        completenessScore += 20;
        collectedInfo.push('tipo_problema');
      }
      
      // Obiettivo (15%)
      if (allResponses.includes('annull') || allResponses.includes('rimbors') || allResponses.includes('risarciment') ||
          allResponses.includes('accord') || allResponses.includes('contestar') || allResponses.includes('ottenere') ||
          allResponses.includes('voglio') || allResponses.includes('vorrei')) {
        completenessScore += 15;
        collectedInfo.push('obiettivo');
      }
      
      // Date/tempi (10%)
      const datePatterns = /\d+\s*(mesi|giorni|anni|settimane)|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|\d{4}|\d{1,2}\/\d{1,2}/i;
      if (datePatterns.test(allResponses)) {
        completenessScore += 10;
        collectedInfo.push('quando');
      }
      
      // Importi (10%)
      const amountPatterns = /\d+[\.\,]?\d*\s*(euro|€)|migliaia?|centinaia/i;
      if (amountPatterns.test(allResponses)) {
        completenessScore += 10;
        collectedInfo.push('importi');
      }
      
      // Parti coinvolte (10%)
      if (allResponses.includes('datore') || allResponses.includes('azienda') || allResponses.includes('proprietario') ||
          allResponses.includes('comune') || allResponses.includes('assicurazione') || allResponses.includes('banca')) {
        completenessScore += 10;
        collectedInfo.push('parti_coinvolte');
      }
      
      // Boost se l'utente ha fornito risposte dettagliate
      if (latestResponse.length > 50) completenessScore += 5;
      if (latestResponse.length > 100) completenessScore += 5;
    }
    
    const systemPrompt = `Sei Lexy, un assistente AI conversazionale e intelligente.

STATO CONVERSAZIONE:
- Domande fatte: ${questionsAsked} su massimo ${maxQuestions}
- Completezza: ${completenessScore}%
${questionsAsked >= maxQuestions ? '⚠️ LIMITE DOMANDE RAGGIUNTO - CASO COMPLETO!' : ''}

ANALISI CONVERSAZIONE:
${conversationHistory ? conversationHistory : 'Prima risposta dell\'utente'}
ULTIMA RISPOSTA: "${latestResponse}"

INFORMAZIONI RACCOLTE:
- Tipo di problema: ${collectedInfo.includes('tipo_problema') ? '✓' : '❌'}
- Obiettivo desiderato: ${collectedInfo.includes('obiettivo') ? '✓' : '❌'}
- Quando è successo: ${collectedInfo.includes('quando') ? '✓' : '❌'}
- Importi coinvolti: ${collectedInfo.includes('importi') ? '✓' : '❌'}
- Parti coinvolte: ${collectedInfo.includes('parti_coinvolte') ? '✓' : '❌'}

REGOLE ASSOLUTE:
1. MASSIMO ${maxQuestions} DOMANDE - Hai fatto ${questionsAsked} domande
2. Se completezza >= 80% o domande >= ${maxQuestions}, COMPLETA SUBITO
3. NON ripetere domande già fatte
4. Sii conversazionale e conciso
5. Se l'utente dice "non so", accetta e vai avanti

Rispondi SEMPRE in questo formato JSON:
{
  "completeness": {
    "score": ${completenessScore},
    "status": "${completenessScore >= 80 ? 'complete' : 'needs_more_info'}",
    "missingElements": [/* solo se < 80% */]
  },
  "nextQuestion": ${completenessScore >= 80 ? 'null' : '{
    "text": "domanda breve e mirata",
    "category": "tipo_domanda",
    "quickReplies": ["Sì", "No", "Non so"] // suggerimenti risposte rapide
  }'},
  "analysis": {
    "caseType": "tipo caso",
    "keyFacts": ["fatto chiave 1", "fatto chiave 2"],
    "suggestedKeywords": ["keyword1", "keyword2"],
    "recommendedDocuments": ["doc1", "doc2"]
  }
}`;

    const userPrompt = `ISTRUZIONI PER L'ANALISI:

1. COMPRENDI IL CONTESTO: L'utente sta descrivendo: ${latestResponse}
2. VALUTA COSA HAI GIÀ: Controlla le informazioni raccolte sopra
3. DECIDI:
   - Se completezza >= 80% → status = "complete", NO nextQuestion
   - Se < 80% → chiedi UNA SOLA cosa che manca davvero
   
4. EVITA RIPETIZIONI:
   - Se hai già chiesto qualcosa, NON richiederla
   - Se l'utente dice "non so", accetta e vai avanti
   - Se l'utente ha dato info parziali, accettale

5. SII INTELLIGENTE:
   - Interpreta le risposte nel contesto
   - "5000 euro" = ha dato l'importo, non chiedere di nuovo
   - "il mio datore" = ha detto chi è coinvolto
   - "due mesi fa" = ha detto quando

IMPORTANTE: Se hai abbastanza info per capire il caso (>80%), COMPLETA SUBITO.`;

    // Analizza con OpenAI
    console.log('Calling OpenAI for analysis...');
    const precheck = await callOpenAI(openAIApiKey, systemPrompt, userPrompt);
    console.log('=== OpenAI Response ===');
    console.log('Completeness Score:', precheck?.completeness?.score);
    console.log('Status:', precheck?.completeness?.status);
    console.log('Next Question:', precheck?.nextQuestion?.text);
    console.log('Missing Elements:', precheck?.completeness?.missingElements);
    console.log('Key Facts:', precheck?.analysis?.keyFacts);
    
    // Validation check
    if (previousContext.length > 0) {
      const lastAssistantMsg = [...previousContext].reverse().find((m: any) => m.role === 'assistant');
      if (lastAssistantMsg && precheck?.nextQuestion?.text) {
        const similarity = lastAssistantMsg.content.toLowerCase().includes(
          precheck.nextQuestion.text.substring(0, 20).toLowerCase()
        );
        if (similarity) {
          console.warn('⚠️ POTENTIAL DUPLICATE QUESTION DETECTED!');
        }
      }
    }

    // Valuta completezza con soglia più bassa per evitare loop
    const score: number = Number(precheck?.completeness?.score ?? 0);
    const status: string = String(precheck?.completeness?.status ?? "").toLowerCase();
    const isComplete = status === "complete" || score >= 80; // Abbassata soglia a 80%

    if (!isComplete) {
      // Torna solo le info utili a proseguire la raccolta dati
      return jsonResponse({
        status: "needs_more_info",
        completeness: precheck?.completeness ?? null,
        nextQuestion: precheck?.nextQuestion ?? null,
      });
    }

    // Caso completo → crea job e inoltra a `generate`
    const job_id = makeJobId();
    
    // Collect all user responses for the complete case text
    const userResponses = Array.isArray(previousContext) 
      ? previousContext.filter((msg: any) => msg.role === 'user').map((msg: any) => msg.content)
      : [];
    userResponses.push(latestResponse);
    const fullCaseText = userResponses.join('\n');
    
    console.log('Full case text length:', fullCaseText.length);
    console.log('Number of user responses:', userResponses.length);

    const generatePayload = {
      job_id,
      caseType: "general",
      caseData: {
        previousContext: conversationHistory,
        caseText: fullCaseText,
        fromPrecheck: {
          keyFacts: precheck?.analysis?.keyFacts ?? [],
          legalIssues: precheck?.analysis?.legalIssues ?? [],
          suggestedKeywords: precheck?.analysis?.suggestedKeywords ?? [],
          relevantInstitutes: precheck?.analysis?.relevantInstitutes ?? [],
          recommendedDocuments: precheck?.analysis?.recommendedDocuments ?? [],
        },
      },
      meta: {
        requestedAt: new Date().toISOString(),
        source: "precheck",
        userAgent: req.headers.get("user-agent") ?? null,
        ip: req.headers.get("x-forwarded-for") ?? null,
      },
    };

    // (opzionale ma consigliato) qui potresti creare una riga in DB `jobs` con status PENDING
    // usando la service key via supabase-js. Ometto per brevità.

    await handoffToGenerate(projectRef, serviceRoleKey, generatePayload);

    // Risposta al client: include sempre completeness per evitare errori nel frontend
    return new Response(JSON.stringify({ 
      status: "queued", 
      job_id,
      completeness: {
        score: 100,
        status: "complete",
        missingElements: []
      },
      analysis: precheck?.analysis ?? null
    }), {
      status: 202,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("=== PRECHECK ERROR ===");
    console.error("Error Type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error Message:", String(error));
    console.error("Stack Trace:", error instanceof Error ? error.stack : 'No stack trace');
    return jsonResponse(
      { error: "Internal error", details: String(error) },
      500
    );
  }
});
