import { MedicalAnalysis } from "../types";

function geometricMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const product = numbers.reduce((acc, val) => acc * val, 1);
  return Math.pow(product, 1 / numbers.length);
}

export function calibrateConfidence(
  rawConfidence: number, 
  nModalities: number, 
  qualityScore: number
): number {
  const normRaw = rawConfidence / 100;
  // Boost if more modalities are present (1->0.5, 2->0.75, 3+->1.0)
  const modalBoost = Math.min(1, 0.5 + 0.25 * (Math.max(1, nModalities) - 1));
  
  const result = normRaw * qualityScore * modalBoost;
  return parseFloat((result * 100).toFixed(2));
}

export function applyConfidenceCalibration(
  analysis: MedicalAnalysis,
  context: { evidenceList: any[], images?: any[], transcripts?: any[] }
): MedicalAnalysis {
  
  // 1. Calculate N Modalities present in evidence
  const types = new Set(context.evidenceList.map(e => e.type));
  let nModalities = types.size;
  // Ensure at least 1
  nModalities = Math.max(1, nModalities);

  // 2. Calculate Quality Score
  const qualitySignals: number[] = [];
  
  if (types.has('image')) qualitySignals.push(0.9);
  if (types.has('lab') || types.has('text')) qualitySignals.push(0.95);
  if (types.has('audio')) qualitySignals.push(0.85);

  const qualityScore = qualitySignals.length > 0 ? geometricMean(qualitySignals) : 0.8;

  // 3. Update Differentials
  if (analysis.differentials) {
    analysis.differentials.forEach(d => {
      // Calibrate using raw (0-100 base implied by helper)
      // d.raw_confidence might be 0-100.
      d.calibrated_confidence = calibrateConfidence(d.raw_confidence, nModalities, qualityScore);
      
      // Update fractions
      d.calibrated_confidence_fraction = d.calibrated_confidence / 100;
    });
  }

  analysis.meta = {
    nModalities,
    qualityScore: parseFloat(qualityScore.toFixed(2))
  };

  analysis.audit = analysis.audit || { trace_id: "", evidence: [], model_output_raw: null, postprocessing_actions: [] };
  analysis.audit.postprocessing_actions.push("applyConfidenceCalibration");

  return analysis;
}