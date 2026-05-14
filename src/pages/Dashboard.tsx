import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Car, Wrench, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { vehicles, diagnostics, parts } = useAppStore();

  const neededParts = parts.filter(p => p.status === 'Needed' || p.status === 'Ordered').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] mb-6">Garage Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        
        <Link to="/vehicles" className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl flex items-center justify-between hover:border-[#D4AF37] transition-colors">
          <div>
              <p className="text-sm font-medium text-[#A3A3A3] mb-1">Active Vehicles</p>
              <p className="text-3xl font-bold text-[#E5E5E5]">{vehicles.length}</p>
          </div>
          <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center">
             <Car className="text-[#D4AF37] w-6 h-6" />
          </div>
        </Link>

        <Link to="/diagnostics" className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl flex items-center justify-between hover:border-[#D4AF37] transition-colors">
          <div>
              <p className="text-sm font-medium text-[#A3A3A3] mb-1">Diagnostics Performed</p>
              <p className="text-3xl font-bold text-[#E5E5E5]">{diagnostics.length}</p>
          </div>
          <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center">
             <Wrench className="text-[#D4AF37] w-6 h-6" />
          </div>
        </Link>
        
        <Link to="/parts" className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl flex items-center justify-between hover:border-[#D4AF37] transition-colors">
          <div>
              <p className="text-sm font-medium text-[#A3A3A3] mb-1">Parts Needed/Ordered</p>
              <p className="text-3xl font-bold text-[#E5E5E5]">{neededParts}</p>
          </div>
          <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center">
             <PackageSearch className="text-[#D4AF37] w-6 h-6" />
          </div>
        </Link>

      </div>
      
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[#E5E5E5] mb-4">Welcome to GarageAssist</h2>
        <p className="text-[#A3A3A3] max-w-2xl">Use the sidebar to navigate through your garage management tools. You can add vehicles, run AI diagnostics on OBD2 codes or symptom descriptions, do photo inspections of worn parts, and track your parts inventory.</p>
      </div>
    </div>
  );
}
