import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'mechanic' | 'manager' | 'apprentice';
  createdAt: number;
  greaseMode?: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  submodel?: string;
  engine?: string;
  vin?: string;
  ownerId: string;
  createdAt: number;
}

export interface Diagnostic {
  id: string;
  vehicleId: string;
  symptoms?: string;
  obd2Codes?: string;
  aiDiagnosis?: string;
  aiTools?: string;
  aiHardwareDebug?: string;
  aiRepairWorth?: string;
  ownerId: string;
  createdAt: number;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  photoUrl: string;
  type?: string;
  targetComponent?: string;
  notes?: string;
  aiAnalysis?: string;
  ownerId: string;
  createdAt: number;
}

export interface Part {
  id: string;
  name: string;
  sku?: string;
  vehicleId?: string;
  status: 'Needed' | 'Ordered' | 'In Stock';
  ownerId: string;
  createdAt: number;
}

export interface HealthReport {
  id: string;
  vehicleId: string;
  title: string;
  summary?: string;
  estimatedCost?: number;
  isSafeToDrive?: boolean;
  ownerId: string;
  createdAt: number;
}

interface AppState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  authLoading: boolean;
  greaseMode: boolean;
  setGreaseMode: (active: boolean) => void;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;

  vehicles: Vehicle[];
  diagnostics: Diagnostic[];
  inspections: Inspection[];
  parts: Part[];
  reports: HealthReport[];
  
  setVehicles: (vehicles: Vehicle[]) => void;
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
  setInspections: (inspections: Inspection[]) => void;
  setParts: (parts: Part[]) => void;
  setReports: (reports: HealthReport[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  authLoading: true,
  greaseMode: false,
  setGreaseMode: (active) => set({ greaseMode: active }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  vehicles: [],
  diagnostics: [],
  inspections: [],
  parts: [],
  reports: [],

  setVehicles: (vehicles) => set({ vehicles }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setInspections: (inspections) => set({ inspections }),
  setParts: (parts) => set({ parts }),
  setReports: (reports) => set({ reports }),
}));
