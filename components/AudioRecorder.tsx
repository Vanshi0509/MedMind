import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onClear: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, onClear }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioRecorded(blob);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop()); // Stop mic access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleClear = () => {
    setHasRecording(false);
    setRecordingTime(0);
    onClear();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2">
        {!isRecording && !hasRecording && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors font-medium shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            Record Symptoms
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full transition-colors font-medium animate-pulse"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Stop ({formatTime(recordingTime)})
          </button>
        )}

        {hasRecording && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10"/></svg>
               <span className="text-sm font-medium">Audio Captured ({formatTime(recordingTime)})</span>
            </div>
            <button 
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              title="Delete recording"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 text-center">
        Describe symptoms, timeline, and pain levels naturally.
      </p>
    </div>
  );
};
