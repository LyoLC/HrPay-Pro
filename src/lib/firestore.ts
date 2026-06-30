import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore';
import { Employee, Contract_Doc, AttendanceRecord, ActivityTask, PayrollProcessed, CompanySettings } from '../types';

// Generic fetching logic
const getCollectionData = async <T>(collectionName: string): Promise<T[]> => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => doc.data() as T);
};

const subscribeToCollection = <T>(collectionName: string, callback: (data: T[]) => void) => {
  return onSnapshot(collection(db, collectionName), (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as T));
  });
};

const setCollectionData = async <T extends { id: string }>(collectionName: string, items: T[]) => {
  // First, get all current docs
  const currentDocs = await getDocs(collection(db, collectionName));
  const currentIds = currentDocs.docs.map(doc => doc.id);
  const newIds = items.map(item => item.id);

  // Delete docs that are no longer in the list
  const deletePromises = currentIds
    .filter(id => !newIds.includes(id))
    .map(id => deleteDoc(doc(db, collectionName, id)));
  
  await Promise.all(deletePromises);

  // Set the new docs
  const setPromises = items.map(item => {
    const docRef = doc(db, collectionName, item.id);
    return setDoc(docRef, item);
  });
  await Promise.all(setPromises);
};

// Functions to expose for collections
export const fetchEmployees = () => getCollectionData<Employee>('employees');
export const saveEmployees = (data: Employee[]) => setCollectionData<Employee>('employees', data);

export const fetchContracts = () => getCollectionData<Contract_Doc>('contracts');
export const saveContracts = (data: Contract_Doc[]) => setCollectionData<Contract_Doc>('contracts', data);

export const fetchAttendance = () => getCollectionData<AttendanceRecord>('attendance');
export const saveAttendance = (data: AttendanceRecord[]) => setCollectionData<AttendanceRecord>('attendance', data);

export const fetchTasks = () => getCollectionData<ActivityTask>('tasks');
export const saveTasks = (data: ActivityTask[]) => setCollectionData<ActivityTask>('tasks', data);

export const fetchPayroll = () => getCollectionData<PayrollProcessed>('payroll');
export const savePayroll = (data: PayrollProcessed[]) => setCollectionData<PayrollProcessed>('payroll', data);

import { CustomReportConfig } from '../types';
export const fetchReports = () => getCollectionData<CustomReportConfig>('reports');
export const saveReports = (data: CustomReportConfig[]) => setCollectionData<CustomReportConfig>('reports', data);

export const fetchSettings = async (): Promise<CompanySettings | null> => {
  const snapshot = await getDocs(collection(db, 'settings'));
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as CompanySettings;
};
export const saveSettings = async (settings: CompanySettings) => {
  const docRef = doc(db, 'settings', 'main');
  await setDoc(docRef, settings);
};

export const subscribeToTasksChanges = (cb: (changes: any[]) => void) => {
  return onSnapshot(collection(db, 'tasks'), (snapshot) => {
    cb(snapshot.docChanges());
  });
};
export const subscribeToContractsChanges = (cb: (changes: any[]) => void) => {
  return onSnapshot(collection(db, 'contracts'), (snapshot) => {
    cb(snapshot.docChanges());
  });
};
export const subscribeToPayrollChanges = (cb: (changes: any[]) => void) => {
  return onSnapshot(collection(db, 'payroll'), (snapshot) => {
    cb(snapshot.docChanges());
  });
};
