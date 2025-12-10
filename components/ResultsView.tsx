import React, { useState } from 'react';
import { MedicalAnalysis, Diagnosis, TabItem } from '../types';
import { highlightEvidenceToken, getBBoxStyle } from './EvidenceMap';
import '../styles/ui-overrides.css';

interface ResultsViewProps {
  data: MedicalAnalysis;
  images: File[];
  onReset: () => void;
}

const UrgencyBadge = ({ level }: { level: Diagnosis['urgency'] }) => {
  const styles = {
    Routine: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Soon: 'bg-amber-50 text-amber-700 border-amber-200',
    Urgent: 'bg-orange-50 text-orange-700 border-orange-200',
    Emergency: 'bg-red-50 text-red-700 border-red-200 animate-pulse font-bold',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${styles[level]}`}>
      {level}
    </span>
  );
};

const toPercent = (val: number | undefined | null) => {
  if (val === undefined || val === null) return 0;
  const n = Number(val);
  return n <= 1.5 ? Math.round(n * 100) : Math.round(n);
};

export const ResultsView: React.FC<ResultsViewProps> = ({ data, images, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [emergencyAck, setEmergencyAck] = useState(false);
  const [highlightedTokenId, setHighlightedTokenId] = useState<string | null>(null);

  const handleHighlight = (tokenId: string) => {
    setHighlightedTokenId(tokenId);
    highlightEvidenceToken(tokenId);
    setTimeout(() => setHighlightedTokenId(null), 2000);
  };

  const differentials = data.differentials || [];

  const handlePrint = () => {
    window.print();
  };

  // Emergency Modal
  if (data.emergency && !emergencyAck) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border-l-8 border-red-600">
          <div className="flex items-center gap-4 mb-4 text-red-700">
             <div className="p-3 bg-red-100 rounded-full">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </div>
             <div>
               <h2 className="text-2xl font-bold">Emergency Protocol</h2>
               <p className="text-red-600 text-sm font-medium">Immediate attention required</p>
             </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
            <h3 className="font-bold text-red-900 mb-2 text-sm uppercase tracking-wider">Triggers Identified:</h3>
            <ul className="list-disc list-inside space-y-1 text-red-800 text-sm font-medium">
              {data.emergency_reasons?.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <button 
            onClick={() => setEmergencyAck(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95"
          >
            Acknowledge & View Report
          </button>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    { id: 'summary', label: 'Clinical Summary' },
    { id: 'reasoning', label: 'Evidence & Logic' },
    { id: 'note', label: 'SOAP Note' },
    { id: 'audit', label: 'System Audit' },
  ];

  return (
    <div className="animate-fade-in bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full max-h-[850px]">
      
      {/* Clinical Header */}
      <div className="medmind-hero">
        <div className="medmind-brand">
            <div className="brand-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            </div>
            <div>
              <div className="medmind-title">Analysis Report</div>
              <div className="medmind-subtitle">Trace ID: <span className="font-mono text-xs">{data.audit?.trace_id?.slice(-8) || '—'}</span></div>
            </div>
        </div>

        <div className="flex gap-3">
            <button onClick={onReset} className="btn-action btn-secondary">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
               Reset
            </button>
            <button onClick={handlePrint} className="btn-action btn-primary">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
               Export Report
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-700 bg-white shadow-sm' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative bg-slate-50/30">
        
        {/* Contextual Images Bar */}
        {images.length > 0 && activeTab === 'summary' && (
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((file, idx) => (
               <div key={idx} className="relative w-40 h-40 flex-shrink-0 bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200 group">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                  {data.audit?.evidence
                    .filter((e: any) => e.type === 'image' && e.source === file.name)
                    .map((e: any) => (
                      <div 
                        key={e.id}
                        style={getBBoxStyle(e.id, highlightedTokenId, e.meta)} 
                      />
                  ))}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-[10px] text-white font-medium uppercase tracking-wider">{file.name}</span>
                  </div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-8 animate-fade-in-up">
             {/* Summary Box */}
             <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
               <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                 Executive Summary
               </h3>
               <p className="text-slate-700 leading-relaxed font-medium">
                 {data.summary}
               </p>
             </div>
             
             {/* Differentials */}
             <div className="space-y-4">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                 <span>Differential Diagnoses</span>
                 <span className="text-xs font-normal text-slate-500 normal-case">Sorted by calibrated confidence</span>
               </h3>
               
               {differentials.map((d: any, i: number) => {
                 const pct = toPercent(d.calibrated_confidence_fraction);
                 return (
                 <div key={i} className="result-card group">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{d.name}</span>
                        <UrgencyBadge level={d.urgency} />
                      </div>
                      <div className="text-right w-32">
                         <div className="flex justify-between items-end mb-1">
                           <span className="text-2xl font-bold text-blue-600">{pct}%</span>
                           <span className="text-[10px] text-slate-400 mb-1">CONFIDENCE</span>
                         </div>
                         <div className="confidence-track">
                           <div className="confidence-fill" style={{ width: `${pct}%` }}></div>
                         </div>
                      </div>
                   </div>
                   
                   <p className="text-sm text-slate-600 mb-4 leading-relaxed">{d.reasoning}</p>
                   
                   {d.warnings && d.warnings.length > 0 && (
                     <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-3">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <span>{d.warnings.join('. ')}</span>
                     </div>
                   )}

                   <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Supporting Evidence</span>
                      <div className="flex flex-wrap gap-2">
                        {(d.supporting_evidence || []).map((ev: string, idx: number) => (
                          <button 
                            key={idx} 
                            onClick={() => handleHighlight(ev)}
                            className={`evidence-chip ${highlightedTokenId === ev ? 'active' : ''}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {ev.split(':').pop()?.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                   </div>
                 </div>
               )})}
             </div>
          </div>
        )}

        {activeTab === 'reasoning' && (
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-slate-800">Evidence Provenance</h3>
             <div className="grid grid-cols-1 gap-2">
               {data.audit?.evidence.map((ev: any, i: number) => (
                 <div 
                   key={i} 
                   id={`evidence-${ev.id}`}
                   className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-colors"
                 >
                   <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider w-16 text-center">{ev.type}</span>
                   <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-blue-600 truncate mb-0.5">{ev.id}</div>
                      <div className="text-sm text-slate-700 font-medium truncate">"{ev.value}"</div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
        
        {activeTab === 'note' && (
           <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-3xl mx-auto">
             <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">Clinical Note</h2>
             <div className="prose prose-sm prose-slate max-w-none font-serif">
               <h4 className="uppercase text-xs font-bold text-slate-500 mb-2">Assessment & Differential</h4>
               <p className="whitespace-pre-wrap mb-6">{data.doctorNote.assessmentDifferential}</p>
               
               <h4 className="uppercase text-xs font-bold text-slate-500 mb-2">Plan & Recommendations</h4>
               <p className="whitespace-pre-wrap">{data.doctorNote.planAndRecommendations}</p>
             </div>
           </div>
        )}

        {activeTab === 'audit' && (
           <div className="bg-slate-900 p-6 rounded-lg shadow-inner overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase">System Trace Log</h3>
                <span className="text-xs font-mono text-slate-600">{data.audit?.trace_id}</span>
             </div>
             <pre className="text-xs font-mono text-emerald-400 overflow-x-auto custom-scrollbar h-[500px]">
               {JSON.stringify(data.audit, null, 2)}
             </pre>
           </div>
        )}
      </div>
    </div>
  );
};