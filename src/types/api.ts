export interface CourtDirectory {
  id: string;
  name: string;
  address: string;
  district: string;
  phone?: string;
  lat?: number;
  lng?: number;
  type: 'court' | 'legal_aid' | 'police';
}

export interface DocumentInterpretation {
  document_type: string;
  parties: string[];
  key_dates: { label: string; date: string }[];
  obligations: string[];
  risks: string[];
  summary_hindi: string;
  raw_text_excerpt?: string;
}

export interface CaseStatus {
  cnr: string;
  case_type: string;
  filing_date: string;
  next_hearing?: string;
  status: string;
  parties: { petitioner: string; respondent: string };
  acts?: string[];
  cached: boolean;
  cached_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

