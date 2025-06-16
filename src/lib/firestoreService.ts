
// Remove 'use server' if all calls are from client-side 'use client' components.
// For now, assuming some server-side interaction might be intended or for broader compatibility.
// If strictly client-side, this directive is not needed here but in the calling components.

import { db } from './firebase'; // Ensure db is correctly initialized Firestore instance
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Patient, Visit, Prescription, PaymentSlip, ClinicSettings, PaymentMethod } from './types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from 'date-fns';


// Helper to convert Firestore Timestamps to ISO strings and vice-versa for consistency
const convertTimestampToISO = (data: any) => {
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
};

const convertISOToTimestamp = (data: any) => {
    for (const key in data) {
        // Check if it's a date field name and is a string (potential ISO string)
        if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) && typeof data[key] === 'string') {
            const dateObj = new Date(data[key]);
            if (isValid(dateObj)) {
                 data[key] = Timestamp.fromDate(dateObj);
            }
        }
    }
    return data;
};


// --- Patients ---
const patientsCollection = collection(db, 'patients');

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const snapshot = await getDocs(query(patientsCollection, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as Patient));
  } catch (error) {
    console.error("Error getting patients: ", error);
    return [];
  }
};

export const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const newPatient = {
      ...patientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(patientsCollection, convertISOToTimestamp(newPatient));
    return docRef.id;
  } catch (error) {
    console.error("Error adding patient: ", error);
    return null;
  }
};

export const updatePatient = async (patientId: string, patientData: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const patientRef = doc(db, 'patients', patientId);
    const updatedData = {
      ...patientData,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(patientRef, convertISOToTimestamp(updatedData));
    return true;
  } catch (error) {
    console.error("Error updating patient: ", error);
    return false;
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const patientRef = doc(db, 'patients', id);
    const docSnap = await getDoc(patientRef);
    if (docSnap.exists()) {
      return convertTimestampToISO({ ...docSnap.data(), id: docSnap.id } as Patient);
    }
    return null;
  } catch (error) {
    console.error("Error getting patient by ID: ", error);
    return null;
  }
};

// --- Visits ---
const visitsCollection = collection(db, 'visits');

export const getVisits = async (): Promise<Visit[]> => {
  try {
    const snapshot = await getDocs(query(visitsCollection, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as Visit));
  } catch (error) {
    console.error("Error getting visits: ", error);
    return [];
  }
};

export const addVisit = async (visitData: Omit<Visit, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const newVisit = {
      ...visitData,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(visitsCollection, convertISOToTimestamp(newVisit));
    return docRef.id;
  } catch (error) {
    console.error("Error adding visit: ", error);
    return null;
  }
};

export const getVisitsByPatientId = async (patientId: string): Promise<Visit[]> => {
  try {
    const q = query(visitsCollection, where('patientId', '==', patientId), orderBy('visitDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as Visit));
  } catch (error) {
    console.error("Error getting visits by patient ID: ", error);
    return [];
  }
};

export const getVisitById = async (id: string): Promise<Visit | null> => {
  try {
    const visitRef = doc(db, 'visits', id);
    const docSnap = await getDoc(visitRef);
    if (docSnap.exists()) {
      return convertTimestampToISO({ ...docSnap.data(), id: docSnap.id } as Visit);
    }
    return null;
  } catch (error) {
    console.error("Error getting visit by ID: ", error);
    return null;
  }
};


// --- Prescriptions ---
const prescriptionsCollection = collection(db, 'prescriptions');

export const getPrescriptions = async (): Promise<Prescription[]> => {
  try {
    const snapshot = await getDocs(query(prescriptionsCollection, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as Prescription));
  } catch (error) {
    console.error("Error getting prescriptions: ", error);
    return [];
  }
};

export const addPrescription = async (prescriptionData: Omit<Prescription, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const newPrescription = {
      ...prescriptionData,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(prescriptionsCollection, convertISOToTimestamp(newPrescription));
    return docRef.id;
  } catch (error) {
    console.error("Error adding prescription: ", error);
    return null;
  }
};

export const updatePrescription = async (prescriptionId: string, prescriptionData: Partial<Omit<Prescription, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const presRef = doc(db, 'prescriptions', prescriptionId);
    const updatedData = {
        ...prescriptionData,
        // Ensure date fields are Timestamps if they exist in prescriptionData
        ...(prescriptionData.date && { date: Timestamp.fromDate(new Date(prescriptionData.date)) }),
    };
    await updateDoc(presRef, convertISOToTimestamp(updatedData));
    return true;
  } catch (error) {
    console.error("Error updating prescription: ", error);
    return false;
  }
};


export const getPrescriptionById = async (id: string): Promise<Prescription | null> => {
  try {
    const presRef = doc(db, 'prescriptions', id);
    const docSnap = await getDoc(presRef);
    if (docSnap.exists()) {
      return convertTimestampToISO({ ...docSnap.data(), id: docSnap.id } as Prescription);
    }
    return null;
  } catch (error) {
    console.error("Error getting prescription by ID: ", error);
    return null;
  }
};

export const getPrescriptionsByPatientId = async (patientId: string): Promise<Prescription[]> => {
  try {
    const q = query(prescriptionsCollection, where('patientId', '==', patientId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as Prescription));
  } catch (error) {
    console.error("Error getting prescriptions by patient ID: ", error);
    return [];
  }
};


// --- Payment Slips ---
const paymentSlipsCollection = collection(db, 'paymentSlips');

export const getPaymentSlips = async (): Promise<PaymentSlip[]> => {
  try {
    const snapshot = await getDocs(query(paymentSlipsCollection, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as PaymentSlip));
  } catch (error) {
    console.error("Error getting payment slips: ", error);
    return [];
  }
};

export const addPaymentSlip = async (slipData: Omit<PaymentSlip, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
     const newSlip = {
      ...slipData,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(paymentSlipsCollection, convertISOToTimestamp(newSlip));
    return docRef.id;
  } catch (error) {
    console.error("Error adding payment slip: ", error);
    return null;
  }
};

export const getPaymentSlipsByPatientId = async (patientId: string): Promise<PaymentSlip[]> => {
  try {
    const q = query(paymentSlipsCollection, where('patientId', '==', patientId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestampToISO({ ...doc.data(), id: doc.id } as PaymentSlip));
  } catch (error) {
    console.error("Error getting payment slips by patient ID: ", error);
    return [];
  }
};

// --- Settings ---
const settingsDocRef = doc(db, 'settings', 'clinic'); // Single document for clinic settings

export const getClinicSettings = async (): Promise<ClinicSettings> => {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as ClinicSettings;
    }
    // Default settings if not found
    return {
      nextDiaryNumber: 1,
      clinicName: 'ত্রিফুল আরোগ্য নিকেতন',
      doctorName: '',
      clinicAddress: '',
      clinicContact: '',
      bmRegNo: '',
    };
  } catch (error) {
    console.error("Error getting clinic settings: ", error);
    return { // Return default on error
      nextDiaryNumber: 1,
      clinicName: 'ত্রিফুল আরোগ্য নিকেতন',
      doctorName: '',
      clinicAddress: '',
      clinicContact: '',
      bmRegNo: '',
    };
  }
};

export const saveClinicSettings = async (settings: ClinicSettings): Promise<boolean> => {
  try {
    await setDoc(settingsDocRef, settings);
    return true;
  } catch (error) {
    console.error("Error saving clinic settings: ", error);
    return false;
  }
};


// --- Date helpers (can remain or be moved if preferred) ---
export const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (!isValid(date)) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
};

export const isThisMonth = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (!isValid(date)) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth();
};

export const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid Date';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric',
    ...options
  };
  try {
    return date.toLocaleDateString('bn-BD', defaultOptions);
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
  const validDate = isValid(date) ? date : new Date();
  const start = startOfWeek(validDate, { weekStartsOn: 0 });
  const end = endOfWeek(validDate, { weekStartsOn: 0 });
  return { start, end };
};

export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const validDate = isValid(date) ? date : new Date();
  const start = startOfMonth(validDate);
  const end = endOfMonth(validDate);
  return { start, end };
};

// Function to replace localStorage data with Firestore - THIS IS A DESTRUCTIVE OPERATION
// Only call this if you are sure you want to migrate from localStorage to Firestore for the first time.
// And ensure you have a backup of localStorage if needed.
export const migrateLocalStorageToFirestore = async () => {
  if (typeof window === 'undefined') {
    console.error("migrateLocalStorageToFirestore can only be called from the client-side.");
    alert("Migration can only be initiated from the client-side.");
    return;
  }
  console.warn("Starting migration from localStorage to Firestore. This is a destructive operation for Firestore if data with same IDs exist and might overwrite or duplicate if not handled carefully. This script assumes fresh Firestore collections.");

  const batch = writeBatch(db);

  try {
    // Migrate Patients
    const localPatientsRaw = localStorage.getItem('triful_arogya_niketan_patients');
    if (localPatientsRaw) {
      const localPatients: Patient[] = JSON.parse(localPatientsRaw);
      console.log(`Found ${localPatients.length} patients in localStorage.`);
      for (const patient of localPatients) {
        const { id, ...patientData } = patient;
        const patientRef = doc(db, 'patients', id); // Use existing ID for migration
        const firestorePatientData = convertISOToTimestamp({
          ...patientData,
          createdAt: patient.createdAt ? Timestamp.fromDate(new Date(patient.createdAt)) : Timestamp.now(),
          updatedAt: patient.updatedAt ? Timestamp.fromDate(new Date(patient.updatedAt)) : Timestamp.now(),
        });
        batch.set(patientRef, firestorePatientData);
      }
      console.log("Patients queued for Firestore batch write.");
    }


    // Migrate Visits
    const localVisitsRaw = localStorage.getItem('triful_arogya_niketan_visits');
    if (localVisitsRaw) {
        const localVisits: Visit[] = JSON.parse(localVisitsRaw);
        console.log(`Found ${localVisits.length} visits in localStorage.`);
        for (const visit of localVisits) {
            const { id, ...visitData } = visit;
            const visitRef = doc(db, 'visits', id);
            const firestoreVisitData = convertISOToTimestamp({
                ...visitData,
                visitDate: visit.visitDate ? Timestamp.fromDate(new Date(visit.visitDate)) : Timestamp.now(),
                createdAt: visit.createdAt ? Timestamp.fromDate(new Date(visit.createdAt)) : Timestamp.now(),
            });
            batch.set(visitRef, firestoreVisitData);
        }
        console.log("Visits queued for Firestore batch write.");
    }

    // Migrate Prescriptions
    const localPrescriptionsRaw = localStorage.getItem('triful_arogya_niketan_prescriptions');
    if (localPrescriptionsRaw) {
        const localPrescriptions: Prescription[] = JSON.parse(localPrescriptionsRaw);
        console.log(`Found ${localPrescriptions.length} prescriptions in localStorage.`);
        for (const prescription of localPrescriptions) {
            const { id, ...prescriptionData } = prescription;
            const presRef = doc(db, 'prescriptions', id);
             const firestorePrescriptionData = convertISOToTimestamp({
                ...prescriptionData,
                date: prescription.date ? Timestamp.fromDate(new Date(prescription.date)) : Timestamp.now(),
                createdAt: prescription.createdAt ? Timestamp.fromDate(new Date(prescription.createdAt)) : Timestamp.now(),
            });
            batch.set(presRef, firestorePrescriptionData);
        }
        console.log("Prescriptions queued for Firestore batch write.");
    }

    // Migrate Payment Slips
    const localPaymentSlipsRaw = localStorage.getItem('triful_arogya_niketan_payment_slips');
    if (localPaymentSlipsRaw) {
        const localPaymentSlips: PaymentSlip[] = JSON.parse(localPaymentSlipsRaw);
        console.log(`Found ${localPaymentSlips.length} payment slips in localStorage.`);
        for (const slip of localPaymentSlips) {
            const { id, ...slipData } = slip;
            const slipRef = doc(db, 'paymentSlips', id);
            const firestoreSlipData = convertISOToTimestamp({
                ...slipData,
                date: slip.date ? Timestamp.fromDate(new Date(slip.date)) : Timestamp.now(),
                createdAt: slip.createdAt ? Timestamp.fromDate(new Date(slip.createdAt)) : Timestamp.now(),
            });
            batch.set(slipRef, firestoreSlipData);
        }
        console.log("Payment Slips queued for Firestore batch write.");
    }

    // Migrate Clinic Settings
    const localSettingsRaw = localStorage.getItem('triful_arogya_niketan_settings');
    if (localSettingsRaw) {
        const localSettings: ClinicSettings = JSON.parse(localSettingsRaw);
        console.log("Found clinic settings in localStorage.");
        const settingsRef = doc(db, 'settings', 'clinic');
        batch.set(settingsRef, localSettings); // No timestamp conversion needed as per current type
        console.log("Clinic Settings queued for Firestore batch write.");
    }

    await batch.commit();
    console.log("Firestore migration batch committed successfully.");
    alert("Migration from localStorage to Firestore completed. Please verify data in Firebase Console. It's recommended to clear localStorage afterwards if migration is successful and no longer needed.");

  } catch (error) {
    console.error("Error during migration to Firestore: ", error);
    alert(`Migration failed: ${error}. Check console for details.`);
  }
};

// To delete all data from localStorage (USE WITH EXTREME CAUTION!)
export const clearAllLocalStorageData = () => {
      if (typeof window !== 'undefined') {
          if (confirm("WARNING: This will delete ALL application data from your browser's localStorage. This cannot be undone. Are you sure?")) {
              localStorage.removeItem('triful_arogya_niketan_patients');
              localStorage.removeItem('triful_arogya_niketan_visits');
              localStorage.removeItem('triful_arogya_niketan_prescriptions');
              localStorage.removeItem('triful_arogya_niketan_payment_slips');
              localStorage.removeItem('triful_arogya_niketan_settings');
              alert("All application data has been cleared from localStorage.");
              window.location.reload();
          }
      }
};
