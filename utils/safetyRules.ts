import { MedicalAnalysis } from "../types";

export interface SafetyCheckResult {
  flag: boolean;
  reasons: string[];
}

const VITALS_PATTERNS = {
  O2_SAT: /(?:O2|oxygen|sat|spO2)[\s\w]*?(\d{2,3})\s*%/i,
  SYSTOLIC_BP: /(?:BP|blood pressure)[\s:]*?(\d{2,3})\/\d{2,3}/i,
  HEART_RATE: /(?:HR|heart rate|pulse)[\s:]*?(\d{2,3})/i,
};

const EMERGENCY_PHRASES = [
  { pattern: /severe shortness of breath/i, reason: "Reported severe shortness of breath" },
  { pattern: /unable to breathe/i, reason: "Reported inability to breathe" },
  { pattern: /respiratory distress/i, reason: "Mention of respiratory distress" },
  { pattern: /sudden chest pain/i, reason: "Reported sudden chest pain" },
  { pattern: /acute chest pain/i, reason: "Reported acute chest pain" },
  { pattern: /active bleeding/i, reason: "Mention of active bleeding" },
  { pattern: /massive hemorrhage/i, reason: "Mention of massive hemorrhage" },
  { pattern: /loss of consciousness/i, reason: "Reported loss of consciousness" },
  { pattern: /unresponsive/i, reason: "Patient reported unresponsive" },
  { pattern: /stroke code/i, reason: "Mention of Stroke Code" },
  { pattern: /myocardial infarction/i, reason: "Mention of MI/Heart Attack" }
];

const CRITICAL_IMAGE_FINDINGS = [
  "pneumothorax",
  "hemothorax",
  "aortic dissection",
  "pulmonary embolism",
  "perforation",
  "midline shift",
  "intracranial hemorrhage",
  "free air",
  "massive effusion"
];

function checkTextRedFlags(text: string): SafetyCheckResult {
  const reasons: string[] = [];
  let flag = false;

  for (const p of EMERGENCY_PHRASES) {
    if (p.pattern.test(text)) {
      flag = true;
      reasons.push(p.reason);
    }
  }

  const o2Match = text.match(VITALS_PATTERNS.O2_SAT);
  if (o2Match && o2Match[1]) {
    const val = parseInt(o2Match[1], 10);
    if (val < 85) {
      flag = true;
      reasons.push(`Critical Oxygen Saturation detected: ${val}% (< 85%)`);
    }
  }

  const bpMatch = text.match(VITALS_PATTERNS.SYSTOLIC_BP);
  if (bpMatch && bpMatch[1]) {
    const val = parseInt(bpMatch[1], 10);
    if (val < 90) {
      flag = true;
      reasons.push(`Critical Hypotension detected: Systolic BP ${val} (< 90)`);
    }
  }

  const hrMatch = text.match(VITALS_PATTERNS.HEART_RATE);
  if (hrMatch && hrMatch[1]) {
    const val = parseInt(hrMatch[1], 10);
    if (val > 140) {
      flag = true;
      reasons.push(`Critical Tachycardia detected: HR ${val} (> 140)`);
    }
  }

  return { flag, reasons };
}

function checkImageEmergency(abnormalities: string[]): SafetyCheckResult {
  const reasons: string[] = [];
  let flag = false;

  if (!abnormalities || !Array.isArray(abnormalities)) return { flag: false, reasons: [] };

  for (const finding of abnormalities) {
    const lower = finding.toLowerCase();
    for (const crit of CRITICAL_IMAGE_FINDINGS) {
      if (lower.includes(crit)) {
        flag = true;
        reasons.push(`Critical imaging finding detected: ${finding}`);
        break;
      }
    }
  }

  return { flag, reasons };
}

export function applyEmergencyRules(
  analysis: MedicalAnalysis, 
  context: { symptomsText?: string, reportText?: string, evidenceList?: any[] }
): MedicalAnalysis {
  const fullText = (context.symptomsText || '') + " " + (context.reportText || '');
  
  const textResult = checkTextRedFlags(fullText);
  const imageResult = checkImageEmergency(analysis.abnormalities || []);

  const isEmergency = textResult.flag || imageResult.flag;
  const allReasons = [...textResult.reasons, ...imageResult.reasons];

  analysis.emergency = isEmergency;
  analysis.emergency_reasons = isEmergency ? allReasons : [];

  analysis.audit = analysis.audit || { trace_id: "", evidence: [], model_output_raw: null, postprocessing_actions: [] };
  analysis.audit.postprocessing_actions.push("applyEmergencyRules");

  if (isEmergency && analysis.differentials) {
    for (const d of analysis.differentials) {
      // Force upgrade priority for non-routine items if global emergency is set
      // Use calibrated_confidence_fraction for threshold (e.g. 0.20 = 20%)
      if (d.urgency !== 'Emergency' && d.calibrated_confidence_fraction > 0.2) {
          d.urgency = 'Urgent'; 
          d.warnings.push("Urgency upgraded due to global emergency trigger.");
      }
    }
    analysis.redFlags = Array.from(new Set([...(analysis.redFlags || []), ...allReasons]));
  }

  return analysis;
}