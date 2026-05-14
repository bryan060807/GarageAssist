import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { generateHealthReport } from '../lib/geminiAgent';
import { FileText, Loader2, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function HealthReports() {
  const { vehicles, diagnostics, inspections, reports } = useAppStore();
  const [vehicleId, setVehicleId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentReport, setCurrentReport] = useState('');

  const handleGenerate = async () => {
    if (!vehicleId) {
      alert("Please select a vehicle first.");
      return;
    }
    
    setIsGenerating(true);
    setCurrentReport('');
    try {
      const v = vehicles.find(x => x.id === vehicleId);
      const vehicleStr = v ? `${v.year} ${v.make} ${v.model} (VIN: ${v.vin || 'N/A'})` : 'Unknown Vehicle';
      
      const vDiags = diagnostics.filter(d => d.vehicleId === vehicleId).slice(0, 5);
      const vInsps = inspections.filter(i => i.vehicleId === vehicleId).slice(0, 5);
      
      const diagText = vDiags.map(d => `- Date: ${new Date(d.createdAt).toLocaleDateString()}\n  Symptoms: ${d.symptoms}\n  Codes: ${d.obd2Codes}\n  AI Diag: ${d.aiDiagnosis}`).join('\n\n');
      const inspText = vInsps.map(i => `- Date: ${new Date(i.createdAt).toLocaleDateString()}\n  Notes: ${i.notes}\n  AI Vision: ${i.aiAnalysis}`).join('\n\n');
      
      const result = await generateHealthReport(vehicleStr, diagText, inspText);
      setCurrentReport(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !vehicleId || !currentReport) return;
    
    setIsSaving(true);
    try {
      const v = vehicles.find(x => x.id === vehicleId);
      await addDoc(collection(db, 'health_reports'), {
        vehicleId,
        title: `${v?.make} ${v?.model} Health Report`,
        summary: currentReport,
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      alert('Report saved to vehicle record.');
      setCurrentReport('');
      setVehicleId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'health_reports');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Health Reports
        </h1>
      </div>

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#E5E5E5]">Generate New Report</h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
          <div className="flex-1">
            <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">Select Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !vehicleId}
            className="w-full md:w-auto justify-center px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Compile Report'}
          </button>
        </div>
      </div>

      {currentReport && (
        <div className="bg-[#161616] border border-[#D4AF37]/50 rounded-xl p-6 mb-8 relative">
          <div className="absolute top-4 right-4 print:hidden">
            <button
               onClick={handleSave}
               disabled={isSaving}
               className="px-4 py-2 bg-[#D4AF37] text-black font-medium text-sm rounded hover:bg-opacity-90 flex items-center gap-2"
            >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Save Final Report
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-[#D4AF37] print:text-black">Generated Health Report</h2>
          <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] max-w-none print:prose-p:text-black print:prose-headings:text-black">
              <ReactMarkdown>{currentReport}</ReactMarkdown>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4 text-[#E5E5E5]">Saved Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r => {
           const v = vehicles.find(x => x.id === r.vehicleId);
           return (
             <div key={r.id} className="bg-[#161616] p-5 rounded-xl border border-[#2A2A2A] hover:border-[#D4AF37] transition-colors">
                <div className="flex items-center gap-3 mb-2">
                   <FileText className="w-5 h-5 text-[#A3A3A3]" />
                   <h3 className="font-bold text-[#E5E5E5]">{r.title || `${v?.make} Report`}</h3>
                </div>
                <p className="text-xs text-[#A3A3A3] mb-4">{new Date(r.createdAt).toLocaleString()}</p>
                <details>
                   <summary className="text-sm font-medium text-[#D4AF37] cursor-pointer outline-none">View Report</summary>
                   <div className="mt-3 text-sm bg-[#0A0A0A] p-4 rounded-lg border border-[#2A2A2A] prose-sm prose-invert text-[#A3A3A3]">
                      <ReactMarkdown>{r.summary || ''}</ReactMarkdown>
                   </div>
                </details>
             </div>
           )
        })}
        {reports.length === 0 && <p className="text-[#A3A3A3] italic">No saved reports yet.</p>}
      </div>
    </div>
  );
}
