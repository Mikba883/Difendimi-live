export type CaseStatus = 'draft' | 'collecting' | 'queued' | 'processing' | 'ready' | 'error' | 'archived';

export interface Document {
  id: string;
  title: string;
  rationale: string;
  storage_path: string;
  signed_url: string;
  size_bytes: number;
}

export interface ExecutiveSummary {
  summary: string;
  key_points?: string[];
}

export interface QualificazioneGiuridica {
  description: string;
  articles?: string[];
}

export interface FonteItem {
  title: string;
  official_url: string;
  description?: string;
}

export interface Fonti {
  items: FonteItem[];
}

export interface OpzioneRow {
  name: string;
  pro: string;
  contro: string;
  tempi: string;
  costi: string;
  esito: string;
}

export interface Opzioni {
  rows: OpzioneRow[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed?: boolean;
}

export interface PassiOperativi {
  checklist: ChecklistItem[];
}

export interface Deadline {
  description: string;
  date: string;
  type: 'prescription' | 'decadenza' | 'other';
}

export interface Termini {
  deadlines: Deadline[];
  prescription?: string;
  decadenza?: string;
}

export interface Allegati {
  present: string[];
  missing: string[];
  nice_to_have: string[];
}

export interface TabbedLegalReport {
  meta?: any;
  executive_summary?: ExecutiveSummary;
  qualificazione_giuridica?: QualificazioneGiuridica;
  fonti?: Fonti;
  opzioni?: Opzioni;
  passi_operativi?: PassiOperativi;
  termini?: Termini;
  allegati?: Allegati;
  disclaimer?: string;
}

export interface Case {
  id: string;
  job_id?: string;
  case_type?: string;
  status: CaseStatus;
  created_by?: string;
  previous_context?: string;
  case_text?: string;
  pii_scrubbed?: boolean;
  jurisdiction?: string;
  area_of_law?: string[];
  search_plan?: any;
  legal_signals?: any;
  classification?: any;
  report?: TabbedLegalReport;
  documents?: {
    items: Document[];
  };
  error_message?: string;
  created_at: string;
  updated_at: string;
  
  // Legacy fields
  title?: string;
  cards_json?: any;
  sources_used?: any;
  doc_availability?: any;
}