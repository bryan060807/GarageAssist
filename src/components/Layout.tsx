import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, Home, Car, Wrench, Menu as MenuIcon, Camera, PackageSearch, FileText, Settings, Bot, MessageSquare, Users, Mic } from 'lucide-react';
import { useFirestoreSync } from '../hooks/useFirestoreSync';

export function Layout() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  useFirestoreSync();

  React.useEffect(() => {
    const handleVoiceNote = async (e: any) => {
      const text = e.detail?.text;
      if (text && profile) {
        try {
          await addDoc(collection(db, 'messages'), {
            ownerId: auth.currentUser?.uid || '',
            text: `[Voice Note] ${text}`,
            senderId: profile.uid,
            senderName: profile.displayName,
            senderRole: profile.role,
            createdAt: Date.now() // serverTimestamp doesn't work well locally with snapshot sometimes but that's fine
          });
          // Also toast it briefly
          const div = document.createElement('div');
          div.className = 'fixed bottom-4 right-4 bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold shadow-lg z-50 animate-bounce';
          div.textContent = 'Voice Note Logged!';
          document.body.appendChild(div);
          setTimeout(() => div.remove(), 3000);
        } catch (e) {
          console.error("Failed to save voice note", e);
        }
      }
    };
    window.addEventListener('voice-log-note', handleVoiceNote);
    return () => window.removeEventListener('voice-log-note', handleVoiceNote);
  }, [profile]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Vehicles', path: '/vehicles', icon: Car },
    { name: 'Diagnostics & OBD2', path: '/diagnostics', icon: Wrench },
    { name: 'Photo Inspections', path: '/inspections', icon: Camera },
    { name: 'Parts & Sourcing', path: '/parts', icon: PackageSearch },
    { name: 'Health Reports', path: '/reports', icon: FileText },
    { name: 'Live Chat & Voice', path: '/chat', icon: Users },
    { name: 'Ask AI (Text)', path: '/ask-ai', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden absolute top-0 left-0 w-full h-16 bg-[#161616] border-b border-[#2A2A2A] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[#D4AF37]" />
          <span className="font-display font-bold text-lg text-[#E5E5E5]">GarageAssist</span>
        </div>
        <button className="p-2 -mr-2" onClick={() => setMenuOpen(!menuOpen)}>
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#161616] border-r border-[#2A2A2A] z-30 transition-transform duration-300 lg:translate-x-0 flex flex-col ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-[#2A2A2A] lg:flex hidden">
          <Wrench className="w-6 h-6 text-[#D4AF37]" />
          <span className="font-display font-bold text-xl tracking-tight text-[#E5E5E5]">GarageAssist</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                      isActive 
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
                        : 'text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#2A2A2A]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#2A2A2A]">
          <div className="mb-4 px-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold">
              {profile?.displayName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E5E5E5] truncate">{profile?.displayName}</p>
              <p className="text-xs text-[#A3A3A3] truncate capitalize">{profile?.role || 'Mechanic'}</p>
            </div>
          </div>
          
          <NavLink 
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm mb-1 ${
                isActive ? 'bg-[#2A2A2A] text-[#E5E5E5]' : 'text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#2A2A2A]'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#2A2A2A]"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full pt-16 lg:pt-0 overflow-y-auto">
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
            onClick={() => setMenuOpen(false)}
          />
        )}
        <div className="flex-1 pb-8 lg:pb-0 relative flex flex-col justify-between">
            <Outlet />
        </div>
      </div>
    </div>
  );
}
