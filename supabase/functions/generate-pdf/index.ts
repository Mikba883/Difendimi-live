import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PII Scrubbing function
function scrubPII(text: string): string {
  if (!text) return '';
  
  // Email
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // Phone numbers (Italian format)
  text = text.replace(/(\+39\s?)?[\d\s\-\.\/\(\)]{10,15}/g, '[TELEFONO]');
  
  // Codice Fiscale
  text = text.replace(/[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/gi, '[CF]');
  
  // IBAN
  text = text.replace(/IT\d{2}[A-Z]\d{22}/gi, '[IBAN]');
  
  // CAP (Italian postal codes)
  text = text.replace(/\b\d{5}\b/g, '[CAP]');
  
  // Targhe auto
  text = text.replace(/[A-Z]{2}\s?\d{3}\s?[A-Z]{2}/gi, '[TARGA]');
  
  // Protocolli/Verbali
  text = text.replace(/(?:protocollo|verbale|prot\.|n\.)\s*[\d\/\-]+/gi, '[PROTOCOLLO]');
  
  // Dates (keep only year or replace with placeholder)
  text = text.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATA]');
  text = text.replace(/\d{1,2}\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}/gi, '[DATA]');
  
  // Common Italian names (basic list - would need expansion)
  const commonNames = ['Mario', 'Luigi', 'Giuseppe', 'Giovanni', 'Francesco', 'Antonio', 'Maria', 'Anna', 'Rosa', 'Giuseppina'];
  const commonSurnames = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'];
  
  commonNames.forEach(name => {
    text = text.replace(new RegExp(`\\b${name}\\b`, 'gi'), '[NOME]');
  });
  
  commonSurnames.forEach(surname => {
    text = text.replace(new RegExp(`\\b${surname}\\b`, 'gi'), '[COGNOME]');
  });
  
  // Company names (basic patterns)
  text = text.replace(/(?:S\.r\.l\.|S\.p\.A\.|S\.n\.c\.|S\.a\.s\.)[\s\w]+/gi, '[AZIENDA]');
  
  // Addresses (basic pattern)
  text = text.replace(/(?:Via|Viale|Piazza|Corso|Largo)\s+[\w\s\,]+\d+/gi, '[INDIRIZZO]');
  
  return text;
}

// Function to determine which documents to generate
function determineDocuments(caseData: any): { 
  generateDiffida: boolean; 
  generateADR: boolean;
  diffidaReason?: string;
  adrReason?: string;
} {
  const areaOfLaw = caseData.area_of_law || [];
  const classification = caseData.classification || {};
  const report = caseData.report || {};
  
  // Check for diffida generation - expanded to include all relevant areas
  const diffidaAreas = [
    'consumatore', 'commerciale', 'lavoro', 'condominio', 'locazioni',
    'contratti', 'obbligazioni', 'responsabilità', 'risarcimento',
    'civile', 'societario'
  ];
  const shouldGenerateDiffida = areaOfLaw.some((area: string) => 
    diffidaAreas.some(d => area.toLowerCase().includes(d))
  ) || (classification?.objectives && classification.objectives.includes('risarcimento'));
  
  // Check for ADR generation - expanded to include more areas
  const adrAreas = [
    'consumatore', 'condominio', 'lavoro', 'energia', 'telecomunicazioni',
    'bancario', 'assicurativo', 'civile', 'commerciale', 'sanitario'
  ];
  const shouldGenerateADR = areaOfLaw.some((area: string) => 
    adrAreas.some(a => area.toLowerCase().includes(a))
  );
  
  // Generate basic documents for administrative and criminal law
  const isAdministrativeOrCriminal = areaOfLaw.some((area: string) => 
    area.toLowerCase().includes('amministrativo') || 
    area.toLowerCase().includes('penale') ||
    area.toLowerCase().includes('tributario')
  );
  
  // For administrative/criminal cases, still generate basic documents but not diffida/ADR
  const finalGenerateDiffida = !isAdministrativeOrCriminal && shouldGenerateDiffida;
  const finalGenerateADR = !isAdministrativeOrCriminal && shouldGenerateADR;
  
  return {
    generateDiffida: finalGenerateDiffida,
    generateADR: finalGenerateADR,
    diffidaReason: finalGenerateDiffida ? `Caso rientrante in materia ${areaOfLaw.join(', ')}` : undefined,
    adrReason: finalGenerateADR ? `ADR consigliata per materia ${areaOfLaw.join(', ')}` : undefined
  };
}

// Create PDF from content
async function createPDF(title: string, content: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 14;
  const fontSize = 11;
  const titleFontSize = 16;
  
  // Add first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // Title
  page.drawText(title, {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= titleFontSize + 20;
  
  // Content - split into lines
  const lines = content.split('\n');
  for (const line of lines) {
    // Check if we need a new page
    if (yPosition < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }
    
    // Determine if this is a header (starts with ##)
    const isHeader = line.startsWith('##');
    const text = isHeader ? line.replace(/^##\s*/, '') : line;
    const currentFont = isHeader ? boldFont : font;
    const currentSize = isHeader ? fontSize + 2 : fontSize;
    
    // Word wrap for long lines
    const maxWidth = pageWidth - (2 * margin);
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
      
      if (testWidth > maxWidth && currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: currentSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
        currentLine = word;
        
        // Check for new page
        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw remaining text
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: yPosition,
        size: currentSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
    
    // Extra space after headers
    if (isHeader) {
      yPosition -= 10;
    }
  }
  
  return pdfDoc.save();
}

// Generate content using OpenAI
async function generateContent(type: string, caseData: any, openAIKey: string): Promise<string> {
  const scrubbedCase = {
    ...caseData,
    case_text: scrubPII(caseData.case_text || ''),
    previous_context: scrubPII(caseData.previous_context || ''),
  };
  
  let systemPrompt = '';
  let userPrompt = '';
  
  switch (type) {
    case 'relazione_preliminare':
      systemPrompt = `Sei un esperto avvocato italiano. Genera una relazione preliminare professionale basata sul caso fornito.
      La relazione deve includere:
      1. Sintesi del problema
      2. Principali evidenze e fatti rilevanti
      3. Percorso legale consigliato
      4. Primi passi operativi
      5. Valutazione preliminare dei rischi
      Usa un linguaggio professionale ma accessibile. Non includere dati personali.`;
      userPrompt = `Genera una relazione preliminare per questo caso:\n${JSON.stringify(scrubbedCase.report || scrubbedCase)}`;
      break;
      
    case 'riferimenti_giuridici':
      systemPrompt = `Sei un esperto di diritto italiano ed europeo. Identifica e cita integralmente gli articoli di legge pertinenti.
      Per ogni norma:
      1. Cita il testo completo dell'articolo
      2. Indica la fonte ufficiale (Normattiva per leggi italiane, EUR-Lex per normative EU)
      3. Spiega la pertinenza al caso
      Cerca di identificare tutti gli articoli rilevanti, sia di diritto sostanziale che procedurale.`;
      userPrompt = `Identifica i riferimenti giuridici per questo caso:\n${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'diffida_messa_in_mora':
      systemPrompt = `Sei un avvocato italiano. Genera una diffida/messa in mora formale e professionale.
      La diffida deve contenere:
      1. Intestazione con placeholder per mittente e destinatario
      2. Oggetto chiaro
      3. Esposizione dei fatti
      4. Richieste specifiche
      5. Termine per l'adempimento (15 giorni)
      6. Avvertenze legali
      Usa placeholder [MITTENTE], [DESTINATARIO], [DATA], etc. per i dati personali.`;
      userPrompt = `Genera una diffida per questo caso:\n${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'istanza_adr_odr':
      systemPrompt = `Sei un esperto di ADR/ODR in Italia. Genera un'istanza di conciliazione/mediazione.
      L'istanza deve includere:
      1. Intestazione all'organismo di mediazione
      2. Dati delle parti (con placeholder)
      3. Oggetto della controversia
      4. Ricostruzione dei fatti
      5. Pretese e motivazioni
      6. Documentazione allegata
      7. Richiesta di convocazione
      Identifica l'organismo appropriato per la materia.`;
      userPrompt = `Genera un'istanza ADR/ODR per questo caso:\n${JSON.stringify(scrubbedCase)}`;
      break;
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get case ID from request
    const { caseId } = await req.json();
    if (!caseId) {
      throw new Error('Case ID is required');
    }

    console.log('Generating PDFs for case:', caseId);

    // Fetch case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError) {
      console.error('Error fetching case:', caseError);
      throw new Error('Failed to fetch case data');
    }

    if (!caseData) {
      throw new Error('Case not found');
    }

    // Get OpenAI API key
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Determine which documents to generate
    const { generateDiffida, generateADR, diffidaReason, adrReason } = determineDocuments(caseData);
    
    console.log('Document generation plan:', { generateDiffida, generateADR });

    // Generate documents
    const documents = [];

    // 1. Relazione Preliminare (always)
    console.log('Generating relazione preliminare...');
    const relazioneContent = await generateContent('relazione_preliminare', caseData, openAIKey);
    const relazionePdf = await createPDF('Relazione Preliminare', relazioneContent);
    documents.push({
      id: 'relazione_preliminare',
      title: 'Relazione Preliminare',
      rationale: 'Documento di sintesi del caso con analisi e raccomandazioni',
      content: btoa(String.fromCharCode(...relazionePdf)),
      size_bytes: relazionePdf.length
    });

    // 2. Riferimenti Giuridici (always)
    console.log('Generating riferimenti giuridici...');
    const riferimentiContent = await generateContent('riferimenti_giuridici', caseData, openAIKey);
    const riferimentiPdf = await createPDF('Riferimenti Giuridici', riferimentiContent);
    documents.push({
      id: 'riferimenti_giuridici',
      title: 'Riferimenti Giuridici',
      rationale: 'Raccolta completa delle norme applicabili con testo integrale',
      content: btoa(String.fromCharCode(...riferimentiPdf)),
      size_bytes: riferimentiPdf.length
    });

    // 3. Diffida (optional)
    if (generateDiffida) {
      console.log('Generating diffida...');
      const diffidaContent = await generateContent('diffida_messa_in_mora', caseData, openAIKey);
      const diffidaPdf = await createPDF('Diffida e Messa in Mora', diffidaContent);
      documents.push({
        id: 'diffida_messa_in_mora',
        title: 'Diffida e Messa in Mora',
        rationale: diffidaReason || 'Documento formale di diffida',
        content: btoa(String.fromCharCode(...diffidaPdf)),
        size_bytes: diffidaPdf.length
      });
    }

    // 4. Istanza ADR/ODR (optional)
    if (generateADR) {
      console.log('Generating istanza ADR...');
      const adrContent = await generateContent('istanza_adr_odr', caseData, openAIKey);
      const adrPdf = await createPDF('Istanza ADR/ODR', adrContent);
      documents.push({
        id: 'istanza_adr_odr',
        title: 'Istanza ADR/ODR/Conciliazione',
        rationale: adrReason || 'Richiesta di mediazione/conciliazione',
        content: btoa(String.fromCharCode(...adrPdf)),
        size_bytes: adrPdf.length
      });
    }

    // Prepare summary
    const summary = scrubPII(caseData.case_text || caseData.previous_context || 'Caso senza descrizione testuale');

    console.log(`Successfully generated ${documents.length} documents`);

    return new Response(
      JSON.stringify({
        success: true,
        documents,
        summary: summary.substring(0, 200) + '...',
        caseId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate PDFs' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
