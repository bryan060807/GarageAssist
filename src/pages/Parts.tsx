import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collection, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { PackageSearch, Plus, Trash2, ExternalLink, ShoppingCart, Car } from 'lucide-react';

export function Parts() {
  const { parts, vehicles } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState<'Needed' | 'Ordered' | 'In Stock'>('Needed');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'parts'), {
        name,
        sku,
        vehicleId,
        status,
        ownerId: auth.currentUser.uid,
        createdAt: Date.now()
      });
      setName('');
      setSku('');
      setVehicleId('');
      setStatus('Needed');
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'parts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this part?")) {
      try {
        await deleteDoc(doc(db, 'parts', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'parts');
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'parts', id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'parts');
    }
  };

  const getSearchUrls = (partName: string, pVehicleId?: string) => {
    const v = vehicles.find(v => v.id === pVehicleId);
    const vehicleStr = v ? `${v.year} ${v.make} ${v.model}` : '';
    const query = encodeURIComponent(`${vehicleStr} ${partName}`.trim());
    return {
      amazon: `https://www.amazon.com/s?k=${query}&i=automotive`,
      oreilly: `https://www.oreillyauto.com/search?q=${query}`,
      autozone: `https://www.autozone.com/searchresult?searchText=${query}`,
      rockauto: `https://www.google.com/search?q=site:rockauto.com+${query}`,
      napa: `https://www.napaonline.com/en/search?q=${query}`
    };
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <PackageSearch className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Parts & Sourcing
        </h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Part
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-[#A3A3A3] mb-1">Part Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white outline-none focus:border-[#D4AF37]" placeholder="e.g. Front Brake Pads" />
          </div>
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">Linked Vehicle (Optional)</label>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white outline-none focus:border-[#D4AF37]">
              <option value="">No Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#A3A3A3] mb-1">SKU / OEM Number (Optional)</label>
            <input value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-white font-mono outline-none focus:border-[#D4AF37]" placeholder="e.g. BRK-813" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-[#A3A3A3] hover:text-white">Cancel</button>
            <button disabled={isSaving} type="submit" className="px-4 py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-opacity-90">Save Part</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {parts.map(p => {
          const urls = getSearchUrls(p.name, p.vehicleId);
          const v = vehicles.find(v => v.id === p.vehicleId);
          return (
            <div key={p.id} className="p-5 bg-[#161616] border border-[#2A2A2A] rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-[#E5E5E5]">{p.name}</h3>
                  {p.sku && <span className="text-xs font-mono bg-[#0A0A0A] border border-[#2A2A2A] px-2 py-0.5 rounded text-[#A3A3A3]">{p.sku}</span>}
                </div>
                {v && (
                  <p className="text-sm flex items-center gap-1 text-[#A3A3A3]">
                    <Car className="w-3 h-3 text-[#D4AF37]" /> {v.year} {v.make} {v.model}
                  </p>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-[#A3A3A3] uppercase mr-2 flex items-center">
                    <ShoppingCart className="w-3 h-3 mr-1" /> Quick Order:
                  </span>
                  <a href={urls.amazon} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded hover:border-[#D4AF37] text-[#E5E5E5] flex items-center gap-1">
                    Amazon <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={urls.oreilly} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded hover:border-[#D4AF37] text-[#E5E5E5] flex items-center gap-1">
                    O'Reilly <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={urls.autozone} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded hover:border-[#D4AF37] text-[#E5E5E5] flex items-center gap-1">
                    AutoZone <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={urls.rockauto} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded hover:border-[#D4AF37] text-[#E5E5E5] flex items-center gap-1">
                    RockAuto <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <select 
                  value={p.status} 
                  onChange={(e) => updateStatus(p.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border outline-none ${
                    p.status === 'Needed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    p.status === 'Ordered' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}
                >
                  <option value="Needed" className="bg-[#0A0A0A] text-white">Needed</option>
                  <option value="Ordered" className="bg-[#0A0A0A] text-white">Ordered</option>
                  <option value="In Stock" className="bg-[#0A0A0A] text-white">In Stock</option>
                </select>

                <button onClick={() => handleDelete(p.id)} className="p-2 text-[#A3A3A3] hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
        {parts.length === 0 && !showAdd && (
          <div className="text-center py-12 text-[#A3A3A3] border border-dashed border-[#2A2A2A] rounded-xl bg-[#161616]">
            No parts tracked yet. Add parts to get sourcing links.
          </div>
        )}
      </div>
    </div>
  );
}
