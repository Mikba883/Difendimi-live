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
  generateEmailAvvocato: boolean;
  generateLetteraRisposta: boolean;
  diffidaReason?: string;
  adrReason?: string;
  emailAvvocatoReason?: string;
  letteraRispostaReason?: string;
} {
  const areaOfLaw = caseData.area_of_law || [];
  const classification = caseData.classification || {};
  const report = caseData.report || {};
  const objectives = classification?.objectives || [];
  
  // Check for diffida generation - expanded to include all relevant areas
  const diffidaAreas = [
    'consumatore', 'commerciale', 'lavoro', 'condominio', 'locazioni',
    'contratti', 'obbligazioni', 'responsabilità', 'risarcimento',
    'civile', 'societario'
  ];
  const shouldGenerateDiffida = areaOfLaw.some((area: string) => 
    diffidaAreas.some(d => area.toLowerCase().includes(d))
  ) || objectives.includes('risarcimento') || objectives.includes('adempimento');
  
  // Check for ADR generation - expanded to include more areas
  const adrAreas = [
    'consumatore', 'condominio', 'lavoro', 'energia', 'telecomunicazioni',
    'bancario', 'assicurativo', 'civile', 'commerciale', 'sanitario'
  ];
  const shouldGenerateADR = areaOfLaw.some((area: string) => 
    adrAreas.some(a => area.toLowerCase().includes(a))
  );
  
  // Email avvocato - generate when legal action is contemplated
  const shouldGenerateEmailAvvocato = objectives.some((obj: string) => 
    ['risarcimento', 'azione legale', 'controversia', 'giudizio', 'tribunale', 'causa']
      .some(term => obj.toLowerCase().includes(term))
  ) || classification?.legal_complexity === 'high';
  
  // Lettera di risposta/contestazione - generate when there's a counterparty to respond to
  const shouldGenerateLetteraRisposta = objectives.some((obj: string) =>
    ['contestazione', 'risposta', 'replica', 'opposizione', 'reclamo']
      .some(term => obj.toLowerCase().includes(term))
  ) || (classification?.counterparty && classification.counterparty !== 'unknown');
  
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
    generateEmailAvvocato: shouldGenerateEmailAvvocato,
    generateLetteraRisposta: shouldGenerateLetteraRisposta,
    diffidaReason: finalGenerateDiffida ? `Caso rientrante in materia ${areaOfLaw.join(', ')}` : undefined,
    adrReason: finalGenerateADR ? `ADR consigliata per materia ${areaOfLaw.join(', ')}` : undefined,
    emailAvvocatoReason: shouldGenerateEmailAvvocato ? `Consulenza legale consigliata` : undefined,
    letteraRispostaReason: shouldGenerateLetteraRisposta ? `Risposta formale necessaria` : undefined
  };
}

// Clean and format content for PDF
function cleanContent(content: string): string {
  // Process text while preserving structure
  let cleaned = content
    // First preserve paragraph structure
    .replace(/\n\n+/g, '§PARAGRAPH§')
    // Preserve single newlines after sentences
    .replace(/([.!?:])\s*\n/g, '$1§LINEBREAK§')
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Convert markdown headers to uppercase text with spacing
    .replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n')
    // Remove code blocks
    .replace(/```[^`]*```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Convert bullet points to proper format
    .replace(/^[\*\-]\s+/gm, '• ')
    // Handle numbered lists
    .replace(/^\d+\.\s+/gm, (match) => match)
    // Remove extra horizontal spaces
    .replace(/[ \t]+/g, ' ')
    // Restore paragraph breaks
    .replace(/§PARAGRAPH§/g, '\n\n')
    // Restore line breaks after sentences
    .replace(/§LINEBREAK§/g, '\n')
    // Add space after punctuation if missing
    .replace(/([.!?,;:])([A-Z])/g, '$1 $2')
    // Clean up multiple spaces
    .replace(/ {2,}/g, ' ')
    // Ensure proper spacing after bullet points
    .replace(/•\s*/g, '• ')
    .trim();
  
  return cleaned;
}

// Create PDF from content with improved formatting
async function createPDF(title: string, content: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  // A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 60;
  const lineHeight = 16;
  const paragraphSpacing = 8;
  const fontSize = 11;
  const titleFontSize = 18;
  const headerFontSize = 14;
  
  // Clean content
  const cleanedContent = cleanContent(content);
  
  // Add first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // Add date in top right
  const currentDate = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dateWidth = font.widthOfTextAtSize(currentDate, 10);
  page.drawText(currentDate, {
    x: pageWidth - margin - dateWidth,
    y: yPosition,
    size: 10,
    font: italicFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Title
  yPosition -= 30;
  const titleLines = title.split('\n');
  for (const titleLine of titleLines) {
    const titleWidth = boldFont.widthOfTextAtSize(titleLine, titleFontSize);
    page.drawText(titleLine, {
      x: (pageWidth - titleWidth) / 2, // Center title
      y: yPosition,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= titleFontSize + 5;
  }
  
  // Separator line
  yPosition -= 10;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: pageWidth - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 20;
  
  // Process content paragraphs
  const paragraphs = cleanedContent.split('\n\n');
  
  for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
    const paragraph = paragraphs[pIndex];
    const lines = paragraph.split('\n');
    
    for (const line of lines) {
      // Check for headers (lines that are all caps or start with specific keywords)
      const isHeader = line.length < 100 && (
        line === line.toUpperCase() ||
        line.startsWith('SEZIONE') ||
        line.startsWith('ARTICOLO') ||
        line.startsWith('PARTE')
      );
      
      // Check for bullet points
      const isBullet = line.startsWith('• ');
      const isNumbered = /^\d+\.\s/.test(line);
      
      // Select font and size
      const currentFont = isHeader ? boldFont : font;
      const currentSize = isHeader ? headerFontSize : fontSize;
      const indent = isBullet || isNumbered ? 20 : 0;
      
      // Remove bullet/number for text measurement
      const textToRender = isBullet ? line.substring(2) : 
                           isNumbered ? line.replace(/^\d+\.\s/, '') : 
                           line;
      
      // Word wrap
      const maxWidth = pageWidth - (2 * margin) - indent;
      const words = textToRender.split(' ');
      let currentLine = '';
      let isFirstLine = true;
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
        
        if (testWidth > maxWidth && currentLine) {
          // Check if we need a new page
          if (yPosition < margin + lineHeight) {
            // Add page number
            const pageNum = pdfDoc.getPageCount().toString();
            page.drawText(pageNum, {
              x: pageWidth / 2 - 10,
              y: margin / 2,
              size: 10,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
            
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
          
          // Draw bullet/number only on first line
          if (isFirstLine && (isBullet || isNumbered)) {
            const bulletOrNumber = isBullet ? '•' : line.match(/^\d+\./)[0];
            page.drawText(bulletOrNumber, {
              x: margin,
              y: yPosition,
              size: currentSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            });
          }
          
          // Draw the line
          page.drawText(currentLine, {
            x: margin + indent,
            y: yPosition,
            size: currentSize,
            font: currentFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
          currentLine = word;
          isFirstLine = false;
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw remaining text
      if (currentLine) {
        // Check for new page
        if (yPosition < margin + lineHeight) {
          const pageNum = pdfDoc.getPageCount().toString();
          page.drawText(pageNum, {
            x: pageWidth / 2 - 10,
            y: margin / 2,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        
        // Draw bullet/number only on first line
        if (isFirstLine && (isBullet || isNumbered)) {
          const bulletOrNumber = isBullet ? '•' : line.match(/^\d+\./)?.[0] || '';
          page.drawText(bulletOrNumber, {
            x: margin,
            y: yPosition,
            size: currentSize,
            font: currentFont,
            color: rgb(0, 0, 0),
          });
        }
        
        page.drawText(currentLine, {
          x: margin + indent,
          y: yPosition,
          size: currentSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      // Extra space after headers
      if (isHeader) {
        yPosition -= paragraphSpacing;
      }
    }
    
    // Add significant space between paragraphs
    if (pIndex < paragraphs.length - 1) {
      yPosition -= paragraphSpacing * 2;
    }
  }
  
  // Add final page number
  const pageNum = pdfDoc.getPageCount().toString();
  page.drawText(pageNum, {
    x: pageWidth / 2 - 10,
    y: margin / 2,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc.save();
}

// Generate content using OpenAI
async function generateContent(type: string, caseData: any, openAIKey: string): Promise<string> {
  console.log(`Starting content generation for type: ${type}`);
  const scrubbedCase = {
    ...caseData,
    case_text: scrubPII(caseData.case_text || ''),
    previous_context: scrubPII(caseData.previous_context || ''),
  };
  
  let systemPrompt = '';
  let userPrompt = '';
  
  switch (type) {
    case 'relazione_preliminare':
      systemPrompt = `Sei un esperto avvocato italiano. Genera una relazione preliminare professionale completa.
      FORMATO RICHIESTO (NO MARKDOWN, SOLO TESTO FORMATTATO):
      
      RELAZIONE PRELIMINARE
      
      1. SINTESI DEL CASO
      [Descrizione dettagliata del problema]
      
      2. FATTI RILEVANTI E CRONOLOGIA
      [Elenco cronologico degli eventi]
      
      3. ANALISI GIURIDICA PRELIMINARE
      [Valutazione della posizione legale]
      
      4. STRATEGIE CONSIGLIATE
      [Percorsi legali possibili]
      
      5. PROSSIMI PASSI OPERATIVI
      [Azioni immediate da intraprendere]
      
      6. VALUTAZIONE RISCHI E OPPORTUNITÀ
      [Analisi dei rischi e probabilità di successo]
      
      DISCLAIMER: Questo documento è fornito a scopo informativo e non costituisce consulenza legale professionale. Si consiglia di consultare un avvocato qualificato prima di intraprendere azioni legali.
      
      Non usare simboli markdown, asterischi o altri caratteri speciali.`;
      userPrompt = `Genera una relazione preliminare professionale per questo caso:\n${JSON.stringify(scrubbedCase.report || scrubbedCase)}`;
      break;
      
    case 'riferimenti_giuridici':
      systemPrompt = `Sei un esperto di diritto italiano. DEVI citare MINIMO 3 e MASSIMO 10 articoli di legge pertinenti al caso.
      
      FORMATO RICHIESTO (NO MARKDOWN):
      
      RIFERIMENTI NORMATIVI COMPLETI
      
      IMPORTANTE: Cita tra 3 e 10 articoli più rilevanti. Per ogni articolo includi:
      
      ARTICOLO [numero] - [Codice/Legge]
      [Nome completo della norma]
      
      Testo integrale:
      "[Citazione COMPLETA dell'articolo, inclusi tutti i commi pertinenti]"
      
      Fonte: [Riferimento normativo ufficiale]
      
      Applicazione al caso:
      [Spiegazione dettagliata di come questo articolo si applica specificamente al caso in questione]
      
      ---
      
      DEVI includere articoli da:
      - Codice Civile (obblighi, contratti, responsabilità)
      - Codice di Procedura Civile (se pertinente)
      - Codice del Consumo (se applicabile)
      - Normative settoriali specifiche
      - Almeno 1 riferimento giurisprudenziale rilevante
      
      Ogni articolo deve essere citato INTEGRALMENTE con tutti i commi.
      
      DISCLAIMER: Questo documento è fornito a scopo informativo e non costituisce consulenza legale professionale. Si consiglia di consultare un avvocato qualificato prima di intraprendere azioni legali.`;
      userPrompt = `Trova e cita MINIMO 3 e MASSIMO 10 articoli di legge pertinenti per questo caso. Cita il testo COMPLETO di ogni articolo: ${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'diffida_messa_in_mora':
      systemPrompt = `Genera una diffida formale in formato professionale.
      
      FORMATO (NO MARKDOWN):
      
      RACCOMANDATA A.R.
      
      [MITTENTE]
      [Indirizzo]
      
      Spett.le
      [DESTINATARIO]
      [Indirizzo]
      
      [LUOGO], [DATA]
      
      OGGETTO: DIFFIDA E MESSA IN MORA
      
      Il sottoscritto [NOME], con la presente
      
      PREMESSO CHE
      - [fatto 1]
      - [fatto 2]
      
      CONSIDERATO CHE
      - [considerazione legale]
      
      DIFFIDA E INVITA
      
      La S.V. a [richiesta specifica] entro 15 giorni
      
      AVVERTE
      
      Che in difetto si procederà [conseguenze]
      
      Distinti saluti
      [FIRMA]
      
      DISCLAIMER: Questo documento è fornito a scopo informativo e non costituisce consulenza legale professionale. Si consiglia di consultare un avvocato qualificato prima di intraprendere azioni legali.`;
      userPrompt = `Genera diffida formale per: ${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'istanza_adr_odr':
      systemPrompt = `Genera istanza di mediazione/conciliazione professionale.
      
      FORMATO (NO MARKDOWN):
      
      All'Organismo di Mediazione
      [Nome Organismo appropriato per la materia]
      
      ISTANZA DI MEDIAZIONE
      
      Il sottoscritto [ISTANTE]
      
      CHIEDE
      
      L'avvio della procedura di mediazione nei confronti di [CONTROPARTE]
      
      OGGETTO DELLA CONTROVERSIA
      [Descrizione]
      
      RAGIONI DELLA PRETESA
      [Motivazioni giuridiche e fattuali]
      
      VALORE DELLA CONTROVERSIA
      Euro [IMPORTO]
      
      DOCUMENTI ALLEGATI
      1. [documento]
      2. [documento]
      
      Data e Firma`;
      userPrompt = `Genera istanza ADR per: ${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'email_avvocato':
      systemPrompt = `Genera email formale per avvocato con il caso.
      
      FORMATO (NO MARKDOWN):
      
      Oggetto: Richiesta consulenza legale - [TIPO CASO]
      
      Gentile Avvocato,
      
      Mi rivolgo a Lei per una consulenza legale riguardante [descrizione breve].
      
      SITUAZIONE FATTUALE
      [Esposizione chiara dei fatti]
      
      DOCUMENTAZIONE DISPONIBILE
      [Elenco documenti]
      
      OBIETTIVI
      [Cosa si vuole ottenere]
      
      URGENZA
      [Eventuali scadenze o urgenze]
      
      Resto a disposizione per un colloquio.
      
      Cordiali saluti
      [NOME]
      
      DISCLAIMER: Questo documento è fornito a scopo informativo e non costituisce consulenza legale professionale. Si consiglia di consultare un avvocato qualificato prima di intraprendere azioni legali.`;
      userPrompt = `Genera email per avvocato: ${JSON.stringify(scrubbedCase)}`;
      break;
      
    case 'lettera_risposta':
      systemPrompt = `Genera lettera di risposta/contestazione formale.
      
      FORMATO (NO MARKDOWN):
      
      RACCOMANDATA A.R.
      
      Oggetto: Riscontro Vs. comunicazione del [DATA]
      
      In riferimento alla Vostra del [DATA], con la presente
      
      CONTESTO
      [Riferimenti alla comunicazione ricevuta]
      
      OSSERVAZIONI
      [Punti di contestazione o chiarimento]
      
      POSIZIONE
      [La propria posizione sulla questione]
      
      RICHIESTE
      [Cosa si chiede]
      
      In attesa di riscontro
      Distinti saluti
      
      DISCLAIMER: Questo documento è fornito a scopo informativo e non costituisce consulenza legale professionale. Si consiglia di consultare un avvocato qualificato prima di intraprendere azioni legali.`;
      userPrompt = `Genera lettera risposta per: ${JSON.stringify(scrubbedCase)}`;
      break;
  }
  
  console.log(`Calling OpenAI API for ${type}...`);
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
      max_tokens: type === 'riferimenti_giuridici' ? 4000 : 2000
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`OpenAI API error for ${type}:`, response.status, errorData);
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorData}`);
  }
  
  const data = await response.json();
  console.log(`OpenAI API response received for ${type}`);
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
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    console.log('Starting PDF generation request...');

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
      console.error('Case ID is missing in request');
      throw new Error('Case ID is required');
    }

    console.log('Generating PDFs for case:', caseId);

    // Fetch case data
    console.log('Fetching case data from database...');
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError) {
      console.error('Error fetching case:', caseError);
      throw new Error(`Failed to fetch case data: ${caseError.message}`);
    }

    if (!caseData) {
      console.error('Case not found for ID:', caseId);
      throw new Error('Case not found');
    }

    console.log('Case data retrieved:', {
      id: caseData.id,
      status: caseData.status,
      area_of_law: caseData.area_of_law,
      classification: caseData.classification ? 'present' : 'missing',
      report: caseData.report ? 'present' : 'missing',
      case_objectives: caseData.case_objectives
    });

    // Get OpenAI API key
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OpenAI API key not configured in environment');
      throw new Error('OpenAI API key not configured');
    }
    console.log('OpenAI API key found');

    // Determine which documents to generate
    console.log('Determining which documents to generate...');
    const { 
      generateDiffida, 
      generateADR, 
      generateEmailAvvocato,
      generateLetteraRisposta,
      diffidaReason, 
      adrReason,
      emailAvvocatoReason,
      letteraRispostaReason
    } = determineDocuments(caseData);
    
    console.log('Document generation plan:', { 
      generateDiffida, 
      generateADR, 
      generateEmailAvvocato,
      generateLetteraRisposta,
      diffidaReason,
      adrReason,
      emailAvvocatoReason,
      letteraRispostaReason
    });

    // Generate documents
    const startTime = Date.now();
    const totalTimeout = 120000; // 2 minutes total
    
    // Prepare all generation tasks
    const generationTasks: Promise<any>[] = [];
    
    console.log('Starting parallel generation of documents...');
    
    // Always generate core documents (in parallel)
    generationTasks.push(
      generateContent('relazione_preliminare', caseData, openAIKey)
        .then(async (content) => {
          console.log('Relazione content generated, creating PDF...');
          const pdf = await createPDF('Relazione Preliminare', content);
          console.log('Relazione preliminare PDF created successfully');
          return {
            id: 'relazione_preliminare',
            title: 'Relazione Preliminare',
            rationale: 'Documento di sintesi del caso con analisi e raccomandazioni',
            content: btoa(String.fromCharCode(...pdf)),
            size_bytes: pdf.length
          };
        })
        .catch(error => {
          console.error('Error generating relazione:', error);
          throw error;
        })
    );
    
    generationTasks.push(
      generateContent('riferimenti_giuridici', caseData, openAIKey)
        .then(async (content) => {
          console.log('Riferimenti content generated, creating PDF...');
          const pdf = await createPDF('Riferimenti Giuridici', content);
          console.log('Riferimenti giuridici PDF created successfully');
          return {
            id: 'riferimenti_giuridici',
            title: 'Riferimenti Giuridici',
            rationale: 'Raccolta completa delle norme applicabili con testo integrale',
            content: btoa(String.fromCharCode(...pdf)),
            size_bytes: pdf.length
          };
        })
        .catch(error => {
          console.error('Error generating riferimenti:', error);
          throw error;
        })
    );

    // Add conditional documents to generation queue
    if (generateDiffida) {
      console.log('Adding diffida to generation queue...');
      generationTasks.push(
        generateContent('diffida_messa_in_mora', caseData, openAIKey)
          .then(async (content) => {
            console.log('Diffida content generated, creating PDF...');
            const pdf = await createPDF('Diffida e Messa in Mora', content);
            console.log('Diffida PDF created successfully');
            return {
              id: 'diffida_messa_in_mora',
              title: 'Diffida e Messa in Mora',
              rationale: diffidaReason || 'Documento formale di diffida',
              content: btoa(String.fromCharCode(...pdf)),
              size_bytes: pdf.length
            };
          })
          .catch(error => {
            console.error('Error generating diffida:', error);
            return null; // Return null instead of throwing to allow other docs to generate
          })
      );
    } else {
      console.log('Skipping diffida - not applicable for this case');
    }

    if (generateADR) {
      console.log('Adding ADR to generation queue...');
      generationTasks.push(
        generateContent('istanza_adr_odr', caseData, openAIKey)
          .then(async (content) => {
            console.log('ADR content generated, creating PDF...');
            const pdf = await createPDF('Istanza ADR/ODR', content);
            console.log('ADR PDF created successfully');
            return {
              id: 'istanza_adr_odr',
              title: 'Istanza ADR/ODR/Conciliazione',
              rationale: adrReason || 'Richiesta di mediazione/conciliazione',
              content: btoa(String.fromCharCode(...pdf)),
              size_bytes: pdf.length
            };
          })
          .catch(error => {
            console.error('Error generating ADR:', error);
            return null;
          })
      );
    } else {
      console.log('Skipping ADR - not applicable for this case');
    }

    if (generateEmailAvvocato) {
      console.log('Adding email avvocato to generation queue...');
      generationTasks.push(
        generateContent('email_avvocato', caseData, openAIKey)
          .then(async (content) => {
            console.log('Email content generated, creating PDF...');
            const pdf = await createPDF('Email Richiesta Consulenza Legale', content);
            console.log('Email avvocato PDF created successfully');
            return {
              id: 'email_avvocato',
              title: 'Email Richiesta Consulenza Avvocato',
              rationale: emailAvvocatoReason || 'Richiesta consulenza legale professionale',
              content: btoa(String.fromCharCode(...pdf)),
              size_bytes: pdf.length
            };
          })
          .catch(error => {
            console.error('Error generating email avvocato:', error);
            return null;
          })
      );
    } else {
      console.log('Skipping email avvocato - not needed for this case');
    }

    if (generateLetteraRisposta) {
      console.log('Adding lettera risposta to generation queue...');
      generationTasks.push(
        generateContent('lettera_risposta', caseData, openAIKey)
          .then(async (content) => {
            console.log('Lettera content generated, creating PDF...');
            const pdf = await createPDF('Lettera di Risposta/Contestazione', content);
            console.log('Lettera risposta PDF created successfully');
            return {
              id: 'lettera_risposta',
              title: 'Lettera di Risposta/Contestazione',
              rationale: letteraRispostaReason || 'Risposta formale a comunicazione ricevuta',
              content: btoa(String.fromCharCode(...pdf)),
              size_bytes: pdf.length
            };
          })
          .catch(error => {
            console.error('Error generating lettera risposta:', error);
            return null;
          })
      );
    } else {
      console.log('Skipping lettera risposta - not needed for this case');
    }

    // Execute all generation tasks in parallel with timeout
    console.log(`Executing ${generationTasks.length} generation tasks in parallel...`);
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Generation timeout exceeded')), totalTimeout);
      });
      
      const results = await Promise.race([
        Promise.all(generationTasks),
        timeoutPromise
      ]) as any[];
      
      // Filter out null results (failed generations) and add to documents
      const documents = results.filter(doc => doc !== null);
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(3);
      console.log(`Successfully generated ${documents.length} documents in ${elapsedTime} seconds`);
    } catch (error) {
      console.error('Error during document generation:', error);
      throw error;
    }

    // Prepare summary
    const summary = scrubPII(caseData.case_text || caseData.previous_context || 'Caso senza descrizione testuale');

    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    console.log(`Successfully generated ${documents.length} documents in ${elapsedTime} seconds`);

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
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate PDFs',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
