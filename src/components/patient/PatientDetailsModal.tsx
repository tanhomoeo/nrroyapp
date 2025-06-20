
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Patient, Visit, Prescription, EnrichedVisit, PaymentMethod, PaymentSlip } from '@/lib/types';
import { getVisitsByPatientId, addVisit, formatDate, updatePatient, getPrescriptionsByPatientId, addPaymentSlip } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Save, BriefcaseMedical, Loader2, CalendarDays, FileText, PackageCheck, Truck, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { isValid, format as formatDateFns } from 'date-fns';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';

interface PatientDetailsModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'info' | 'history' | 'addVisitAndPayment';
  onPatientUpdate: (updatedPatient: Patient) => void;
}

const patientInfoSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^(\+8801|01)\d{9}$/, "Valid BD phone number required"),
  villageUnion: z.string().optional(),
  district: z.string().optional(),
  diaryNumber: z.string().optional(),
  age: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  occupation: z.string().optional(),
  guardianRelation: z.enum(['father', 'husband', '']).optional(),
  guardianName: z.string().optional(),
  thanaUpazila: z.string().optional(),
  registrationDate: z.string().refine(val => val === '' || isValid(new Date(val)), { message: "নিবন্ধনের তারিখ আবশ্যক অথবা খালি রাখুন।" }),
});
type PatientInfoValues = z.infer<typeof patientInfoSchema>;

const paymentMethodOptions: { value: Exclude<PaymentMethod, ''>; label: string }[] = [
  { value: 'cash', label: 'ক্যাশ' },
  { value: 'bkash', label: 'বিকাশ' },
  { value: 'nagad', label: 'নগদ' },
  { value: 'rocket', label: 'রকেট' },
  { value: 'other', label: 'অন্যান্য' },
];

const medicineDeliveryMethodOptions: { value: 'direct' | 'courier'; label: string }[] = [
    { value: 'direct', label: 'সরাসরি প্রদান' },
    { value: 'courier', label: 'কুরিয়ারের মাধ্যমে প্রেরণ' },
];

const visitAndPaymentFormSchema = z.object({
  visitDate: z.string().refine((date) => date === '' || !isNaN(Date.parse(date)), { message: "অবৈধ তারিখ" }),
  symptoms: z.string().min(3, "উপসর্গ/উদ্দেশ্য আবশ্যক"),
  medicineDeliveryMethod: z.enum(['direct', 'courier'], { required_error: "ঔষধ প্রদানের মাধ্যম নির্বাচন করুন।" }),
  amount: z.coerce.number().nonnegative("টাকার পরিমাণ অবশ্যই একটি অ-ঋণাত্মক সংখ্যা হতে হবে।"),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'other', '']).optional(),
  receivedBy: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.amount > 0 && !data.paymentMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "পেমেন্ট মাধ্যম আবশ্যক যখন টাকার পরিমাণ ০ এর বেশি।",
      path: ["paymentMethod"],
    });
  }
});
type VisitAndPaymentFormValues = z.infer<typeof visitAndPaymentFormSchema>;

export function PatientDetailsModal({ patient, isOpen, onClose, defaultTab = 'info', onPatientUpdate }: PatientDetailsModalProps) {
  const [visits, setVisits] = useState<EnrichedVisit[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const { toast } = useToast();
  const router = useRouter();

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  const patientInfoForm = useForm<PatientInfoValues>({
    resolver: zodResolver(patientInfoSchema),
    defaultValues: {
        name: '',
        phone: '',
        villageUnion: '',
        district: '',
        diaryNumber: '',
        age: '',
        gender: '',
        occupation: '',
        guardianRelation: '',
        guardianName: '',
        thanaUpazila: '',
        registrationDate: '', 
    },
  });

  const visitAndPaymentForm = useForm<VisitAndPaymentFormValues>({
    resolver: zodResolver(visitAndPaymentFormSchema),
    defaultValues: {
      visitDate: formatDateFns(new Date(), 'yyyy-MM-dd'),
      symptoms: '',
      medicineDeliveryMethod: 'direct',
      amount: 0,
      paymentMethod: 'cash',
      receivedBy: '',
    },
  });
  
  const fetchVisitsAndPrescriptions = useCallback(async (patientId: string) => {
      setIsLoadingVisits(true);
      try {
        const [patientVisits, patientPrescriptions] = await Promise.all([
            getVisitsByPatientId(patientId),
            getPrescriptionsByPatientId(patientId)
        ]);

        const enrichedVisitsData = patientVisits.map(v => {
          const visitPrescriptions = patientPrescriptions
            .filter(p => p.visitId === v.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return { ...v, prescription: visitPrescriptions.length > 0 ? visitPrescriptions[0] : null };
        }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

        setVisits(enrichedVisitsData);
      } catch (error) {
        console.error("Error fetching visits/prescriptions:", error);
        toast({ title: "ত্রুটি", description: "ভিজিটের তথ্য আনতে সমস্যা হয়েছে।", variant: "destructive" });
      } finally {
        setIsLoadingVisits(false);
      }
  }, [toast]);


  useEffect(() => {
    if (isOpen && patient) {
      setCurrentTab(defaultTab);
      // Reset forms and set default values when modal opens
      patientInfoForm.reset({
        ...patient,
        diaryNumber: patient.diaryNumber || '',
        villageUnion: patient.villageUnion || '',
        age: patient.age || '',
        gender: patient.gender || '',
        occupation: patient.occupation || '',
        guardianRelation: patient.guardianRelation || '',
        guardianName: patient.guardianName || '',
        thanaUpazila: patient.thanaUpazila || '',
        registrationDate: patient.registrationDate ? formatDateFns(new Date(patient.registrationDate), 'yyyy-MM-dd') : formatDateFns(new Date(), 'yyyy-MM-dd'),
      });
      visitAndPaymentForm.reset({
        visitDate: formatDateFns(new Date(), 'yyyy-MM-dd'),
        symptoms: '',
        medicineDeliveryMethod: 'direct',
        amount: 0,
        paymentMethod: 'cash',
        receivedBy: '',
      });
      setIsEditingInfo(false);

      if (defaultTab === 'history') {
        fetchVisitsAndPrescriptions(patient.id);
      }
    }
  }, [isOpen, patient, defaultTab, patientInfoForm, visitAndPaymentForm, fetchVisitsAndPrescriptions]);


  const handlePatientInfoSubmit: SubmitHandler<PatientInfoValues> = async (data) => {
    try {
      const updatedPatientData: Partial<Omit<Patient, 'id' | 'createdAt'>> = {
        name: data.name,
        phone: data.phone,
        villageUnion: data.villageUnion,
        district: data.district,
        diaryNumber: data.diaryNumber || undefined,
        age: data.age,
        gender: data.gender as Patient['gender'],
        occupation: data.occupation,
        guardianRelation: data.guardianRelation as Patient['guardianRelation'],
        guardianName: data.guardianName,
        thanaUpazila: data.thanaUpazila,
        registrationDate: data.registrationDate ? new Date(data.registrationDate).toISOString() : new Date().toISOString(),
      };

      const success = await updatePatient(patient.id, updatedPatientData);
      if (success) {
        onPatientUpdate({ ...patient, ...updatedPatientData, updatedAt: new Date().toISOString() });
        toast({ title: "রোগীর তথ্য আপডেট হয়েছে", description: `${data.name}-এর বিবরণ সংরক্ষণ করা হয়েছে।` });
        setIsEditingInfo(false);
         window.dispatchEvent(new CustomEvent('firestoreDataChange'));
      } else {
        throw new Error("Firestore update failed");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({ title: "ত্রুটি", description: "রোগীর তথ্য আপডেট করতে ব্যর্থ হয়েছে।", variant: "destructive" });
    }
  };

  const handleAddVisitAndPaymentSubmit: SubmitHandler<VisitAndPaymentFormValues> = async (data) => {
    const visitDateToUse = data.visitDate ? new Date(data.visitDate).toISOString() : new Date().toISOString();
    const newVisitData: Omit<Visit, 'id' | 'createdAt'> = {
        patientId: patient.id,
        visitDate: visitDateToUse,
        symptoms: data.symptoms,
        medicineDeliveryMethod: data.medicineDeliveryMethod,
    };
    const visitId = await addVisit(newVisitData);

    if (!visitId) {
        toast({ title: 'ত্রুটি', description: 'ভিজিট যুক্ত করতে সমস্যা হয়েছে।', variant: 'destructive' });
        return;
    }
    toast({ title: 'ভিজিট লগ হয়েছে', description: `রোগী: ${patient.name} এর জন্য ভিজিট যুক্ত করা হয়েছে।` });

    if (data.amount > 0 && data.paymentMethod) {
      const newSlipData: Omit<PaymentSlip, 'id' | 'createdAt'> = {
        patientId: patient.id,
        visitId: visitId,
        slipNumber: `SLIP-${Date.now().toString().slice(-6)}`,
        date: visitDateToUse,
        amount: data.amount,
        purpose: data.symptoms,
        paymentMethod: data.paymentMethod as Exclude<PaymentMethod, ''>,
        receivedBy: data.receivedBy,
      };
      const slipId = await addPaymentSlip(newSlipData);
       if (slipId) {
            toast({
                title: 'পেমেন্ট স্লিপ তৈরি হয়েছে',
                description: `স্লিপ ${newSlipData.slipNumber} ভিজিট ${visitId} এর সাথে যুক্ত করা হয়েছে।`,
            });
        } else {
            toast({ title: 'ত্রুটি', description: 'পেমেন্ট স্লিপ তৈরি করতে সমস্যা হয়েছে।', variant: 'warning' });
        }
    }

    visitAndPaymentForm.reset({
      visitDate: formatDateFns(new Date(), 'yyyy-MM-dd'),
      symptoms: '',
      medicineDeliveryMethod: 'direct',
      amount: 0,
      paymentMethod: 'cash',
      receivedBy: '',
    });

    await fetchVisitsAndPrescriptions(patient.id);
    window.dispatchEvent(new CustomEvent('firestoreDataChange'));
    setCurrentTab('history');
    router.push(`${ROUTES.PRESCRIPTION}/${patient.id}?visitId=${visitId}`);
  };

  const getModalTitle = () => {
    if (currentTab === 'history') return `রোগী ${patient.name} এর ভিজিটের বিবরণ`;
    if (currentTab === 'addVisitAndPayment') return `নতুন ভিজিট ও পেমেন্ট: ${patient.name}`;
    return `রোগীর তথ্য: ${patient.name}`;
  };

  const getModalDescription = () => {
    if (currentTab === 'history') return "রোগীর চিকিৎসার ইতিহাস নিচে দেওয়া হলো।";
    if (currentTab === 'addVisitAndPayment') return "নতুন ভিজিটের তথ্য, পেমেন্ট, এবং ঔষধ প্রদানের মাধ্যম যুক্ত করুন।";
    return isEditingInfo ? "রোগীর তথ্য সম্পাদনা করুন।" : "রোগীর বিস্তারিত তথ্য দেখুন।";
  }

  const inputWrapperClass = "flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary";
  const inputFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 text-base placeholder-muted-foreground";
  const readOnlyInputFieldClass = "bg-muted/50 cursor-default";
  const textareaWrapperClass = "flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[100px]";
  const textareaFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y";


  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg md:max-w-2xl w-full p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="font-headline text-xl text-primary flex items-center">
             {currentTab === 'info' && <User className="mr-2 h-6 w-6" />}
             {currentTab === 'history' && <CalendarDays className="mr-2 h-6 w-6" />}
             {currentTab === 'addVisitAndPayment' && <BriefcaseMedical className="mr-2 h-6 w-6" />}
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} value={currentTab} onValueChange={(value) => {
            const newTab = value as 'info' | 'history' | 'addVisitAndPayment';
            setCurrentTab(newTab);
            if (newTab === 'history' && visits.length === 0) {
              fetchVisitsAndPrescriptions(patient.id);
            }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10 px-6 pt-2 border-b">
            <TabsTrigger value="info">সাধারণ তথ্য</TabsTrigger>
            <TabsTrigger value="history">ভিজিটের বিবরণ</TabsTrigger>
            <TabsTrigger value="addVisitAndPayment">নতুন ভিজিট ও পেমেন্ট</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh] lg:h-[60vh]">
            <div className="p-6">
            <TabsContent value="info">
              <Form {...patientInfoForm}>
                <form onSubmit={patientInfoForm.handleSubmit(handlePatientInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={patientInfoForm.control}
                    name="registrationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="registrationDateModal">নিবন্ধনের তারিখ</FormLabel>
                        <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                          <FormControl>
                            <Input id="registrationDateModal" type="date" {...field} value={field.value ? formatDateFns(new Date(field.value), 'yyyy-MM-dd') : ''} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={patientInfoForm.control}
                      name="diaryNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="diaryNumberModal">ডায়েরি নম্বর</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl>
                              <Input
                                id="diaryNumberModal"
                                type="text"
                                {...field}
                                value={field.value || ''}
                                readOnly={!isEditingInfo}
                                className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)}
                                placeholder="যেমন: F/123"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="nameModal">নাম</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl className="flex-1">
                              <Input id="nameModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                             {isEditingInfo && <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="রোগীর নাম (মোডাল)"
                                fieldKey="patientNameModal"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="ageModal">বয়স</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl>
                              <Input id="ageModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={patientInfoForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>লিঙ্গ</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditingInfo}>
                            <FormControl>
                              <SelectTrigger className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass, !isEditingInfo && "cursor-default")}>
                                <SelectValue placeholder="লিঙ্গ নির্বাচন করুন" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">পুরুষ</SelectItem>
                              <SelectItem value="female">মহিলা</SelectItem>
                              <SelectItem value="other">অন্যান্য</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>রোগীর পেশা</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditingInfo}>
                            <FormControl>
                              <SelectTrigger className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass, !isEditingInfo && "cursor-default")}>
                                <SelectValue placeholder="পেশা নির্বাচন করুন" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="student">ছাত্র/ছাত্রী</SelectItem>
                                <SelectItem value="housewife">গৃহিণী</SelectItem>
                                <SelectItem value="service">চাকুরীজীবী</SelectItem>
                                <SelectItem value="business">ব্যবসায়ী</SelectItem>
                                <SelectItem value="farmer">কৃষক</SelectItem>
                                <SelectItem value="labourer">শ্রমিক</SelectItem>
                                <SelectItem value="unemployed">বেকার</SelectItem>
                                <SelectItem value="retired">অবসরপ্রাপ্ত</SelectItem>
                                <SelectItem value="other">অন্যান্য</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="phoneModal">ফোন</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl>
                              <Input id="phoneModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="guardianNameModal">অভিভাবকের নাম</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl className="flex-1">
                              <Input id="guardianNameModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                             {isEditingInfo && <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="অভিভাবকের নাম (মোডাল)"
                                fieldKey="guardianNameModal"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={patientInfoForm.control}
                      name="guardianRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>অভিভাবকের সম্পর্ক</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditingInfo}>
                            <FormControl>
                              <SelectTrigger className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass, !isEditingInfo && "cursor-default")}>
                                <SelectValue placeholder="সম্পর্ক নির্বাচন করুন" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="father">পিতা</SelectItem>
                              <SelectItem value="husband">স্বামী</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={patientInfoForm.control}
                      name="villageUnion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="villageUnionModal">গ্রাম/ইউনিয়ন</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl className="flex-1">
                              <Input id="villageUnionModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                            {isEditingInfo && <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="গ্রাম/ইউনিয়ন (মোডাল)"
                                fieldKey="villageUnionModal"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="thanaUpazila"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="thanaUpazilaModal">থানা/উপজেলা</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl className="flex-1">
                              <Input id="thanaUpazilaModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                            {isEditingInfo && <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="থানা/উপজেলা (মোডাল)"
                                fieldKey="thanaUpazilaModal"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientInfoForm.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="districtModal">জেলা</FormLabel>
                          <div className={cn(inputWrapperClass, !isEditingInfo && readOnlyInputFieldClass)}>
                            <FormControl className="flex-1">
                              <Input id="districtModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                            {isEditingInfo && <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="জেলা (মোডাল)"
                                fieldKey="districtModal"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    {isEditingInfo ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => { setIsEditingInfo(false); patientInfoForm.reset(patient); }}>বাতিল</Button>
                        <Button type="submit" disabled={patientInfoForm.formState.isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                          {patientInfoForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} সংরক্ষণ করুন
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditingInfo(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Pencil className="mr-2 h-4 w-4" /> তথ্য সম্পাদনা
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="history">
              {isLoadingVisits ? (
                <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">ভিজিটের বিবরণ লোড হচ্ছে...</span></div>
              ) : visits.length > 0 ? (
                <ul className="space-y-4">
                  {visits.map(visit => (
                    <li key={visit.id}>
                      <Card className="shadow-sm hover:shadow-md transition-shadow bg-card">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-primary font-semibold mb-1">
                            <div className="flex items-center">
                                <CalendarDays className="mr-2 h-5 w-5 text-blue-600" />
                                <span>{formatDate(visit.visitDate, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <Button variant="link" size="sm" className="p-0 h-auto text-sm" onClick={() => router.push(`${ROUTES.PRESCRIPTION}/${patient.id}?visitId=${visit.id}${visit.prescription ? `&prescriptionId=${visit.prescription.id}` : ''}`)}>
                                <FileText className="mr-1 h-4 w-4 text-indigo-600" /> প্রেসক্রিপশন দেখুন
                            </Button>
                          </div>
                          <p className="text-sm"><strong className="font-medium text-muted-foreground">ডাক্তার:</strong> {visit.prescription?.doctorName || 'N/A'}</p>
                          <p className="text-sm"><strong className="font-medium text-muted-foreground">প্রধান অভিযোগ:</strong> {visit.symptoms || 'N/A'}</p>
                          <p className="text-sm"><strong className="font-medium text-muted-foreground">রোগ নির্ণয় (প্রেসক্রিপশন):</strong> {visit.prescription?.diagnosis || 'N/A'}</p>
                          {visit.medicineDeliveryMethod && (
                            <p className="text-sm">
                                <strong className="font-medium text-muted-foreground">ঔষধ প্রদান:</strong>
                                {medicineDeliveryMethodOptions.find(opt => opt.value === visit.medicineDeliveryMethod)?.label || visit.medicineDeliveryMethod}
                                {visit.medicineDeliveryMethod === 'direct' ? <PackageCheck className="inline-block ml-1 h-4 w-4 text-green-600" /> : <Truck className="inline-block ml-1 h-4 w-4 text-blue-600" />}
                            </p>
                          )}

                          {visit.prescription && visit.prescription.items.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mt-1">ঔষধপত্র:</p>
                              <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                                {visit.prescription.items.map((item, index) => (
                                  <li key={index}>
                                    {item.medicineName} ({item.dosage}, {item.frequency}, {item.duration})
                                    {item.notes ? ` - ${item.notes}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">এই রোগীর জন্য কোন পূর্ববর্তী ভিজিটের তথ্য নেই।</p>
              )}
            </TabsContent>

            <TabsContent value="addVisitAndPayment">
              <Form {...visitAndPaymentForm}>
                <form onSubmit={visitAndPaymentForm.handleSubmit(handleAddVisitAndPaymentSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={visitAndPaymentForm.control}
                      name="visitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="visitDateModalPayment">ভিজিটের তারিখ</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="visitDateModalPayment" type="date" {...field} className={inputFieldClass}/>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={visitAndPaymentForm.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel htmlFor="symptomsModalPayment">উপসর্গ / প্রধান অভিযোগ / উদ্দেশ্য</FormLabel>
                          <div className={textareaWrapperClass}>
                            <FormControl className="flex-1">
                              <Textarea id="symptomsModalPayment" placeholder="রোগীর প্রধান উপসর্গগুলি বা ভিজিটের উদ্দেশ্য বর্ণনা করুন" {...field} rows={3} className={textareaFieldClass}/>
                            </FormControl>
                            <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="উপসর্গ/উদ্দেশ্য"
                                fieldKey="symptomsModalPayment"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                                className="self-start mt-1"
                              />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={visitAndPaymentForm.control}
                      name="medicineDeliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="medicineDeliveryMethodModal">ঔষধ প্রদানের মাধ্যম</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="direct"
                          >
                            <FormControl>
                              <SelectTrigger id="medicineDeliveryMethodModal" className={inputWrapperClass}>
                                <SelectValue placeholder="ঔষধ প্রদানের মাধ্যম নির্বাচন করুন" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {medicineDeliveryMethodOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={visitAndPaymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="paymentAmountModal">টাকার পরিমাণ</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="paymentAmountModal" type="number" placeholder="0.00" {...field} className={inputFieldClass}/>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={visitAndPaymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="paymentMethodModal">পেমেন্ট মাধ্যম</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            defaultValue="cash"
                           >
                            <FormControl>
                              <SelectTrigger id="paymentMethodModal" className={inputWrapperClass}>
                                <SelectValue placeholder="পেমেন্ট মাধ্যম নির্বাচন করুন" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethodOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={visitAndPaymentForm.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="receivedByModalPayment">গ্রহণকারী (ঐচ্ছিক)</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl className="flex-1">
                              <Input id="receivedByModalPayment" placeholder="গ্রহণকারীর নাম" {...field} className={inputFieldClass}/>
                            </FormControl>
                            <MicrophoneButton
                                onTranscript={(t) => field.onChange(field.value + t)}
                                onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                                targetFieldDescription="গ্রহণকারী"
                                fieldKey="receivedByModalPayment"
                                isListeningGlobal={isListeningGlobal}
                                setIsListeningGlobal={setIsListeningGlobal}
                                currentListeningField={currentListeningField}
                                setCurrentListeningField={setCurrentListeningField}
                              />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white" disabled={visitAndPaymentForm.formState.isSubmitting}>
                    {visitAndPaymentForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BriefcaseMedical className="mr-2 h-4 w-4" />}
                    ভিজিট ও পেমেন্ট যুক্ত করুন
                  </Button>
                </form>
              </Form>
            </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-4 pt-2 border-t">
          <DialogClose asChild>
            <Button variant="outline">বন্ধ করুন</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
