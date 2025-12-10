import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MedicalAnalysis, Diagnosis } from "../types";
import { applyEmergencyRules } from "../utils/safetyRules";
import { collectAllEvidence, EvidenceToken } from "../utils/evidence";
import { applyConfidenceCalibration } from "../utils/calibration";
import { DEMO_CACHE } from "../utils/demoCache";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    abnormalities: { type: Type.ARRAY, items: { type: Type.STRING } },
    differentials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ["Routine", "Soon", "Urgent", "Emergency"] },
          supporting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          conflicting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "confidence", "reasoning", "urgency", "supporting_evidence"],
      }
    },
    reasoningChain: { type: Type.ARRAY, items: { type: Type.STRING } },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
    soapNote: {
      type: Type.OBJECT,
      properties: {
        subjective: { type: Type.STRING },
        objective: { type: Type.STRING },
        assessment: { type: Type.STRING },
        plan: { type: Type.STRING },
      },
      required: ["subjective", "objective", "assessment", "plan"],
    },
    doctorNote: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: { type: Type.STRING },
        historyOfPresentIllness: { type: Type.STRING },
        imagingFindings: { type: Type.STRING },
        labInterpretation: { type: Type.STRING },
        assessmentDifferential: { type: Type.STRING },
        planAndRecommendations: { type: Type.STRING },
      },
      required: ["chiefComplaint", "historyOfPresentIllness", "imagingFindings", "labInterpretation", "assessmentDifferential", "planAndRecommendations"],
    },
    consistency: {
      type: Type.OBJECT,
      properties: {
        matches: { type: Type.ARRAY, items: { type: Type.STRING } },
        mismatches: { type: Type.ARRAY, items: { type: Type.STRING } },
        notes: { type: Type.STRING }
      },
      required: ["matches", "mismatches", "notes"]
    },
    timelineHypothesis: { type: Type.STRING },
    patientExplanation: { type: Type.STRING },
    doctorExplanation: { type: Type.STRING },
    childExplanation: { type: Type.STRING },
    nextSteps: { type: Type.STRING }
  },
  required: [
    "summary", "abnormalities", "differentials", "reasoningChain", "redFlags", 
    "recommendedTests", "soapNote", "doctorNote", "consistency", 
    "timelineHypothesis", "patientExplanation", "doctorExplanation", 
    "childExplanation", "nextSteps"
  ],
};

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blobToPart = async (blob: Blob, mimeType: string) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({ inlineData: { data: base64, mimeType } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- STRICT NORMALIZATION ---
function normalizeToCanonical(raw: any, evidenceList: EvidenceToken[]): MedicalAnalysis {
  // 1. Audit & Meta Init
  raw.audit = raw.audit || { 
    trace_id: `medmind-${Date.now()}`, 
    evidence: evidenceList, 
    model_output_raw: null, 
    postprocessing_actions: [] 
  };
  raw.meta = raw.meta || { nModalities: 0, qualityScore: 0.85 };

  // 2. Differentials Mapping
  const rawList = raw.differentials || raw.differentialDiagnosis || raw.diagnosisList || [];
  
  const canonicalList: Diagnosis[] = rawList.map((item: any) => {
    // Name
    const name = item.name || item.condition || "Unknown Condition";
    
    // Confidence Normalization
    const rawVal = Number(item.raw_confidence ?? item.confidence ?? 0);
    const calVal = Number(item.calibrated_confidence ?? item.confidence ?? 0);
    
    // Logic: if > 1.5, treat as 0-100, else 0-1
    const raw_confidence_fraction = rawVal > 1.5 ? rawVal / 100 : rawVal;
    const calibrated_confidence_fraction = calVal > 1.5 ? calVal / 100 : calVal;
    
    const raw_confidence = rawVal;
    const calibrated_confidence = calVal;

    // Evidence Lists
    const supporting_evidence = item.supporting_evidence || item.supportingEvidence || [];
    const conflicting_evidence = item.conflicting_evidence || item.conflictingEvidence || item.counterarguments || [];
    const warnings = item.warnings || [];

    return {
      name,
      raw_confidence,
      calibrated_confidence,
      raw_confidence_fraction,
      calibrated_confidence_fraction,
      reasoning: item.reasoning || "",
      urgency: item.urgency || "Routine",
      supporting_evidence,
      conflicting_evidence,
      warnings
    };
  });

  // Replace with canonical list
  raw.differentials = canonicalList;
  // Clear old keys to avoid confusion
  delete raw.differentialDiagnosis;
  delete raw.diagnosisList;

  raw.audit.postprocessing_actions.push("normalizeToCanonical");
  return raw as MedicalAnalysis;
}

// ---------------------------

export function enforceEvidenceGrounding(analysis: MedicalAnalysis, evidenceList: EvidenceToken[]): MedicalAnalysis {
  let evidenceOk = true;

  analysis.differentials.forEach((d) => {
    if (!Array.isArray(d.supporting_evidence) || d.supporting_evidence.length === 0) {
      evidenceOk = false;
      // Penalty (keep numbers safe)
      d.calibrated_confidence = Number(d.calibrated_confidence ?? 0) * 0.4;
      d.calibrated_confidence_fraction = (Number(d.calibrated_confidence_fraction ?? 0)) * 0.4;
      
      d.warnings = d.warnings || [];
      d.warnings.push("No explicit supporting evidence found. Confidence penalized.");
      d.reasoning = `[LOW CONFIDENCE: NO EVIDENCE] ${d.reasoning}`;
    }
  });

  analysis._evidence_ok = evidenceOk;
  analysis.audit = analysis.audit || { trace_id: `medmind-${Date.now()}`, evidence: evidenceList, model_output_raw: null, postprocessing_actions: [] };
  analysis.audit.postprocessing_actions = analysis.audit.postprocessing_actions || [];
  analysis.audit.postprocessing_actions.push("enforceEvidenceGrounding");

  return analysis;
}

// --- Calibration fallback helper (ensures UI always has fractions) ---
function applyCalibrationFallback(analysis: MedicalAnalysis) {
  analysis.differentials = (analysis.differentials || []).map((d: any) => {
    // ensure numeric forms
    d.raw_confidence = Number(d.raw_confidence ?? 0);
    d.raw_confidence_fraction = (d.raw_confidence_fraction != null)
      ? Number(d.raw_confidence_fraction)
      : (d.raw_confidence > 1.5 ? d.raw_confidence / 100 : d.raw_confidence);

    d.calibrated_confidence = Number(d.calibrated_confidence ?? 0);
    d.calibrated_confidence_fraction = (d.calibrated_confidence_fraction != null)
      ? Number(d.calibrated_confidence_fraction)
      : (d.calibrated_confidence > 1.5 ? d.calibrated_confidence / 100 : d.calibrated_confidence);

    // If calibration produced 0 or NaN, fallback to raw_fraction
    if (!d.calibrated_confidence_fraction || isNaN(d.calibrated_confidence_fraction) || d.calibrated_confidence_fraction <= 0) {
      d.calibrated_confidence_fraction = d.raw_confidence_fraction ?? (d.raw_confidence > 1.5 ? d.raw_confidence / 100 : d.raw_confidence || 0);
      // keep a matching calibrated_confidence numeric field for legacy UI
      d.calibrated_confidence = d.calibrated_confidence_fraction > 1 ? Math.round(d.calibrated_confidence_fraction) : Math.round(d.calibrated_confidence_fraction * 100);
    }

    // Always ensure arrays exist
    d.supporting_evidence = Array.isArray(d.supporting_evidence) ? d.supporting_evidence : (Array.isArray(d.supportingEvidence) ? d.supportingEvidence : []);
    d.conflicting_evidence = Array.isArray(d.conflicting_evidence) ? d.conflicting_evidence : (Array.isArray(d.conflictingEvidence) ? d.conflictingEvidence : []);
    d.warnings = Array.isArray(d.warnings) ? d.warnings : [];

    return d;
  });
}

// ---------------------------

export const reasonOverAllInputs = async (
  images: File[],
  audio: Blob | null,
  symptoms: string,
  reportText: string,
  demoContext?: string
): Promise<MedicalAnalysis> => {
  
  // 1. Collect Evidence
  const evidenceList = collectAllEvidence({
    images,
    reportText: reportText || "",
    symptomsText: symptoms || ""
  });

  // 2. Demo Caching Short-circuit
  if (demoContext) {
    let cached: MedicalAnalysis | undefined;
    if (symptoms.includes("rust-colored")) cached = DEMO_CACHE["pneumonia"];
    else if (symptoms.includes("pagophagia")) cached = DEMO_CACHE["anemia"];
    else if (symptoms.includes("pop")) cached = DEMO_CACHE["acl"];
    else if (symptoms.includes("mole")) cached = DEMO_CACHE["skin"];
    
    if (cached) {
      // Deep copy
      const raw = JSON.parse(JSON.stringify(cached));
      
      // Init Audit for demo: preserve demo audit but prefer fresh evidenceList if present
      raw.audit = raw.audit || {};
      raw.audit.trace_id = `demo-${Date.now()}`;
      raw.audit.model_output_raw = { note: "Cached Demo" };
      raw.audit.postprocessing_actions = raw.audit.postprocessing_actions || [];
      raw.audit.postprocessing_actions.push("loadFromCache");
      // Prefer collected evidence tokens (keeps provenance accurate). Fallback to whatever demo had.
      raw.audit.evidence = Array.isArray(evidenceList) && evidenceList.length ? evidenceList : (raw.audit.evidence || []);

      // Pipeline
      let analysis = normalizeToCanonical(raw, raw.audit.evidence);
      analysis = enforceEvidenceGrounding(analysis, raw.audit.evidence);
      analysis = applyEmergencyRules(analysis, { symptomsText: symptoms, reportText, evidenceList: raw.audit.evidence });
      analysis = applyConfidenceCalibration(analysis, { evidenceList: raw.audit.evidence });

      // Calibration fallback to avoid zero/confidence wipeouts
      applyCalibrationFallback(analysis);

      // Finalize audit actions
      analysis.audit.postprocessing_actions.push("finalizeAnalysisForFrontend");
      return analysis;
    }
  }

  // 3. Prepare Gemini Inputs
  const imageParts = await Promise.all(images.map(fileToPart));
  const audioPart = audio ? await blobToPart(audio, audio.type) : null;
  
  const evidenceBlock = `
*** CANONICAL EVIDENCE TOKENS AVAILABLE ***
(Refer to these exact IDs when listing supporting_evidence)
${evidenceList.map(t => `- ${t.id} ("${t.value}")`).join('\n')}
*******************************************
`;

  const promptText = `
    PATIENT SYMPTOMS: ${symptoms || "None"}
    REPORTS: ${reportText || "None"}
    ${demoContext ? `DEMO CONTEXT: ${demoContext}` : ""}
    ${evidenceBlock}
  `;

  const parts: any[] = [{ text: promptText }];
  if (imageParts.length) parts.push(...imageParts);
  if (audioPart) parts.push(audioPart);

  // 4. Gemini Call
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: `You are MedMind. 
        1. Extract abnormalities.
        2. Diagnose with EVIDENCE.
        3. REQUIRED: Map 'supporting_evidence' using Canonical IDs provided.
        4. If evidence is missing for a diagnosis, do NOT list it or mark confidence 0.
        `,
      },
    });

    if (response.text) {
      const raw = JSON.parse(response.text);
      raw._raw_model_output = JSON.parse(JSON.stringify(raw));
      
      // Pipeline
      let analysis = normalizeToCanonical(raw, evidenceList);

      // Ensure audit.evidence is present (fallback to collected evidenceList)
      analysis.audit = (analysis.audit && typeof analysis.audit === 'object') ? analysis.audit : { trace_id: `medmind-${Date.now()}`, evidence: evidenceList || [], model_output_raw: {}, postprocessing_actions: [] } as any;
      analysis.audit.postprocessing_actions = analysis.audit.postprocessing_actions || [];
      analysis.audit.evidence = Array.isArray(analysis.audit.evidence) && analysis.audit.evidence.length ? analysis.audit.evidence : evidenceList;
      analysis.audit.postprocessing_actions = analysis.audit.postprocessing_actions || [];
      analysis.audit.postprocessing_actions.push("modelRawToCanonical");

      analysis = enforceEvidenceGrounding(analysis, analysis.audit.evidence);
      analysis = applyEmergencyRules(analysis, { symptomsText: symptoms, reportText, evidenceList: analysis.audit.evidence });
      analysis = applyConfidenceCalibration(analysis, { evidenceList: analysis.audit.evidence });

      // Calibration fallback to avoid zero/confidence wipeouts
      applyCalibrationFallback(analysis);

      // Finalize audit actions
      analysis.audit.postprocessing_actions.push("finalizeAnalysisForFrontend");

      return analysis;
    } else {
      throw new Error("No response.");
    }
  } catch (error) {
    console.error("Gemini Failure:", error);
    throw error;
  }
};
