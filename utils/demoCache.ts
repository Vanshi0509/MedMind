import { MedicalAnalysis } from "../types";

export const DEMO_CACHE: Record<string, any> = {
  "pneumonia": {
    cached_demo: true,
    summary: "Patient presents with symptoms and imaging highly suggestive of Right Lower Lobe bacterial pneumonia.",
    abnormalities: ["Right lower lobe consolidation", "Air bronchograms", "Fever", "Leukocytosis"],
    differentials: [
      {
        name: "Bacterial Pneumonia",
        raw_confidence: 95,
        calibrated_confidence: 0, // calc by pipeline
        raw_confidence_fraction: 0.95,
        calibrated_confidence_fraction: 0,
        reasoning: "Classic presentation with RLL consolidation on X-Ray, fever, and productive cough.",
        urgency: "Urgent",
        supporting_evidence: ["image:simulated_scan.jpg:Primary_Finding", "lab:General:O2=91", "text:symptoms:0-20:high_fever"],
        conflicting_evidence: [],
        warnings: []
      },
      {
        name: "Viral Pneumonia",
        raw_confidence: 40,
        calibrated_confidence: 0,
        raw_confidence_fraction: 0.40,
        calibrated_confidence_fraction: 0,
        reasoning: "Possible given respiratory symptoms, but lobar consolidation favors bacterial.",
        urgency: "Soon",
        supporting_evidence: ["text:symptoms:0-20:cough"],
        conflicting_evidence: ["image:simulated_scan.jpg:Primary_Finding"],
        warnings: []
      }
    ],
    redFlags: ["O2 Saturation 91%"],
    recommendedTests: ["Sputum Culture", "Blood Culture", "CBC"],
    soapNote: {
      subjective: "45M c/o fever, cough, pleuritic pain x2 days.",
      objective: "Fever 39.2C, O2 91%. RLL Crackles. CXR: RLL Consolidation.",
      assessment: "Community Acquired Pneumonia.",
      plan: "Start antibiotics, supportive care, monitor O2."
    },
    doctorNote: {
      chiefComplaint: "Fever and cough",
      historyOfPresentIllness: "2 day history of high grade fever and productive cough.",
      imagingFindings: "Right Lower Lobe consolidation with air bronchograms.",
      labInterpretation: "Hypoxia noted.",
      assessmentDifferential: "Primary: Bacterial Pneumonia.",
      planAndRecommendations: "Admit for IV antibiotics if saturation drops."
    },
    consistency: { matches: ["Imaging matches symptoms"], mismatches: [], notes: "High consistency." },
    timelineHypothesis: "Acute onset 48h ago.",
    reasoningChain: ["Symptoms suggest infection", "Imaging confirms consolidation", "Diagnosis: Pneumonia"],
    patientExplanation: "You likely have a lung infection called pneumonia.",
    doctorExplanation: "RLL consolidation consistent with CAP.",
    childExplanation: "You have a bug in your lungs making you cough.",
    nextSteps: "Start antibiotics immediately.",
    audit: {
      trace_id: "demo-pneumonia-cached",
      evidence: [],
      model_output_raw: {},
      postprocessing_actions: []
    }
  },
  "anemia": {
    cached_demo: true,
    summary: "Classic Iron Deficiency Anemia presentation confirmed by labs and smear.",
    abnormalities: ["Low Hemoglobin", "Microcytic RBCs", "Fatigue", "Pagophagia"],
    differentials: [
      {
        name: "Iron Deficiency Anemia",
        raw_confidence: 98,
        calibrated_confidence: 0,
        raw_confidence_fraction: 0.98,
        calibrated_confidence_fraction: 0,
        reasoning: "Hb 8.2, MCV 72, Ferritin 10, plus pica symptoms are diagnostic.",
        urgency: "Soon",
        supporting_evidence: ["lab:General:HB=8.2", "text:report:0-10:ferritin_10", "text:symptoms:0-20:craving_ice"],
        conflicting_evidence: [],
        warnings: []
      }
    ],
    redFlags: ["Hemoglobin 8.2 g/dL"],
    recommendedTests: ["Stool Occult Blood", "Dietary review"],
    soapNote: {
      subjective: "Fatigue, dizziness, ice craving.",
      objective: "Pale conjunctiva. Labs: Hb 8.2, Ferritin 10.",
      assessment: "Iron Deficiency Anemia.",
      plan: "Oral iron supplementation."
    },
    doctorNote: {
      chiefComplaint: "Fatigue",
      historyOfPresentIllness: "3 months progressive fatigue.",
      imagingFindings: "N/A",
      labInterpretation: "Microcytic hypochromic anemia.",
      assessmentDifferential: "Iron Deficiency Anemia.",
      planAndRecommendations: "Iron sulfate 325mg daily."
    },
    consistency: { matches: ["Labs match symptoms"], mismatches: [], notes: "Consistent." },
    timelineHypothesis: "Chronic, 3 months duration.",
    reasoningChain: ["Low Hb + Low MCV -> Microcytic Anemia", "Low Ferritin -> Iron Deficiency"],
    patientExplanation: "You have low iron causing tiredness.",
    doctorExplanation: "IDA confirmed by iron studies.",
    childExplanation: "Your blood needs more iron to give you energy.",
    nextSteps: "Start iron pills and follow up in 4 weeks.",
    audit: {
      trace_id: "demo-anemia-cached",
      evidence: [],
      model_output_raw: {},
      postprocessing_actions: []
    }
  }
};