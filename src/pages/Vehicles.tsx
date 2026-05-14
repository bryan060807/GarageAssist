import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { Car, Plus, Trash2, CalendarClock, Loader2, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateMaintenanceSchedule, fetchVehicleOptions } from '../lib/geminiAgent';

export function Vehicles() {
  const { vehicles } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [submodel, setSubmodel] = useState('');
  const [engine, setEngine] = useState('');
  const [vin, setVin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Options State
  const [availableSubmodels, setAvailableSubmodels] = useState<string[]>([]);
  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Maintenance Schedule State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mileage, setMileage] = useState<string>('');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOptions = async () => {
      if (year && make && model && year.length === 4) {
        setIsLoadingOptions(true);
        const options = await fetchVehicleOptions(year, make, model);
        setAvailableSubmodels(options.submodels || []);
        setAvailableEngines(options.engines || []);
        setIsLoadingOptions(false);
      } else {
        setAvailableSubmodels([]);
        setAvailableEngines([]);
      }
    };
    
    // Add a slight delay to avoid fetching on every keystroke
    const timeoutId = setTimeout(fetchOptions, 500);
    return () => clearTimeout(timeoutId);
  }, [year, make, model]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'vehicles'), {
        make,
        model,
        year: parseInt(year, 10),
        submodel,
        engine,
        vin,
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setMake('');
      setModel('');
      setYear('');
      setSubmodel('');
      setEngine('');
      setVin('');
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vehicles');
    } finally {
      setIsSaving(false);
      setAvailableSubmodels([]);
      setAvailableEngines([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this vehicle?")) {
      try {
        await deleteDoc(doc(db, 'vehicles', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'vehicles');
      }
    }
  };

  const handleGenerateSchedule = async (id: string, vehicleStr: string) => {
    if (!mileage) {
      alert('Please enter current mileage');
      return;
    }
    setGeneratingFor(id);
    try {
      const result = await generateMaintenanceSchedule(vehicleStr, parseInt(mileage, 10));
      setSchedules(prev => ({ ...prev, [id]: result || '' }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <Car className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Vehicles
        </h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">Make</label>
            <input required value={make} onChange={e => setMake(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white" placeholder="e.g. Ford" />
          </div>
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">Model</label>
            <input required value={model} onChange={e => setModel(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white" placeholder="e.g. F-150" />
          </div>
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">Year</label>
            <input required type="number" min="1900" max="2100" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white" placeholder="e.g. 2018" />
          </div>
          
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">
              Submodel / Trim {isLoadingOptions && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#D4AF37]" />}
            </label>
            <input 
              value={submodel} 
              list="submodels-list"
              onChange={e => setSubmodel(e.target.value)} 
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white" 
              placeholder={availableSubmodels.length > 0 ? "Select or type..." : "e.g. XLT, EX-L"} 
            />
            <datalist id="submodels-list">
              {availableSubmodels.map((sm, i) => <option key={i} value={sm} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">
              Engine Size / Type {isLoadingOptions && <Loader2 className="w-3 h-3 animate-spin inline ml-1 text-[#D4AF37]" />}
            </label>
            <input 
              value={engine} 
              list="engines-list"
              onChange={e => setEngine(e.target.value)} 
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white" 
              placeholder={availableEngines.length > 0 ? "Select or type..." : "e.g. 5.0L V8"} 
            />
            <datalist id="engines-list">
              {availableEngines.map((en, i) => <option key={i} value={en} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">VIN (Optional)</label>
            <input value={vin} onChange={e => setVin(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white font-mono uppercase" placeholder="17-char VIN" maxLength={17} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-[#A3A3A3] hover:text-white">Cancel</button>
            <button disabled={isSaving} type="submit" className="px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-opacity-90">Save Vehicle</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(v => {
          const isExpanded = expandedId === v.id;
          const vStr = [v.year, v.make, v.model, v.submodel, v.engine].filter(Boolean).join(' ');
          return (
          <div key={v.id} className="p-5 bg-[#161616] border border-[#2A2A2A] rounded-xl hover:border-[#D4AF37] transition-colors group relative flex flex-col">
            <button onClick={() => handleDelete(v.id)} className="absolute top-4 right-4 text-[#A3A3A3] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#E5E5E5] leading-tight">{vStr}</h3>
                {v.vin && <p className="text-xs font-mono text-[#A3A3A3] bg-[#0A0A0A] px-2 py-0.5 rounded mt-1 inline-block">VIN: {v.vin}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
              className="mt-auto w-full py-2 bg-[#0A0A0A] text-[#A3A3A3] text-sm font-semibold rounded block text-center border border-[#2A2A2A] hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarClock className="w-4 h-4" /> Proactive Maintenance
            </button>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                <label className="block text-xs text-[#A3A3A3] mb-1">Current Mileage</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={expandedId === v.id ? mileage : ''}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 105000"
                    className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded p-2 text-sm text-white focus:border-[#D4AF37] outline-none"
                  />
                  <button
                    onClick={() => handleGenerateSchedule(v.id, vStr)}
                    disabled={generatingFor === v.id || !mileage}
                    className="px-3 bg-[#D4AF37] text-black text-sm font-bold rounded hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingFor === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Predict'}
                  </button>
                </div>
                
                {schedules[v.id] && (
                  <div className="mt-4 bg-[#0A0A0A] p-3 rounded border border-[#2A2A2A] max-h-[300px] overflow-y-auto">
                    <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-2">Maintenance & TSB Report</h4>
                    <div className="prose prose-invert prose-p:text-[#A3A3A3] prose-headings:text-[#E5E5E5] prose-strong:text-[#D4AF37] prose-li:text-[#A3A3A3] text-xs">
                      <ReactMarkdown>{schedules[v.id]}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )})}
        {vehicles.length === 0 && !showAdd && (
          <div className="col-span-full text-center py-12 text-[#A3A3A3] border border-dashed border-[#2A2A2A] rounded-xl">
            No vehicles added yet. Click "Add Vehicle" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
