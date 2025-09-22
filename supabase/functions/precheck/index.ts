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

    // Prompt system per analisi legale con tracking migliorato
    const systemPrompt = `Sei un assistente legale AI esperto nel diritto italiano. Stai guidando l'utente nella raccolta di informazioni per il suo caso legale.

${conversationHistory ? `CONVERSAZIONE PRECEDENTE:
${conversationHistory}

ULTIMA RISPOSTA DELL'UTENTE (NUOVA): "${latestResponse}"` : `PRIMA RISPOSTA DELL'UTENTE: "${latestResponse}"`}

TRACKER DOMANDE GIÀ FATTE:
${conversationHistory ? `Analizza la conversazione e identifica quali domande sono già state fatte. NON ripeterle.` : 'Prima interazione'}

REGOLE CRITICHE ANTI-LOOP:
1. ANALIZZA PRIMA: Controlla SEMPRE quali domande hai già fatto nella conversazione
2. MAI DUPLICARE: Se hai già chiesto qualcosa, NON chiederlo di nuovo in nessuna forma
3. RISPOSTE BREVI VALIDE: "sì", "no", "annullamento", "rimborso" SONO risposte complete e valide
4. PROGRESSIONE OBBLIGATORIA: Ogni turno DEVE avanzare nella raccolta informazioni
5. GESTIONE RISPOSTE AMBIGUE:
   - "sì"/"no" dopo una domanda → accetta e passa alla domanda successiva
   - "dopo"/"non so"/"non ricordo" → chiedi in modo diverso O passa avanti
   - Risposte scherzose → riformula più chiaramente
   
SEQUENZA DOMANDE (salta quelle con risposta già data):
1. ✓ Tipo di problema (multa, contratto, lavoro, etc.) 
2. ✓ Obiettivo (annullamento, rimborso, risarcimento, etc.)
3. ✓ Date/periodo (quando è successo)
4. ✓ Importi coinvolti (se applicabile)
5. ✓ Azioni intraprese (cosa hai già fatto)
6. ✓ Documentazione (cosa possiedi)
7. ✓ Urgenza/scadenze

ANALISI INTELLIGENTE:
- Estrai informazioni implicite dalle risposte
- Se l'utente menziona "multa" → hai già il tipo di problema
- Se dice "voglio annullamento" → hai già l'obiettivo
- Se dice "ieri" o "settimana scorsa" → hai già la data
- NON chiedere ciò che è già chiaro dal contesto

Devi rispondere SEMPRE in formato JSON con questa struttura:
{
  "completeness": {
    "score": 0-100,
    "status": "incomplete|sufficient|complete",
    "missingElements": ["elemento1", "elemento2"]
  },
  "nextQuestion": {
    "text": "domanda specifica NUOVA e MAI fatta prima",
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

    const userPrompt = `ANALIZZA LA CONVERSAZIONE E L'ULTIMA RISPOSTA.

CONTROLLO ANTI-DUPLICAZIONE:
1. Identifica l'ultima domanda che hai fatto
2. Verifica che la nuova domanda sia DIVERSA
3. Se stai per ripetere, SALTA alla domanda successiva

INTERPRETAZIONE RISPOSTE:
- "annullamento" = obiettivo chiaro, passa oltre
- "sì"/"no" dopo domanda = risposta valida, continua
- "dopo"/"non so" = riformula O passa avanti
- Risposte brevi SONO valide se pertinenti

DECISIONE:
Se hai informazioni su tipo problema + obiettivo + almeno 2 altri elementi → puoi considerare il caso sufficiente.
Altrimenti, fai la PROSSIMA domanda NON ancora fatta.`;

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

    // Valuta completezza
    const score: number = Number(precheck?.completeness?.score ?? 0);
    const status: string = String(precheck?.completeness?.status ?? "").toLowerCase();
    const isComplete = status === "complete" || score >= 90;

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
