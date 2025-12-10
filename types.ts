export interface AuditTrace {
  trace_id: string;
  evidence: any[];
  model_output_raw: any;
  postprocessing_actions: string[];
}

export interface Diagnosis {
  name: string;
  
  // Confidence Fields (Canonical)
  raw_confidence: number;
  calibrated_confidence: number;
  raw_confidence_fraction: number;
  calibrated_confidence_fraction: number;
  
  reasoning: string;
  urgency: 'Routine' | 'Soon' | 'Urgent' | 'Emergency';
  
  // Evidence Fields (Canonical)
  supporting_evidence: string[]; 
  conflicting_evidence: string[]; 
  
  warnings: string[];
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DoctorNote {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  imagingFindings: string;
  labInterpretation: string;
  assessmentDifferential: string;
  planAndRecommendations: string;
}

export interface ConsistencyAnalysis {
  matches: string[];
  mismatches: string[];
  notes: string;
}

export interface MedicalAnalysis {
  summary: string;
  abnormalities: string[];
  
  // Canonical List
  differentials: Diagnosis[]; 

  redFlags: string[];
  recommendedTests: string[];
  soapNote: SoapNote;
  doctorNote: DoctorNote;
  
  consistency: ConsistencyAnalysis;
  timelineHypothesis: string;
  reasoningChain: string[];
  
  patientExplanation: string;
  doctorExplanation: string;
  childExplanation: string;
  nextSteps: string;

  emergency?: boolean;
  emergency_reasons?: string[];
  
  meta?: {
    nModalities: number;
    qualityScore: number;
  };

  cached_demo?: boolean;
  _evidence_ok?: boolean;
  audit?: AuditTrace;
}

export interface AppState {
  images: File[];
  audioBlob: Blob | null;
  symptomsText: string;
  reportText: string;
  isAnalyzing: boolean;
  result: MedicalAnalysis | null;
  error: string | null;
}

export interface TabItem {
  id: string;
  label: string;
}