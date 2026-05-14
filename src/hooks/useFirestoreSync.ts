import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { useAppStore, Vehicle, Diagnostic, Inspection, Part, HealthReport } from '../store/useAppStore';

export function useFirestoreSync() {
  const { user, setVehicles, setDiagnostics, setInspections, setParts, setReports } = useAppStore();

  useEffect(() => {
    if (!user) return;
    const path = 'vehicles';
    const q = query(collection(db, path), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[];
      setVehicles(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, [user, setVehicles]);

  useEffect(() => {
    if (!user) return;
    const path = 'diagnostics';
    const q = query(collection(db, path), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Diagnostic[];
      setDiagnostics(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, [user, setDiagnostics]);

  useEffect(() => {
    if (!user) return;
    const path = 'inspections';
    const q = query(collection(db, path), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Inspection[];
      setInspections(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, [user, setInspections]);

  useEffect(() => {
    if (!user) return;
    const path = 'parts';
    const q = query(collection(db, path), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Part[];
      setParts(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, [user, setParts]);

  useEffect(() => {
    if (!user) return;
    const path = 'health_reports';
    const q = query(collection(db, path), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthReport[];
      setReports(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, [user, setReports]);
}
