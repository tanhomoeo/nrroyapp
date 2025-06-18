
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addPatient } from '@/lib/firestoreService';
import type { Patient } from '@/lib/types';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { Loader2, CalendarIcon, UserPlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format, isValid } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';

const patientFormSchema = z.object({
  registrationDate: z.date({ required_error: "নিবন্ধনের তারিখ আবশ্যক।" }),
  diaryNumber: z.string().optional(), // Changed to string, manual input
  name: z.string().min(1, { message: "পুরো নাম আবশ্যক।" }),
  age: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', ''], { errorMap: () => ({ message: "লিঙ্গ নির্বাচন করুন।" }) }).optional(),
  occupation: z.string().optional(),
  phone: z.string().regex(/^(\+8801|01)\d{9}$/, { message: "একটি বৈধ বাংলাদেশী ফোন নম্বর লিখুন।" }),
  guardianRelation: z.enum(['father', 'husband', ''], { errorMap: () => ({ message: "অভিভাবকের সম্পর্ক নির্বাচন করুন।" }) }).optional(),
  guardianName: z.string().optional(),
  district: z.string().optional(),
  thanaUpazila: z.string().optional(),
  villageUnion: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function PatientEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingSettings, setIsLoadingSettings] = useState(false); // No longer loading settings for diary number

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      registrationDate: new Date(),
      diaryNumber: '', // Default to empty string
      name: '',
      age: '',
      gender: '',
      occupation: '',
      phone: '',
      guardianRelation: '',
      guardianName: '',
      district: '',
      thanaUpazila: '',
      villageUnion: '',
    },
  });

  // Removed useEffect for fetching clinic settings related to nextDiaryNumber

  const onSubmit: SubmitHandler<PatientFormValues> = async (data) => {
    try {
      const newPatientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        phone: data.phone,
        registrationDate: data.registrationDate.toISOString(),
        age: data.age,
        gender: data.gender as Patient['gender'] || undefined,
        occupation: data.occupation,
        guardianRelation: data.guardianRelation as Patient['guardianRelation'] || undefined,
        guardianName: data.guardianName,
        district: data.district,
        thanaUpazila: data.thanaUpazila,
        villageUnion: data.villageUnion,
        diaryNumber: data.diaryNumber || undefined, // Save as string or undefined
      };

      const patientId = await addPatient(newPatientData);

      // Removed logic for updating nextDiaryNumber in clinic settings

      toast({
        title: 'রোগী নিবন্ধিত',
        description: `${data.name} সফলভাবে নিবন্ধিত হয়েছেন। ডায়েরি নং: ${newPatientData.diaryNumber || 'N/A'}`,
      });

      form.reset({
        registrationDate: new Date(),
        diaryNumber: '', // Reset to empty
        name: '',
        age: '',
        gender: '',
        occupation: '',
        phone: '',
        guardianRelation: '',
        guardianName: '',
        district: '',
        thanaUpazila: '',
        villageUnion: '',
      });
      router.push(`${ROUTES.PATIENT_SEARCH}?q=${newPatientData.phone}`);
      window.dispatchEvent(new CustomEvent('firestoreDataChange'));

    } catch (error: any) {
      console.error('Failed to register patient:', error);
      let errorMessage = "An unknown error occurred during patient registration.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
            errorMessage = String(error);
        }
      toast({
        title: 'নিবন্ধন ব্যর্থ হয়েছে',
        description: `রোগী নিবন্ধন করার সময় একটি ত্রুটি ঘটেছে: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const inputWrapperClass = "flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary";
  const inputFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 text-base placeholder-muted-foreground";

  if (isLoadingSettings) { // Though settings are not directly used for diary numbers now, keep for potential future use
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <PageHeaderCard
          title="নতুন রোগী নিবন্ধন"
          description="নতুন রোগী নিবন্ধন করতে নিচের বিবরণগুলি পূরণ করুন। ডেটা সিস্টেমে সংরক্ষিত হবে।"
          actions={<UserPlus className="h-8 w-8 text-primary" />}
        />
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-md">
            <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="registrationDate"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>নিবন্ধনের তারিখ <span className="text-destructive">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            inputWrapperClass
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {field.value && isValid(field.value) ? (
                            format(field.value, "PPP", { locale: bn })
                          ) : (
                            <span>একটি তারিখ নির্বাচন করুন</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={bn}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diaryNumber"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>ডায়েরি নম্বর</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input
                          placeholder="যেমন: F/123, CH/456"
                          {...field}
                          type="text" // Changed to text
                          className={inputFieldClass}
                          id="patientDiaryNumberEntry"
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-xs">এখানে ম্যানুয়ালি ডায়েরি নম্বর লিখুন।</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-1 hidden md:block"></div> {/* Spacer */}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>পুরো নাম <span className="text-destructive">*</span></FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="পুরো নাম লিখুন" {...field} id="patientNameEntry" className={inputFieldClass} />
                      </FormControl>
                      <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="রোগীর নাম"
                        fieldKey="patientNameEntry"
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

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>বয়স</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="বয়স লিখুন" {...field} type="text" className={inputFieldClass} id="patientAgeEntry" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>লিঙ্গ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <FormControl>
                        <SelectTrigger className={inputWrapperClass} id="patientGenderEntry">
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
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>রোগীর পেশা (ঐচ্ছিক)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                      <FormControl>
                        <SelectTrigger className={inputWrapperClass} id="patientOccupationEntry">
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
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>ফোন নম্বর <span className="text-destructive">*</span></FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input type="tel" placeholder="যেমন: 01XXXXXXXXX" {...field} className={inputFieldClass} id="patientPhoneEntry" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianRelation"
                render={({ field }) => (
                  <FormItem className="space-y-3 md:col-span-1">
                    <FormLabel>অভিভাবকের সম্পর্ক</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        className="flex space-x-4 pt-1"
                        id="patientGuardianRelationEntry"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="father" />
                          </FormControl>
                          <FormLabel className="font-normal">পিতা</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="husband" />
                          </FormControl>
                          <FormLabel className="font-normal">স্বামী</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>অভিভাবকের নাম (ঐচ্ছিক)</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="অভিভাবকের নাম লিখুন" {...field} id="guardianNameEntry" className={inputFieldClass} />
                      </FormControl>
                      <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="অভিভাবকের নাম"
                        fieldKey="guardianNameEntry"
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

              <FormField
                control={form.control}
                name="villageUnion"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>গ্রাম / ইউনিয়ন (ঐচ্ছিক)</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="গ্রাম বা ইউনিয়ন লিখুন" {...field} id="villageUnionEntry" className={inputFieldClass} />
                      </FormControl>
                      <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="গ্রাম/ইউনিয়ন"
                        fieldKey="villageUnionEntry"
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
              <FormField
                control={form.control}
                name="thanaUpazila"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>থানা / উপজেলা (ঐচ্ছিক)</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="থানা বা উপজেলা লিখুন" {...field} id="thanaUpazilaEntry" className={inputFieldClass} />
                      </FormControl>
                      <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="থানা/উপজেলা"
                        fieldKey="thanaUpazilaEntry"
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
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>জেলা (ঐচ্ছিক)</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="জেলা লিখুন" {...field} id="districtEntry" className={inputFieldClass} />
                      </FormControl>
                      <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="জেলা"
                        fieldKey="districtEntry"
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
            </CardContent>
            <CardFooter className="flex justify-end p-6 border-t">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingSettings} className="min-w-[150px]">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> সংরক্ষণ করা হচ্ছে...
                  </>
                ) : (
                  'নিবন্ধন করুন'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
