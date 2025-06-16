
'use client';
import React, { useState, useEffect } from 'react';
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
import { getVisitsByPatientId, addVisit, generateId, formatDate, updatePatient, getPrescriptionsByPatientId, addPaymentSlip } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Save, BriefcaseMedical, Loader2, CalendarDays, FileText, PackageCheck, Truck, User } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; 
import { cn } from '@/lib/utils';

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
  diaryNumber: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? Number(val) : undefined),
    z.number().int().nonnegative("ডায়েরি নম্বর একটি অ-ঋণাত্মক সংখ্যা হতে হবে।").optional()
  ),
  age: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  occupation: z.string().optional(),
  guardianRelation: z.enum(['father', 'husband', '']).optional(),
  guardianName: z.string().optional(),
  thanaUpazila: z.string().optional(),
  registrationDate: z.string().optional(),
});
type PatientInfoValues = z.infer<typeof patientInfoSchema>;

const paymentMethodOptions: { value: Exclude<PaymentMethod, ''>; label: string }[] = [
  { value: 'cash', label: 'ক্যাশ' },
  { value: 'bkash', label: 'বিকাশ' },
  { value: 'nagad', label: 'নগদ' },
  { value: 'rocket', label: 'রকেট' },
  { value: 'courier_medicine', label: 'কুরিয়ার ও ঔষধ' },
  { value: 'other', label: 'অন্যান্য' },
];

const medicineDeliveryMethodOptions: { value: 'direct' | 'courier'; label: string }[] = [
    { value: 'direct', label: 'সরাসরি প্রদান' },
    { value: 'courier', label: 'কুরিয়ারের মাধ্যমে প্রেরণ' },
];

const visitAndPaymentFormSchema = z.object({
  visitDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "অবৈধ তারিখ" }),
  symptoms: z.string().min(3, "উপসর্গ/উদ্দেশ্য আবশ্যক"),
  amount: z.coerce.number().nonnegative("টাকার পরিমাণ অবশ্যই একটি অ-ঋণাত্মক সংখ্যা হতে হবে।"),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'courier_medicine', 'other']).optional(),
  medicineDeliveryMethod: z.enum(['direct', 'courier'], { required_error: "ঔষধ প্রদানের মাধ্যম নির্বাচন করুন।" }),
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

  const patientInfoForm = useForm<PatientInfoValues>({
    resolver: zodResolver(patientInfoSchema),
    defaultValues: {
        name: '',
        phone: '',
        villageUnion: '',
        district: '',
        diaryNumber: undefined,
        age: '',
        gender: '',
        occupation: '',
        guardianRelation: '',
        guardianName: '',
        thanaUpazila: '',
        registrationDate: new Date().toISOString(),
    },
  });

  const visitAndPaymentForm = useForm<VisitAndPaymentFormValues>({
    resolver: zodResolver(visitAndPaymentFormSchema),
    defaultValues: {
      visitDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      amount: 0,
      paymentMethod: 'cash', 
      medicineDeliveryMethod: 'direct', 
      receivedBy: '',
    },
  });

  useEffect(() => {
    if (isOpen && patient) {
      setCurrentTab(defaultTab);
      patientInfoForm.reset({
        ...patient,
        diaryNumber: patient.diaryNumber,
        villageUnion: patient.villageUnion || '',
        age: patient.age || '',
        gender: patient.gender || '',
        occupation: patient.occupation || '',
        guardianRelation: patient.guardianRelation || '',
        guardianName: patient.guardianName || '',
        thanaUpazila: patient.thanaUpazila || '',
        registrationDate: patient.registrationDate || new Date().toISOString(),
      });
      visitAndPaymentForm.reset({
        visitDate: new Date().toISOString().split('T')[0],
        symptoms: '',
        amount: 0,
        paymentMethod: 'cash',
        medicineDeliveryMethod: 'direct',
        receivedBy: '',
      });
      setIsEditingInfo(false);
      setIsLoadingVisits(true);

      setTimeout(() => {
        const patientVisits = getVisitsByPatientId(patient.id);
        const patientPrescriptions = getPrescriptionsByPatientId(patient.id);

        const enrichedVisitsData = patientVisits.map(v => {
          const visitPrescriptions = patientPrescriptions
            .filter(p => p.visitId === v.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return { ...v, prescription: visitPrescriptions.length > 0 ? visitPrescriptions[0] : null };
        }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

        setVisits(enrichedVisitsData);
        setIsLoadingVisits(false);
      }, 300);
    }
  }, [isOpen, patient, patientInfoForm, visitAndPaymentForm, defaultTab]);

  const handlePatientInfoSubmit: SubmitHandler<PatientInfoValues> = (data) => {
    try {
      const updatedPatientData: Patient = {
        ...patient,
        ...data,
        diaryNumber: data.diaryNumber,
        updatedAt: new Date().toISOString(),
      };
      delete updatedPatientData.diaryPrefix; // Ensure diaryPrefix is not carried over if it existed
      updatePatient(updatedPatientData);
      onPatientUpdate(updatedPatientData);
      toast({ title: "রোগীর তথ্য আপডেট হয়েছে", description: `${data.name}-এর বিবরণ সংরক্ষণ করা হয়েছে।` });
      setIsEditingInfo(false);
    } catch (error) {
      toast({ title: "ত্রুটি", description: "রোগীর তথ্য আপডেট করতে ব্যর্থ হয়েছে।", variant: "destructive" });
    }
  };

  const handleAddVisitAndPaymentSubmit: SubmitHandler<VisitAndPaymentFormValues> = (data) => {
    const newVisit: Visit = {
        id: generateId(),
        patientId: patient.id,
        visitDate: new Date(data.visitDate).toISOString(),
        symptoms: data.symptoms, 
        medicineDeliveryMethod: data.medicineDeliveryMethod, 
        createdAt: new Date().toISOString(),
    };
    addVisit(newVisit);
    toast({ title: 'ভিজিট লগ হয়েছে', description: `রোগী: ${patient.name} এর জন্য ভিজিট যুক্ত করা হয়েছে।` });

    if (data.amount > 0) { 
      const newSlip: PaymentSlip = {
        id: generateId(),
        patientId: patient.id,
        visitId: newVisit.id,
        slipNumber: `SLIP-${Date.now().toString().slice(-6)}`, 
        date: new Date(data.visitDate).toISOString(), 
        amount: data.amount,
        purpose: data.symptoms, 
        paymentMethod: data.paymentMethod, 
        receivedBy: data.receivedBy,
        createdAt: new Date().toISOString(),
      };
      addPaymentSlip(newSlip);
      toast({
        title: 'পেমেন্ট স্লিপ তৈরি হয়েছে',
        description: `স্লিপ ${newSlip.slipNumber} ভিজিট ${newVisit.id} এর সাথে যুক্ত করা হয়েছে।`,
      });
    }
    
    visitAndPaymentForm.reset({
      visitDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      amount: 0,
      paymentMethod: 'cash',
      medicineDeliveryMethod: 'direct',
      receivedBy: '',
    });
    
    const patientVisits = getVisitsByPatientId(patient.id);
    const patientPrescriptions = getPrescriptionsByPatientId(patient.id);
    const enrichedVisitsData = patientVisits.map(v => {
        const visitPrescriptions = patientPrescriptions
        .filter(p => p.visitId === v.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...v, prescription: visitPrescriptions.length > 0 ? visitPrescriptions[0] : null };
    }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    setVisits(enrichedVisitsData);
    onClose(); 
    router.push(`${ROUTES.DASHBOARD}`); // Navigate to dashboard
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

        <Tabs defaultValue={defaultTab} value={currentTab} onValueChange={(value) => setCurrentTab(value as 'info' | 'history' | 'addVisitAndPayment')} className="w-full">
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="nameModal">নাম</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="nameModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
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
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="guardianNameModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
                          </div>
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
                          <div className={inputWrapperClass}>
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
                      name="villageUnion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="villageUnionModal">গ্রাম/ইউনিয়ন</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="villageUnionModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
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
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="districtModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
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
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="thanaUpazilaModal" {...field} readOnly={!isEditingInfo} className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} />
                            </FormControl>
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
                          <div className={inputWrapperClass}>
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
                      name="diaryNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="diaryNumberModal">ডায়েরি নম্বর</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="diaryNumberModal" type="number" {...field} 
                                onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                value={field.value ?? ''}
                                readOnly={!isEditingInfo} 
                                className={cn(inputFieldClass, !isEditingInfo && readOnlyInputFieldClass)} 
                              />
                            </FormControl>
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
                            <FormControl>
                              <Textarea id="symptomsModalPayment" placeholder="রোগীর প্রধান উপসর্গগুলি বা ভিজিটের উদ্দেশ্য বর্ণনা করুন" {...field} rows={3} className={textareaFieldClass}/>
                            </FormControl>
                          </div>
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
                            value={field.value} 
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
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="receivedByModal">গ্রহণকারী (ঐচ্ছিক)</FormLabel>
                          <div className={inputWrapperClass}>
                            <FormControl>
                              <Input id="receivedByModal" placeholder="গ্রহণকারীর নাম" {...field} className={inputFieldClass}/>
                            </FormControl>
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
