
export interface Patient {
  id: string; 
  diaryNumber?: number; 
  name: string;
  phone: string; 
  district?: string;
  createdAt: string; 
  updatedAt: string; 

  registrationDate: string; 
  age?: string;
  gender?: 'male' | 'female' | 'other' | '';
  occupation?: string;
  guardianRelation?: 'father' | 'husband' | '';
  guardianName?: string;
  thanaUpazila?: string;
  villageUnion?: string;
}

export interface Visit {
  id: string; 
  patientId: string;
  visitDate: string; 
  symptoms?: string;
  diagnosis?: string; 
  notes?: string;
  prescriptionId?: string; 
  paymentSlipId?: string;
  createdAt: string; 
  medicineDeliveryMethod?: 'direct' | 'courier' | ''; 
}

export type PrescriptionItem = {
  medicineName: string;
  dosage: string; 
  frequency: string; 
  duration: string; 
  notes?: string;
};

export interface Prescription {
  id: string; 
  patientId: string;
  visitId: string; 
  doctorName?: string; 
  date: string; 
  prescriptionType: 'adult' | 'child';
  items: PrescriptionItem[];
  followUpDays?: number;
  advice?: string;
  serialNumber?: string; 
  createdAt: string;
  diagnosis?: string; 
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'courier_medicine' | 'other' | '';

export interface PaymentSlip {
  id: string; 
  patientId: string;
  visitId?: string; 
  slipNumber: string; 
  date: string; 
  amount: number;
  purpose: string; 
  receivedBy?: string;
  paymentMethod?: PaymentMethod; 
  createdAt: string;
}

export interface ClinicStats {
  totalPatients: number;
  todayPatientCount: number;
  monthlyPatientCount: number;
  todayRevenue: number;
  monthlyIncome?: number; 
  dailyActivePatients?: number;
  dailyOtherRegistered?: number;
  monthlyNewPatients?: number;
  monthlyTotalRegistered?: number;
}


export interface DiagnosisSuggestion {
  id: string;
  suggestion: string;
  confidence?: number; 
}


export interface ClinicSettings {
  nextDiaryNumber: number; 
  clinicName?: string;
  doctorName?: string;
  clinicAddress?: string;
  clinicContact?: string;
  bmRegNo?: string; 
}

export interface EnrichedVisit extends Visit {
  prescription?: Prescription | null;
}

export interface ComplaintSummaryInput {
  complaintText: string;
}
export interface ComplaintSummaryOutput {
  summary: string;
}


export interface MedicineInstruction {
    id: string; 
    patientName: string;
    patientActualId?: string; 
    visitId?: string;         
    instructionDate: string; 
    drops: string;
    interval: string; 
    intakeTime: string; 
    followUpDays: string; 
    generatedInstructionText: string;
    serialNumber: string; 
    createdAt: string; 
}
