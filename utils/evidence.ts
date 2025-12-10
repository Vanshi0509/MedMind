export interface EvidenceToken {
  id: string;      // Canonical ID: type:source:location:value_key
  type: 'image' | 'lab' | 'text' | 'audio';
  value: string;   // The extracted value, snippet, or description
  source?: string; // e.g. filename, 'report', 'symptoms'
  meta?: any;      // bbox, confidence, range, raw match, label
}

/**
 * 1. Image Evidence Extraction
 */
export function extractImageEvidence(images: File[]): EvidenceToken[] {
  return images.map((f, idx) => ({
    id: `image:${f.name.replace(/[^a-zA-Z0-9.-]/g, '_')}:Primary_Finding`,
    type: 'image',
    value: `Whole image analysis of ${f.name}`,
    source: f.name,
    meta: { 
      // Default ROI: Center 80% of image (1000x1000 coordinate space)
      bbox: [100, 100, 800, 800], 
      label: 'detected_region_global' 
    }
  }));
}

/**
 * 2. Lab Evidence Extraction
 */
export function extractLabEvidence(text: string): EvidenceToken[] {
  if (!text) return [];

  const patterns = [
    { key: 'HB', regex: /(?:Hb|Hemoglobin|Hgb)[\s:]*?(\d+(?:\.\d+)?)/gi },
    { key: 'WBC', regex: /(?:WBC|White\s?blood\s?cell)[\s:]*?(\d+(?:\.\d+)?)/gi },
    { key: 'PLT', regex: /(?:Plt|Platelets?)[\s:]*?(\d{2,})/gi },
    { key: 'NA', regex: /(?:Na\+|Sodium)[\s:]*?(\d{2,3})/gi },
    { key: 'K', regex: /(?:K\+|Potassium)[\s:]*?(\d+(?:\.\d+)?)/gi },
    { key: 'CR', regex: /(?:Cr|Creatinine)[\s:]*?(\d+(?:\.\d+)?)/gi },
    { key: 'O2', regex: /(?:O2|Oxygen|SpO2)[\s:]*?(\d{2,3})/gi },
    { key: 'GLU', regex: /(?:Glucose|Glu)[\s:]*?(\d{2,3})/gi },
  ];

  const tokens: EvidenceToken[] = [];
  
  patterns.forEach(p => {
    let match;
    p.regex.lastIndex = 0;
    while ((match = p.regex.exec(text)) !== null) {
        tokens.push({
            id: `lab:General:${p.key}=${match[1]}`,
            type: 'lab',
            value: match[1],
            source: 'report',
            meta: { 
              field: p.key, 
              raw: match[0],
              quality: 0.95 
            }
        });
    }
  });

  return tokens;
}

/**
 * 3. Audio/Text Evidence Extraction
 */
export function extractAudioEvidence(
  transcript: string, 
  sourceName = 'transcript',
  segments?: {start: number, end: number, text: string}[]
): EvidenceToken[] {
    if (!transcript) return [];
    
    const tokens: EvidenceToken[] = [];

    // Use explicit segments if available
    if (segments && segments.length > 0) {
      segments.forEach((seg, i) => {
        tokens.push({
          id: `audio:${sourceName}:${seg.start.toFixed(1)}-${seg.end.toFixed(1)}:seg_${i}`,
          type: 'audio',
          value: seg.text,
          source: sourceName,
          meta: { start: seg.start, end: seg.end }
        });
      });
      return tokens;
    }

    // Fallback: Split by sentences ~6s logic simplified to clause splitting
    const rawSegments = transcript.split(/([.!?\n]+)/);
    let charCount = 0;
    
    for (let i = 0; i < rawSegments.length; i += 2) {
        const textChunk = rawSegments[i];
        const delimiter = rawSegments[i+1] || '';
        const fullSentence = (textChunk + delimiter).trim();
        
        if (fullSentence.length < 3) continue;
        
        const start = charCount;
        const end = charCount + fullSentence.length;
        
        // Slug for ID
        const slug = fullSentence.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        tokens.push({
            id: `text:${sourceName}:${start}-${end}:${slug}`,
            type: 'text',
            value: fullSentence,
            source: sourceName,
            meta: { start, end }
        });
        
        charCount = end;
    }
    
    return tokens;
}

/**
 * 4. Master Collector
 */
export function collectAllEvidence(inputs: {
    images: File[], 
    reportText: string, 
    symptomsText: string
}): EvidenceToken[] {
    const imgTokens = extractImageEvidence(inputs.images);
    const labTokens = extractLabEvidence(inputs.reportText);
    const symptomTokens = extractAudioEvidence(inputs.symptomsText, 'symptoms');
    const reportNarrativeTokens = extractAudioEvidence(inputs.reportText, 'report');

    return [...imgTokens, ...labTokens, ...symptomTokens, ...reportNarrativeTokens];
}

export const exampleEvidenceMap = {
  "pneumonia": [
    { id: "image:cxr_pneumonia:Primary_Finding", type: "image", value: "RLL Consolidation", source: "cxr.jpg" },
    { id: "lab:General:O2=91", type: "lab", value: "91", source: "report" }
  ]
};