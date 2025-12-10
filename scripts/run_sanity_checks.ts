import { DEMO_CACHE } from "../utils/demoCache";

console.log("Running Sanity Checks on Demo Cache...");

let errors = 0;

Object.entries(DEMO_CACHE).forEach(([key, analysis]) => {
  console.log(`Checking ${key}...`);

  if (!analysis.cached_demo) {
    console.error(`[FAIL] ${key} missing cached_demo flag`);
    errors++;
  }
  
  if (!analysis.audit?.trace_id) {
    console.error(`[FAIL] ${key} missing audit trace_id`);
    errors++;
  }

  if (analysis.differentialDiagnosis) {
    analysis.differentialDiagnosis.forEach((d, i) => {
      const hasEvidence = d.supportingEvidence && d.supportingEvidence.length > 0;
      const hasWarning = d.warnings && d.warnings.some(w => w.includes("No explicit supporting evidence"));
      
      if (!hasEvidence && !hasWarning) {
         console.error(`[FAIL] ${key} diag #${i} (${d.condition}) has NO evidence and NO warning.`);
         errors++;
      }
    });
  }
});

if (errors === 0) {
  console.log("✅ All Sanity Checks Passed.");
  process.exit(0);
} else {
  console.error(`❌ ${errors} Sanity Checks Failed.`);
  process.exit(1);
}
