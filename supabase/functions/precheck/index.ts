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

    const { caseText, latestResponse = "", caseType = "general", previousContext = null } = body ?? {};
    // Se non c'è né caseText né latestResponse, errore
    if ((!caseText || typeof caseText !== "string" || !caseText.trim()) && 
        (!latestResponse || typeof latestResponse !== "string" || !latestResponse.trim())) {
      return jsonResponse({ error: "Case text or latest response is required" }, 400);
    }

    // Env
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const projectRef = Deno.env.get("SP_PROJECT_REF"); // Use correct env var
    const serviceRoleKey = Deno.env.get("SP_SERVICE_ROLE_KEY"); // Use correct env var
    if (!openAIApiKey) return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 500);
    if (!projectRef)   return jsonResponse({ error: "SP_PROJECT_REF not configured" }, 500);
    if (!serviceRoleKey) return jsonResponse({ error: "SP_SERVICE_ROLE_KEY not configured" }, 500);

    // Prompt system per analisi legale
    const systemPrompt = `Sei un assistente legale AI esperto nel diritto italiano. Il tuo compito è analizzare un caso legale e guidare l'utente nella raccolta delle informazioni necessarie.

${previousContext ? `CONVERSAZIONE FINORA:
${previousContext}

ULTIMA RISPOSTA DELL'UTENTE: "${latestResponse}"

REGOLE CRITICHE PER EVITARE LOOP:
1. Se hai chiesto "Cosa vuoi ottenere?" e l'utente risponde con una parola come "annullamento", "rimborso", "risarcimento", ecc., ACCETTA questa risposta e PASSA alla prossima domanda
2. NON ripetere MAI la stessa domanda due volte
3. Ogni risposta dell'utente, anche breve, è valida - procedi con la domanda successiva
4. Se l'utente ha già fornito informazioni su un aspetto, non chiederle di nuovo
5. Esempi di risposte valide a "Cosa vuoi ottenere?": "annullamento", "ricorso", "opposizione", "risarcimento", "rimborso"

PROGRESSIONE TIPICA:
- Prima domanda: "Di che tipo di problema legale si tratta?" → risposta: "multa"
- Seconda domanda: "Cosa vuoi ottenere?" → risposta: "annullamento"
- Terza domanda: "Quando hai ricevuto la multa?" → risposta: [data]
- Continua con domande diverse finché non hai informazioni sufficienti` : ''}

Analizza le informazioni fornite e determina:
1. Quali informazioni sono già state raccolte
2. Quali informazioni critiche mancano ancora
3. La prossima domanda specifica da fare (MAI ripetere una domanda già fatta)

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
      ? `L'utente ha appena risposto: "${latestResponse}"\n\nRisposte accumulate finora:\n${caseText}\n\nAnalizza se hai bisogno di ulteriori informazioni o se puoi procedere. NON ripetere domande già fatte.`
      : `Nuovo caso legale:\n${caseText || latestResponse}\n\nTipo di caso: ${caseType}`;

    // Analizza con OpenAI
    const precheck = await callOpenAI(openAIApiKey, systemPrompt, userPrompt);

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

    const generatePayload = {
      job_id,
      caseType,
      caseData: {
        previousContext,
        caseText,
        // opzionale: passaggi utili estratti da precheck (senza esporre tutto al client)
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
    console.error("precheck error:", error);
    return jsonResponse(
      { error: "Internal error", details: String(error) },
      500
    );
  }
});
