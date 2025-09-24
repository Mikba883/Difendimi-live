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

// Clean and format content for PDF
function cleanContent(content: string): string {
  // Remove markdown symbols and format text
  let cleaned = content
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Convert markdown headers to plain text with proper spacing
    .replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n')
    // Convert bullet points to proper format
    .replace(/^[\*\-]\s+/gm, '• ')
    // Convert numbered lists
    .replace(/^\d+\.\s+/gm, (match, offset, string) => {
      const lines = string.substring(0, offset).split('\n');
      const lastLine = lines[lines.length - 1];
      const num = (lastLine.match(/^\d+/) || ['0'])[0];
      return `${parseInt(num) + 1}. `;
    })
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Preserve paragraph breaks
    .replace(/\n\n+/g, '\n\n')
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
  
  for (const paragraph of paragraphs) {
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
    
    // Space between paragraphs
    yPosition -= paragraphSpacing;
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
      
      Non usare simboli markdown, asterischi o altri caratteri speciali.`;
      userPrompt = `Genera una relazione preliminare professionale per questo caso:\n${JSON.stringify(scrubbedCase.report || scrubbedCase)}`;
      break;
      
    case 'riferimenti_giuridici':
      systemPrompt = `Sei un esperto di diritto italiano. CERCA ATTIVAMENTE e cita TUTTI gli articoli di legge pertinenti.
      
      FORMATO RICHIESTO (NO MARKDOWN):
      
      RIFERIMENTI NORMATIVI COMPLETI
      
      Per ogni norma pertinente includi:
      
      ARTICOLO [numero] - [Codice/Legge]
      Testo integrale: [citazione completa dell'articolo]
      Fonte: [Normattiva/EUR-Lex con link]
      Applicazione al caso: [come si applica]
      
      Cerca e includi:
      - Codice Civile
      - Codice di Procedura Civile
      - Codice del Consumo
      - Normative speciali pertinenti
      - Giurisprudenza consolidata
      - Normativa europea applicabile`;
      userPrompt = `Trova TUTTI i riferimenti giuridici per: ${JSON.stringify(scrubbedCase)}`;
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
      [FIRMA]`;
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
      [NOME]`;
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
      Distinti saluti`;
      userPrompt = `Genera lettera risposta per: ${JSON.stringify(scrubbedCase)}`;
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
