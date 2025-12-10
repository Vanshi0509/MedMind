import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioRecorder } from './components/AudioRecorder';
import { ResultsView } from './components/ResultsView';
import { ReasoningSidebar } from './components/ReasoningSidebar';
import { reasonOverAllInputs } from './services/geminiService';
import { MedicalAnalysis } from './types';
import { DEMO_CASES, createDummyImage, DemoCase } from './utils/demoData';
import './styles/ui-overrides.css';

const App = () => {
  const [images, setImages] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [symptomsText, setSymptomsText] = useState('');
  const [reportText, setReportText] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MedicalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
      setActiveDemo(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const loadDemoCase = async (demo: DemoCase) => {
    handleReset();
    setActiveDemo(demo.id);
    setSymptomsText(demo.symptoms);
    setReportText(demo.report);
    
    const dummyFile = createDummyImage(demo.imageLabel, demo.imageColor);
    setImages([dummyFile]);

    setTimeout(() => {
       runAnalysis([dummyFile], null, demo.symptoms, demo.report, demo.context);
    }, 600);
  };

  const runAnalysis = async (
    imgs: File[], 
    aud: Blob | null, 
    symp: string, 
    rep: string, 
    context?: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await reasonOverAllInputs(imgs, aud, symp, rep, context);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please verify API key and connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualAnalyze = () => {
    if (images.length === 0 && !audioBlob && !symptomsText && !reportText) {
      setError("Please provide at least one input (Image, Audio, or Text).");
      return;
    }
    runAnalysis(images, audioBlob, symptomsText, reportText);
  };

  const handleReset = () => {
    setImages([]);
    setAudioBlob(null);
    setSymptomsText('');
    setReportText('');
    setResult(null);
    setError(null);
    setActiveDemo(null);
  };

  return (
    <div className="min-h-screen pb-12 font-sans text-slate-900 relative">
      {/* Background Glow */}
      <div className="hero-glow"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">MedMind</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Online
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Empty State */}
        {!result && !isAnalyzing && (
          <div className="text-center mb-12 pt-8 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Clinical Decision Support
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Reimagined</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Integrate multimodal patient data—imaging, voice, and labs—into a unified diagnostic reasoning stream. 
              <br/>Select a scenario to begin validation.
            </p>

            {/* Quick Scenarios */}
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {DEMO_CASES.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => loadDemoCase(demo)}
                  className={`demo-chip ${activeDemo === demo.id ? 'active' : ''}`}
                >
                  <span className="text-2xl">{demo.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">{demo.label}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Simulated Case</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-center gap-3 animate-fade-in">
             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* INPUT WORKSTATION */}
          <div className={`lg:col-span-${result ? '3' : '12'} transition-all duration-700 ease-in-out ${result ? 'hidden xl:block' : 'max-w-5xl mx-auto w-full'}`}>
            
            {/* If no result, show grid layout for inputs. If result, stack them vertically. */}
            <div className={`${!result ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
              
              {/* 1. IMAGING UNIT */}
              <div className="input-zone group">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    Imaging
                  </h3>
                  {images.length > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{images.length} File(s)</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-sm group/img">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-90" />
                      <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all aspect-square group/add">
                    <svg className="w-6 h-6 text-slate-400 group-hover/add:text-blue-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    <span className="text-xs font-semibold text-slate-500 group-hover/add:text-blue-600">Upload</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Supported: X-Ray, MRI, CT, Derm</p>
              </div>

              {/* 2. AUDIO UNIT */}
              <div className="input-zone">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    </div>
                    Voice Note
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <AudioRecorder onAudioRecorded={setAudioBlob} onClear={() => setAudioBlob(null)} />
                </div>
              </div>

              {/* 3. TEXT UNIT */}
              <div className={`input-zone ${!result ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    Clinical Data
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow resize-none"
                    rows={3}
                    placeholder="Describe symptoms..."
                    value={symptomsText}
                    onChange={(e) => setSymptomsText(e.target.value)}
                  />
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow resize-none"
                    rows={3}
                    placeholder="Paste lab values..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />
                </div>
              </div>

            </div>

            {/* ACTION BAR */}
            <div className={`mt-8 ${result ? 'mt-6' : 'text-center'}`}>
              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing}
                className={`
                   relative overflow-hidden group rounded-xl px-8 py-4 font-bold text-lg shadow-xl transition-all transform hover:scale-[1.02] active:scale-95
                   ${isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:shadow-2xl hover:shadow-blue-900/20'}
                   ${!result ? 'w-full md:w-auto md:min-w-[300px]' : 'w-full'}
                `}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing Clinical Data...
                    </>
                  ) : (
                    <>
                      <span>Generate Analysis</span>
                      <svg className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </>
                  )}
                </div>
                {!isAnalyzing && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>}
              </button>
            </div>
           
          </div>

          {/* RESULTS PANEL */}
          <div className={`${result ? 'lg:col-span-9 grid lg:grid-cols-9 gap-6' : 'hidden'}`}>
             <div className="lg:col-span-6">
                {result && <ResultsView data={result} images={images} onReset={handleReset} />}
             </div>
             <div className="lg:col-span-3">
                {result && <ReasoningSidebar data={result} />}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);