import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { interpretPartImage, decodeWiringHarness, localizeComponents, verifyReassembly } from '../lib/geminiAgent';
import { Camera, Image as ImageIcon, Loader2, Save, UploadCloud, Zap, MapPin, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function Inspections() {
  const { vehicles, inspections } = useAppStore();
  const [vehicleId, setVehicleId] = useState('');
  const [inspectionType, setInspectionType] = useState<'part' | 'wiring' | 'spatial' | 'verify'>('part');
  const [description, setDescription] = useState('');
  const [targetComponent, setTargetComponent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      alert("Please upload an image first.");
      return;
    }
    
    setIsAnalyzing(true);
    setAiAnalysis('');
    try {
      // Clean base64 string
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imageFile?.type || 'image/jpeg';
      
      let result;
      if (inspectionType === 'wiring') {
        const v = vehicles.find(x => x.id === vehicleId);
        const vStr = v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
        result = await decodeWiringHarness(base64Data, mimeType, vStr, description);
      } else if (inspectionType === 'spatial') {
        const v = vehicles.find(x => x.id === vehicleId);
        const vStr = v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
        result = await localizeComponents(base64Data, mimeType, vStr, targetComponent);
      } else if (inspectionType === 'verify') {
        const v = vehicles.find(x => x.id === vehicleId);
        const vStr = v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
        result = await verifyReassembly(base64Data, mimeType, vStr, targetComponent);
      } else {
        result = await interpretPartImage(base64Data, mimeType, description);
      }
      setAiAnalysis(result || '');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsAnalyzing(false);
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
      await addDoc(collection(db, 'inspections'), {
        vehicleId,
        type: inspectionType,
        targetComponent,
        notes: description,
        aiAnalysis,
        photoUrl: '', // Not keeping in Firestore to stay under 1MB limit. Only saving the analysis text.
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      alert('Inspection saved to vehicle record.');
      setDescription('');
      setTargetComponent('');
      setImageFile(null);
      setImagePreview('');
      setAiAnalysis('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'inspections');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Photo Inspections
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-[#E5E5E5]">New Inspection</h2>
          
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

          <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => setInspectionType('part')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border transition-colors ${inspectionType === 'part' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:border-[#D4AF37]/50'}`}
            >
              <ImageIcon className="w-4 h-4" /> Part/Area
            </button>
            <button
              onClick={() => setInspectionType('wiring')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border transition-colors ${inspectionType === 'wiring' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:border-[#D4AF37]/50'}`}
            >
              <Zap className="w-4 h-4" /> Wiring
            </button>
            <button
              onClick={() => setInspectionType('spatial')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border transition-colors ${inspectionType === 'spatial' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:border-[#D4AF37]/50'}`}
            >
              <MapPin className="w-4 h-4" /> Locate
            </button>
            <button
              onClick={() => setInspectionType('verify')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm border transition-colors ${inspectionType === 'verify' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:border-[#D4AF37]/50'}`}
            >
              <CheckCircle className="w-4 h-4" /> Verify
            </button>
          </div>
          
          <div className="mb-4">
             <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">Upload Photo</label>
             <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
             {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-[#2A2A2A] rounded-lg flex flex-col items-center justify-center text-[#A3A3A3] hover:text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span>Click to browse photos</span>
                </div>
             ) : (
               <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#2A2A2A]">
                 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                 <button onClick={() => { setImageFile(null); setImagePreview(''); setAiAnalysis(''); }} className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 flex items-center text-xs rounded hover:bg-black/70">
                   Clear
                 </button>
               </div>
             )}
          </div>

          {(inspectionType === 'spatial' || inspectionType === 'verify') && (
            <div className="mb-4">
              <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">
                {inspectionType === 'spatial' ? 'Component to Locate' : 'Component Name'}
              </label>
              <input
                type="text"
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder={inspectionType === 'spatial' ? "e.g. PCV Valve, Starter, O2 Sensor" : "e.g. Torsion Bar Key, Ball Joint"}
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block tracking-tight text-[#A3A3A3] text-sm font-medium mb-1">Observation Notes (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
              placeholder="e.g. Looks like oil leak starting near the valve cover gasket..."
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !imagePreview}
              className="flex-1 px-4 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              {isAnalyzing ? 'Analyzing...' : 'Run Vision Check'}
            </button>
            <button
              onClick={handleSave}
              disabled={!aiAnalysis || isSaving}
              className="flex-1 px-4 py-3 bg-[#2A2A2A] text-white font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2 border border-[#333]"
            >
              <Save className="w-5 h-5" />
              Save Record
            </button>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 min-h-[400px]">
          <h2 className="text-xl font-bold mb-4 text-[#E5E5E5]">AI Vision Analysis</h2>
          {aiAnalysis ? (
            <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] max-w-none text-sm">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#A3A3A3]">
              <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Upload a photo and run vision check to see results here.</p>
            </div>
          )}
        </div>
      </div>
      
      <h2 className="text-xl font-bold mt-12 mb-4 text-[#E5E5E5]">Recent Photo Inspections</h2>
      <div className="space-y-4">
        {inspections.slice(0, 5).map(insp => {
          const v = vehicles.find(x => x.id === insp.vehicleId);
          return (
          <div key={insp.id} className="bg-[#161616] p-4 rounded-xl border border-[#2A2A2A]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-[#E5E5E5]">{v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle'}</h3>
                <p className="text-xs text-[#A3A3A3] flex items-center gap-2">
                  <span>{new Date(insp.createdAt).toLocaleString()}</span>
                  {insp.type && (
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {insp.type === 'part' ? 'Part Area' : insp.type === 'wiring' ? 'Wiring' : insp.type === 'spatial' ? 'Location' : 'Verify'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {insp.targetComponent && <p className="text-sm text-[#D4AF37] mb-1 font-medium">Target: {insp.targetComponent}</p>}
            {insp.notes && <p className="text-sm text-[#E5E5E5] italic">"{insp.notes}"</p>}
            <details className="mt-3">
              <summary className="text-sm text-[#D4AF37] cursor-pointer outline-none">View AI Analysis</summary>
              <div className="mt-2 text-xs text-[#A3A3A3] bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A]">
                <ReactMarkdown>{insp.aiAnalysis || ''}</ReactMarkdown>
              </div>
            </details>
          </div>
        )})}
        {inspections.length === 0 && <p className="text-[#A3A3A3] italic">No saved inspections yet.</p>}
      </div>
    </div>
  );
}
