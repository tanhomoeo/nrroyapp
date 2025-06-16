
import { LOCAL_STORAGE_KEYS } from './constants';
import type { Patient, Visit, Prescription, PaymentSlip, ClinicSettings, PaymentMethod } from './types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from 'date-fns';


function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

// Patients
export const getPatients = (): Patient[] => getItem<Patient[]>(LOCAL_STORAGE_KEYS.PATIENTS, []);
export const savePatients = (patients: Patient[]): void => setItem<Patient[]>(LOCAL_STORAGE_KEYS.PATIENTS, patients);
export const addPatient = (patient: Patient): void => {
  const patients = getPatients();
  if (patients.some(p => p.phone === patient.phone && p.id !== patient.id)) {
    console.warn("Patient with this phone number already exists.");
  }
  savePatients([...patients, patient]);
};
export const updatePatient = (updatedPatient: Patient): void => {
  const patients = getPatients();
  savePatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
};
export const getPatientById = (id: string): Patient | undefined => getPatients().find(p => p.id === id);

// Visits
export const getVisits = (): Visit[] => getItem<Visit[]>(LOCAL_STORAGE_KEYS.VISITS, []);
export const saveVisits = (visits: Visit[]): void => setItem<Visit[]>(LOCAL_STORAGE_KEYS.VISITS, visits);
export const addVisit = (visit: Visit): void => saveVisits([...getVisits(), visit]);
export const getVisitsByPatientId = (patientId: string): Visit[] => getVisits().filter(v => v.patientId === patientId);
export const getVisitById = (visitId: string): Visit | undefined => getVisits().find(v => v.id === visitId);


// Prescriptions
export const getPrescriptions = (): Prescription[] => getItem<Prescription[]>(LOCAL_STORAGE_KEYS.PRESCRIPTIONS, []);
export const savePrescriptions = (prescriptions: Prescription[]): void => setItem<Prescription[]>(LOCAL_STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
export const addPrescription = (prescription: Prescription): void => savePrescriptions([...getPrescriptions(), prescription]);
export const updatePrescription = (updatedPrescription: Prescription): void => {
  const prescriptions = getPrescriptions();
  savePrescriptions(prescriptions.map(p => p.id === updatedPrescription.id ? updatedPrescription : p));
};
export const getPrescriptionById = (id: string): Prescription | undefined => getPrescriptions().find(p => p.id === id);
export const getPrescriptionsByPatientId = (patientId: string): Prescription[] => getPrescriptions().filter(p => p.patientId === patientId);

// Payment Slips
export const getPaymentSlips = (): PaymentSlip[] => getItem<PaymentSlip[]>(LOCAL_STORAGE_KEYS.PAYMENT_SLIPS, []);
export const savePaymentSlips = (slips: PaymentSlip[]): void => setItem<PaymentSlip[]>(LOCAL_STORAGE_KEYS.PAYMENT_SLIPS, slips);
export const addPaymentSlip = (slip: PaymentSlip): void => savePaymentSlips([...getPaymentSlips(), slip]);
export const getPaymentSlipsByPatientId = (patientId: string): PaymentSlip[] => getPaymentSlips().filter(s => s.patientId === patientId);

// Settings
export const getClinicSettings = (): ClinicSettings => {
  return getItem<ClinicSettings>(LOCAL_STORAGE_KEYS.SETTINGS, {
    nextDiaryNumber: 1,
    clinicName: 'ত্রি ফুল আরোগ্য নিকেতন',
    doctorName: '',
    clinicAddress: '',
    clinicContact: '',
    bmRegNo: '',
  });
};
export const saveClinicSettings = (settings: ClinicSettings): void => setItem<ClinicSettings>(LOCAL_STORAGE_KEYS.SETTINGS, settings);


// Date helpers
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

export const isThisMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth();
};

export const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'N/A';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric',
    ...options
  };
  try {
    return new Date(dateString).toLocaleDateString('bn-BD', defaultOptions); // Changed locale to bn-BD for consistent Bengali date
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' }).format(amount);
};

export const PAYMENT_METHOD_LABELS: Record<Exclude<PaymentMethod, ''>, string> = {
  cash: 'ক্যাশ',
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
  courier_medicine: 'কুরিয়ার ও ঔষধ',
  other: 'অন্যান্য',
};

export const getPaymentMethodLabel = (methodValue?: PaymentMethod): string => {
  if (!methodValue || methodValue === '') return 'N/A';
  return PAYMENT_METHOD_LABELS[methodValue as Exclude<PaymentMethod, ''>] || 'N/A';
};

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const validDate = isValid(date) ? date : new Date(); // Fallback to today if invalid
  const start = startOfWeek(validDate, { weekStartsOn: 0 }); // Assuming week starts on Sunday for bn-BD context
  const end = endOfWeek(validDate, { weekStartsOn: 0 });
  return { start, end };
};

export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const validDate = isValid(date) ? date : new Date(); // Fallback to today if invalid
  const start = startOfMonth(validDate);
  const end = endOfMonth(validDate);
  return { start, end };
};
