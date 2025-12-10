import React, { useState, useEffect } from 'react';
import { MedicalAnalysis } from '../types';
import '../styles/ui-overrides.css';

interface ReasoningSidebarProps {
  data: MedicalAnalysis;
}

export const ReasoningSidebar: React.FC<ReasoningSidebarProps> = ({ data }) => {
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationStep, setSimulationStep] = useState(0);

  // Simulation steps for the "Thinking" effect
  const simulationLog = [
    "Initializing multimodal inference engine...",
    "Standardizing clinical inputs (FHIR/LOINC)...",
    "Detecting anatomical landmarks in imaging...",
    "Vectorizing symptoms and audio transcripts...",
    "Querying medical knowledge graph (v4.5)...",
    "Cross-referencing differentials...",
    "Calibrating confidence scores...",
    "Synthesizing final assessment..."
  ];

  useEffect(() => {
    // Reset state when data changes
    setIsSimulating(true);
    setSimulationStep(0);

    const stepTime = 300; // Time per log line
    const interval = setInterval(() => {
      setSimulationStep(prev => {
        // Stop when we reach the end
        if (prev >= simulationLog.length - 1) {
          clearInterval(interval);
          // Small pause before revealing result
          setTimeout(() => setIsSimulating(false), 800);
          return prev;
        }
        return prev + 1;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [data]);

  const steps = data.reasoningChain || [];

  return (
    <div className="bg-slate-900 text-slate-100 h-full rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-800 relative">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center z-10">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            {isSimulating ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            )}
            {isSimulating ? 'System Processing' : 'Clinical Reasoning'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isSimulating ? 'Live Inference Stream' : 'AI Logic Trace'}
          </p>
        </div>
        {!isSimulating && (
           <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
             COMPLETE
           </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        
        {/* SIMULATION VIEW (Terminal Style) */}
        {isSimulating && (
          <div className="space-y-3 font-mono text-xs">
            {simulationLog.map((log, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 transition-opacity duration-300 ${i <= simulationStep ? 'opacity-100' : 'opacity-0'}`}
              >
                <span className="text-slate-600 w-4">
                  {i < simulationStep ? '✓' : '>'}
                </span>
                <span className={i === simulationStep ? 'text-blue-300 typing-cursor' : 'text-slate-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ACTUAL RESULTS VIEW (Animated Entry) */}
        {!isSimulating && (
          <div className="animate-fade-in-up">
            {/* Chain Stepper */}
            <div className="mb-8">
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="stepper-item animate-fade-in-up" 
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="stepper-line"></div>
                  <div className="stepper-dot"></div>
                  <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {/* Calibration Stats */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
               <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Confidence Calibration</h4>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-xs text-slate-500 mb-1">Inputs</div>
                   <div className="text-lg font-mono font-medium text-white">{data.meta?.nModalities ?? 0} <span className="text-xs text-slate-600">types</span></div>
                 </div>
                 <div>
                   <div className="text-xs text-slate-500 mb-1">Data Quality</div>
                   <div className="text-lg font-mono font-medium text-emerald-400">{data.meta?.qualityScore ?? 0.8}</div>
                 </div>
               </div>
            </div>

            {/* Pipeline Actions */}
            <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Post-Processing Checks</h4>
               <ul className="space-y-2">
                 {(data.audit?.postprocessing_actions || []).map((act, i) => (
                   <li key={i} className="text-xs font-mono text-slate-400 flex items-center gap-2">
                     <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                     {act}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Scan line effect only during simulation */}
      {isSimulating && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-[100px] animate-[scanVertical_2s_ease-in-out_infinite]"></div>
      )}
    </div>
  );
};