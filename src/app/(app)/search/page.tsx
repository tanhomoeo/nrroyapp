
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPatients } from '@/lib/firestoreService';
import type { Patient } from '@/lib/types';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { 
  UserCircle, 
  PlusCircle, 
  CreditCard, 
  History, 
  Edit3, 
  Loader2, 
  SearchIcon as SearchIconLucide,
  X,
  ClipboardList, 
  BriefcaseMedical,
  CalendarPlus 
} from 'lucide-react';
import { PatientDetailsModal } from '@/components/patient/PatientDetailsModal'; 
import { CreatePaymentSlipModal } from '@/components/slip/CreatePaymentSlipModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';

// Helper for appending final transcript
const appendFinalTranscript = (currentValue: string | undefined, transcript: string): string => {
  let textToSet = currentValue || "";
  if (textToSet.length > 0 && !textToSet.endsWith(" ") && !textToSet.endsWith("\n")) {
     textToSet += " ";
  }
  textToSet += transcript + " ";
  return textToSet;
};

export default function SearchPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'history' | 'addVisitAndPayment'>('info');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      const patientsData = await getPatients();
      setAllPatients(patientsData);
      setIsLoading(false);

      const querySearchTerm = searchParams.get('q');
      const queryPhone = searchParams.get('phone');

      if (querySearchTerm) {
        setSearchTerm(querySearchTerm);
      } else if (queryPhone) {
        setSearchTerm(queryPhone);
      } else {
        setFilteredPatients([]); 
      }
    };
    fetchPatients();
  }, [searchParams]); 

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients([]); 
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = allPatients.filter(patient => {
      const diaryNumString = (patient.diaryNumber || '').toString().toLowerCase();
      return (
        patient.name.toLowerCase().includes(lowerSearchTerm) ||
        patient.id.toLowerCase().includes(lowerSearchTerm) ||
        patient.phone.toLowerCase().includes(lowerSearchTerm) || 
        diaryNumString.includes(lowerSearchTerm) ||
        (patient.villageUnion || '').toLowerCase().includes(lowerSearchTerm) ||
        (patient.district || '').toLowerCase().includes(lowerSearchTerm) ||
        (patient.guardianName || '').toLowerCase().includes(lowerSearchTerm)
      );
    });
    setFilteredPatients(results);
  }, [searchTerm, allPatients]); 

  const handleOpenDetailsModal = (patient: Patient, tab: 'info' | 'history' | 'addVisitAndPayment') => {
    setSelectedPatientForModal(patient);
    setActiveModalTab(tab);
    setIsDetailsModalOpen(true);
  };
  
  const handleOpenPaymentModal = (patient: Patient) => {
    setSelectedPatientForModal(patient);
    setIsPaymentModalOpen(true);
  };

  const handleOpenMedicineInstructions = (patient: Patient) => {
    router.push(`${ROUTES.MEDICINE_INSTRUCTIONS}?patientId=${patient.id}&name=${encodeURIComponent(patient.name)}`);
  };
  
  const handlePatientUpdatedInModal = (updatedPatient: Patient) => {
    setAllPatients(prevAllPatients => 
      prevAllPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const results = allPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p).filter(patient => {
            const diaryNumString = (patient.diaryNumber || '').toString().toLowerCase();
            return (
                patient.name.toLowerCase().includes(lowerSearchTerm) ||
                patient.id.toLowerCase().includes(lowerSearchTerm) ||
                patient.phone.toLowerCase().includes(lowerSearchTerm) || 
                diaryNumString.includes(lowerSearchTerm) ||
                (patient.villageUnion || '').toLowerCase().includes(lowerSearchTerm) ||
                (patient.district || '').toLowerCase().includes(lowerSearchTerm) ||
                (patient.guardianName || '').toLowerCase().includes(lowerSearchTerm)
            );
        });
        setFilteredPatients(results);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="রোগী অনুসন্ধান"
        description="রোগীর রেকর্ড খুঁজুন"
        actions={<SearchIconLucide className="h-8 w-8 text-primary" />}
      >
        <p className="text-sm text-muted-foreground mt-1">
          নাম, আইডি, ফোন, ডায়েরি নম্বর, ঠিকানা বা অভিভাবকের নাম দ্বারা বিদ্যমান রোগীর রেকর্ড খুঁজতে নীচের অনুসন্ধান বার ব্যবহার করুন।
        </p>
      </PageHeaderCard>

      <div className="flex h-11 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary">
        <div className="pl-3 pr-2 flex items-center pointer-events-none h-full">
          <SearchIconLucide className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="রোগীর নাম, আইডি, ফোন, ডায়েরি নং, ঠিকানা দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-2 text-base placeholder-muted-foreground"
          aria-label="Search term"
          id="patientSearchPageInput"
        />
        <MicrophoneButton
          onTranscript={(t) => setSearchTerm(prev => prev + t)}
          onFinalTranscript={(t) => setSearchTerm(prev => appendFinalTranscript(prev, t))}
          targetFieldDescription="রোগী অনুসন্ধান"
          fieldKey="patientSearchPageInput"
          isListeningGlobal={isListeningGlobal}
          setIsListeningGlobal={setIsListeningGlobal}
          currentListeningField={currentListeningField}
          setCurrentListeningField={setCurrentListeningField}
        />
        {searchTerm && (
          <Button variant="ghost" size="icon" className="h-full w-10 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm('')}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      ) : searchTerm.trim() && filteredPatients.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          "{searchTerm}" এর জন্য কোন রোগী খুঁজে পাওয়া যায়নি।
        </div>
      ) : !searchTerm.trim() ? (
         <div className="text-center py-10 text-muted-foreground">
          রোগী খুঁজতে উপরে অনুসন্ধান করুন।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${patient.name.charAt(0)}`} alt={patient.name} data-ai-hint="profile person" />
                    <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="font-headline text-xl text-primary">{patient.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      আইডি: {patient.id} | ডায়েরি নং: {patient.diaryNumber?.toLocaleString('bn-BD') || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold text-md mb-3 text-foreground">রোগীর কার্যক্রম</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Button variant="outline" onClick={() => handleOpenDetailsModal(patient, 'addVisitAndPayment')} className="justify-start">
                    <CalendarPlus className="mr-2 h-5 w-5 text-green-600" /> ভিজিট ও পেমেন্ট যুক্ত করুন
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenPaymentModal(patient)} className="justify-start">
                    <CreditCard className="mr-2 h-5 w-5 text-blue-600" /> পেমেন্ট স্লিপ তৈরি করুন
                  </Button>
                   <Button variant="outline" onClick={() => handleOpenMedicineInstructions(patient)} className="justify-start">
                    <ClipboardList className="mr-2 h-5 w-5 text-indigo-600" /> ঔষধের নিয়মাবলী
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenDetailsModal(patient, 'history')} className="justify-start sm:col-span-1 md:col-span-1">
                    <History className="mr-2 h-5 w-5 text-purple-600" /> পূর্ববর্তী ভিজিটের বিবরণ
                  </Button>
                  <Button variant="outline" onClick={() => handleOpenDetailsModal(patient, 'info')} className="justify-start sm:col-span-2 md:col-span-2">
                    <Edit3 className="mr-2 h-5 w-5 text-orange-600" /> রোগীর তথ্য সম্পাদনা করুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPatientForModal && (
        <PatientDetailsModal
          patient={selectedPatientForModal}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          defaultTab={activeModalTab}
          onPatientUpdate={handlePatientUpdatedInModal}
        />
      )}
      {selectedPatientForModal && (
        <CreatePaymentSlipModal
          patient={selectedPatientForModal}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSlipCreated={() => { /* Optionally refresh data if needed */ }}
        />
      )}
    </div>
  );
}
