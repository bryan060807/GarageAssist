import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { Settings as SettingsIcon, Crown, Shield, Users } from 'lucide-react';

export function Settings() {
  const { user } = useAppStore();
  const [roster, setRoster] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      // For now just load all users
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRoster(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
       console.error("Failed to update role:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-8 sm:space-y-12">
      <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
            Settings & Roster
          </h1>
          <p className="text-[#A3A3A3] text-sm sm:text-base mt-2">Manage settings and mechanic roles.</p>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-[#E5E5E5] mb-2">Voice & Interaction Settings</h2>
        <p className="text-sm text-[#A3A3A3] mb-6">Configure how the Live AI Assistant interacts with you.</p>

        <div className="flex items-center justify-between p-4 border border-[#2A2A2A] bg-[#0A0A0A] rounded-lg">
          <div>
            <h3 className="text-[#E5E5E5] font-bold">Hands-Free "Grease Mode"</h3>
            <p className="text-xs text-[#A3A3A3] mt-1 max-w-sm">Filters ambient shop noises and listens for strict voice commands (e.g. "Scroll Down", "Log Note") to navigate hands-free without getting grease on the device.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={useAppStore(s => s.greaseMode)} 
              onChange={(e) => useAppStore.getState().setGreaseMode(e.target.checked)} 
            />
            <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#A3A3A3] peer-checked:after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
          </label>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-[#E5E5E5]">Company Roster</h2>
          </div>
          
            <div className="space-y-4">
              {roster.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-[#2A2A2A] bg-[#0A0A0A] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center border border-[#2A2A2A]">
                      {member.role === 'manager' ? <Crown className="w-5 h-5 text-[#D4AF37]" /> : <Shield className="w-5 h-5 text-[#707070]" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.displayName || member.email}</p>
                      <p className="text-[10px] uppercase font-mono text-[#D4AF37]">{member.role || 'mechanic'}</p>
                    </div>
                  </div>
                  
                  {member.id !== user?.uid && (
                    <select 
                      className="h-8 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-2 text-xs uppercase font-bold text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
                      value={member.role || 'mechanic'}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                    >
                      <option value="manager">Manager</option>
                      <option value="mechanic">Mechanic</option>
                      <option value="apprentice">Apprentice</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
      </div>
    </div>
  );
}
