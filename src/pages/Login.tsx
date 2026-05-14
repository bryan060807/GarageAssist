import React from 'react';
import { loginWithGoogle } from '../services/firebase';
import { ShieldCheck, UserCog, Wrench } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 sm:p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-[#161616] p-8 sm:p-10 border border-[#2A2A2A] rounded-xl shadow-2xl relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37]/10 rounded-xl mb-6 border border-[#D4AF37]/20">
            <Wrench className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-2">GarageAssist</h1>
          <p className="text-[#A3A3A3] text-sm uppercase tracking-widest font-bold">Mechanic's Digital Interface</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-[#A3A3A3] uppercase tracking-widest border-l-2 border-[#D4AF37] pl-4 py-1">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Secure Authentication Required</span>
            </div>
            <p className="text-[#A3A3A3] text-sm leading-relaxed">
              Access AI diagnostics, vehicle health reports, active chat, and parts sourcing across your garage.
            </p>
          </div>

          <button 
            className="w-full h-14 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 text-sm tracking-widest uppercase"
            onClick={loginWithGoogle}
          >
            Authenticate via Google
          </button>

          <div className="pt-6 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border border-[#161616] bg-[#202020] flex items-center justify-center">
                <UserCog className="w-4 h-4 text-[#A3A3A3]" />
              </div>
              <div className="w-8 h-8 rounded-full border border-[#161616] bg-[#D4AF37]/20 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-[#D4AF37]" />
              </div>
            </div>
            <span className="text-[10px] text-[#A3A3A3] uppercase tracking-tighter">GarageAssist OS v2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
