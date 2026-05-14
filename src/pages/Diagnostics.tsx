import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { extractToolsAndRentals, interpretDiagnostics, troubleshootHardware, calculateRepairWorth } from '../lib/geminiAgent';
import { Stethoscope, Loader2, Save, Wrench, PlugZap, CircleDollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function Diagnostics() {
  const { vehicles, diagnostics } = useAppStore();
  const [vehicleId, setVehicleId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [obd2Codes, setObd2Codes] = useState('');
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [aiTools, setAiTools] = useState('');
  const [aiHardwareDebug, setAiHardwareDebug] = useState('');
  const [aiRepairWorth, setAiRepairWorth] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingTools, setIsExtractingTools] = useState(false);
  const [isDebuggingHardware, setIsDebuggingHardware] = useState(false);
  const [isCalculatingWorth, setIsCalculatingWorth] = useState(false);

  const handleAnalyzeRef = React.useRef<() => void>(() => {});
  const handleSaveRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    const handleVoiceAnalyze = () => handleAnalyzeRef.current();
    const handleVoiceSave = () => handleSaveRef.current();

    window.addEventListener('voice-analyze', handleVoiceAnalyze);
    window.addEventListener('voice-save', handleVoiceSave);
    return () => {
      window.removeEventListener('voice-analyze', handleVoiceAnalyze);
      window.removeEventListener('voice-save', handleVoiceSave);
    };
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiDiagnosis('');
    setAiTools('');
    setAiHardwareDebug('');
    setAiRepairWorth('');
    try {
      const result = await interpretDiagnostics(symptoms, obd2Codes);
      setAiDiagnosis(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractTools = async () => {
    if (!aiDiagnosis) return;
    setIsExtractingTools(true);
    try {
      const result = await extractToolsAndRentals(aiDiagnosis);
      setAiTools(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsExtractingTools(false);
    }
  };

  const handleHardwareDebug = async () => {
    setIsDebuggingHardware(true);
    try {
      const v = vehicles.find(x => x.id === vehicleId);
      const vStr = v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
      const result = await troubleshootHardware(vStr, `${symptoms} ${obd2Codes}`);
      setAiHardwareDebug(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsDebuggingHardware(false);
    }
  };

  const handleRepairWorth = async () => {
    if (!aiDiagnosis) return;
    setIsCalculatingWorth(true);
    try {
      const v = vehicles.find(x => x.id === vehicleId);
      const vStr = v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
      const result = await calculateRepairWorth(vStr, aiDiagnosis);
      setAiRepairWorth(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsCalculatingWorth(false);
    }
  };

  const handleSave = async () => {
    if (!vehicleId) {
      alert("Please select a vehicle to save to.");
      return;
    }
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'diagnostics'), {
        vehicleId,
        symptoms,
        obd2Codes,
        aiDiagnosis,
        aiTools,
        aiHardwareDebug,
        aiRepairWorth,
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      alert('Diagnostic saved to vehicle record.');
      setSymptoms('');
      setObd2Codes('');
      setAiDiagnosis('');
      setAiTools('');
      setAiHardwareDebug('');
      setAiRepairWorth('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze;
    handleSaveRef.current = handleSave;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Diagnostics & OBD2
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-[#E5E5E5]">Analyze Issue</h2>
          
          <div className="mb-4">
            <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">Target Vehicle (Optional until Save)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.vin || 'No VIN'})</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">Symptoms Describe (What does it sound/feel like?)</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
              placeholder="e.g. Whining noise when turning steering wheel left..."
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">OBD2 Codes</label>
            <input
              type="text"
              value={obd2Codes}
              onChange={(e) => setObd2Codes(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37] font-mono uppercase"
              placeholder="e.g. P0300, P0171..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!symptoms && !obd2Codes)}
                className="flex-1 px-4 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stethoscope className="w-5 h-5" />}
                {isAnalyzing ? 'Analyzing...' : 'Run AI Diagnostic'}
              </button>
              <button
                onClick={handleSave}
                disabled={!aiDiagnosis || isSaving}
                className="flex-1 px-4 py-3 bg-[#2A2A2A] text-white font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2 border border-[#333]"
              >
                <Save className="w-5 h-5" />
                Save Record
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleHardwareDebug}
                disabled={isDebuggingHardware || !vehicleId}
                className="flex-1 px-4 py-2 bg-[#0A0A0A] text-[#A3A3A3] text-sm font-semibold rounded-lg border border-[#2A2A2A] hover:border-[#D4AF37]/50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
               >
                 {isDebuggingHardware ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
                 {isDebuggingHardware ? 'Debugging...' : "Hardware Won't Connect?"}
              </button>
              <button
                onClick={handleRepairWorth}
                disabled={isCalculatingWorth || !aiDiagnosis}
                className="flex-1 px-4 py-2 bg-[#0A0A0A] text-[#A3A3A3] text-sm font-semibold rounded-lg border border-[#2A2A2A] hover:border-[#D4AF37]/50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
               >
                 {isCalculatingWorth ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
                 {isCalculatingWorth ? 'Calculating...' : 'Calculate Repair Worth'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 min-h-[400px]">
          <h2 className="text-xl font-bold mb-4 text-[#E5E5E5] flex justify-between items-center">
            AI Analysis Result
            {aiDiagnosis && !aiTools && (
              <button 
                onClick={handleExtractTools}
                disabled={isExtractingTools}
                className="text-xs px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded flex items-center gap-1 hover:bg-[#D4AF37]/20 transition-colors"
               >
                 {isExtractingTools ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                 {isExtractingTools ? 'Extracting...' : 'Extract Required Tools'}
              </button>
            )}
          </h2>
          {aiDiagnosis || aiHardwareDebug ? (
            <div className="flex flex-col gap-6">
              {aiHardwareDebug && (
                <div className="mb-4">
                  <h3 className="text-[#D4AF37] font-bold flex items-center gap-2 mb-3"><PlugZap className="w-4 h-4" /> Hardware Diagnostics</h3>
                  <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] max-w-none text-sm">
                    <ReactMarkdown>{aiHardwareDebug}</ReactMarkdown>
                  </div>
                </div>
              )}
              {aiDiagnosis && (
                <div className={aiHardwareDebug ? "pt-4 border-t border-[#2A2A2A]" : ""}>
                  <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] max-w-none text-sm">
                      <ReactMarkdown>{aiDiagnosis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {aiTools && (
                <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                  <h3 className="text-[#D4AF37] font-bold flex items-center gap-2 mb-3"><Wrench className="w-4 h-4" /> Tool & Rental Assistance</h3>
                  <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] prose-a:text-[#A3A3A3] hover:prose-a:text-[#D4AF37] max-w-none text-sm">
                    <ReactMarkdown>{aiTools}</ReactMarkdown>
                  </div>
                </div>
              )}
              {aiRepairWorth && (
                <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                  <h3 className="text-[#D4AF37] font-bold flex items-center gap-2 mb-3"><CircleDollarSign className="w-4 h-4" /> Repair Worth Calculator</h3>
                  <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] max-w-none text-sm">
                    <ReactMarkdown>{aiRepairWorth}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#A3A3A3]">
              <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
              <p>Enter data and run diagnostic to see results here.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Diagnostics for the selected vehicle or global */}
      <h2 className="text-xl font-bold mt-12 mb-4 text-[#E5E5E5]">Recent Diagnostic Records</h2>
      <div className="space-y-4">
        {diagnostics.slice(0, 5).map(d => {
          const v = vehicles.find(x => x.id === d.vehicleId);
          return (
          <div key={d.id} className="bg-[#161616] p-4 rounded-xl border border-[#2A2A2A]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-[#E5E5E5]">{v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle'}</h3>
                <p className="text-xs text-[#A3A3A3]">{new Date(d.createdAt).toLocaleString()}</p>
              </div>
              {d.obd2Codes && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-xs font-mono">{d.obd2Codes}</span>}
            </div>
            {d.symptoms && <p className="text-sm text-[#E5E5E5] italic">"{d.symptoms}"</p>}
            <details className="mt-3">
              <summary className="text-sm text-[#D4AF37] cursor-pointer outline-none">View AI Analysis & Tools</summary>
              <div className="mt-2 text-xs text-[#A3A3A3] bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A] flex flex-col gap-4">
                {d.aiHardwareDebug && (
                  <div>
                    <h4 className="text-[#E5E5E5] font-bold mb-1 flex items-center gap-1"><PlugZap className="w-3 h-3 text-[#D4AF37]" /> Hardware Diagnostics</h4>
                    <div className="prose prose-invert prose-xs">
                      <ReactMarkdown>{d.aiHardwareDebug}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {d.aiDiagnosis && (
                  <div className={d.aiHardwareDebug ? "pt-3 border-t border-[#2A2A2A]" : ""}>
                    <h4 className="text-[#E5E5E5] font-bold mb-1">Diagnosis</h4>
                    <div className="prose prose-invert prose-xs">
                      <ReactMarkdown>{d.aiDiagnosis}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {d.aiTools && (
                  <div className="pt-3 border-t border-[#2A2A2A]">
                    <h4 className="text-[#E5E5E5] font-bold mb-1 flex items-center gap-1"><Wrench className="w-3 h-3 text-[#D4AF37]" /> Tools & Rentals</h4>
                    <div className="prose prose-invert prose-xs prose-a:text-[#A3A3A3] hover:prose-a:text-[#D4AF37]">
                      <ReactMarkdown>{d.aiTools}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {d.aiRepairWorth && (
                  <div className="pt-3 border-t border-[#2A2A2A]">
                    <h4 className="text-[#E5E5E5] font-bold mb-1 flex items-center gap-1"><CircleDollarSign className="w-3 h-3 text-[#D4AF37]" /> Repair Worth</h4>
                    <div className="prose prose-invert prose-xs">
                      <ReactMarkdown>{d.aiRepairWorth}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
        )})}
        {diagnostics.length === 0 && <p className="text-[#A3A3A3] italic">No saved diagnostics yet.</p>}
      </div>
    </div>
  );
}
