export interface DemoCase {
  id: string;
  label: string;
  icon: string;
  symptoms: string;
  report: string;
  imageLabel: string;
  imageColor: string;
  context: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'pneumonia',
    label: 'Pneumonia',
    icon: '🫁',
    symptoms: 'Patient (45M) presents with high fever (39.2°C), productive cough with rust-colored sputum, and sharp pleuritic chest pain on the right side. Symptoms started abruptly 2 days ago. Chills and rigor reported.',
    report: 'Vitals: HR 105 bpm, BP 130/85, RR 26/min, O2 Sat 91% on room air.\nAusculation: Crackles heard in the right lower lung field.',
    imageLabel: 'Chest X-Ray: RLL Consolidation',
    imageColor: '#1e293b', // Dark slate
    context: 'SIMULATION: Analyze this case as if the image provided is a Chest X-Ray showing clear Right Lower Lobe (RLL) consolidation and air bronchograms consistent with bacterial pneumonia.'
  },
  {
    id: 'anemia',
    label: 'Severe Anemia',
    icon: '🩸',
    symptoms: 'Patient (32F) reports progressive fatigue, weakness, and dizziness upon standing over the past 3 months. Notes heavier than usual menstrual periods and craving for ice (pagophagia).',
    report: 'LAB RESULTS:\nHemoglobin: 8.2 g/dL (Low)\nMCV: 72 fL (Low)\nFerritin: 10 ng/mL (Low)\nTIBC: 450 mcg/dL (High)\nPeripheral Smear: Hypochromic microcytic red cells observed.',
    imageLabel: 'Peripheral Blood Smear',
    imageColor: '#ef4444', // Red
    context: 'SIMULATION: Analyze this case as a classic presentation of Iron Deficiency Anemia. Treat the image as a blood smear showing hypochromia and microcytosis.'
  },
  {
    id: 'acl',
    label: 'ACL Tear',
    icon: '🦵',
    symptoms: 'Athlete (24M) felt a "pop" in the left knee while cutting direction during soccer. Immediate swelling and inability to bear weight. Knee feels unstable ("giving way").',
    report: 'Physical Exam:\n+ Lachman Test\n+ Anterior Drawer Test\nMinimal range of motion due to effusion.',
    imageLabel: 'MRI Left Knee (T2 Sagittal)',
    imageColor: '#000000', // Black
    context: 'SIMULATION: Analyze this case as an Anterior Cruciate Ligament (ACL) tear. Treat the image as a T2-weighted MRI sequence showing discontinuity of the ACL fibers and bone bruising.'
  },
  {
    id: 'skin',
    label: 'Melanoma',
    icon: '🔎',
    symptoms: 'Patient (55M) noticed a mole on the upper back has changed shape and color over the last 6 months. Reports occasional itching but no bleeding.',
    report: 'Dermatoscopy report pending. Family history of skin cancer.',
    imageLabel: 'Dermatoscopy: Asymmetric Lesion',
    imageColor: '#d97706', // Skin tone-ish / Amber
    context: 'SIMULATION: Analyze this case as a potential Malignant Melanoma. Treat the image as a skin lesion showing Asymmetry, Irregular Borders, Color variation, and Diameter > 6mm (ABCD criteria).'
  }
];

export const createDummyImage = (text: string, color: string): File => {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 500, 500);
  
  // Grid lines for medical feel
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for(let i=0; i<500; i+=50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 500);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(500, i);
    ctx.stroke();
  }

  // Text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 250, 230);
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px monospace';
  ctx.fillText("[ SIMULATED MEDICAL IMAGE ]", 250, 270);
  ctx.fillText("DO NOT USE FOR DIAGNOSIS", 250, 295);
  
  const dataUrl = canvas.toDataURL('image/jpeg');
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([new Blob([ab], { type: 'image/jpeg' })], 'simulated_scan.jpg', { type: 'image/jpeg' });
};
