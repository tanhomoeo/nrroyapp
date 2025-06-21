'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getClinicSettings, saveClinicSettings } from '@/lib/firestoreService';
import type { ClinicSettings } from '@/lib/types';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Loader2, Save, Building } from 'lucide-react';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';

const clinicInfoFormSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required."),
 doctorName: z.string().min(1, "Doctor's name is required."),
  clinicAddress: z.string().min(1, "Clinic address is required."),
  clinicContact: z.string().min(1, "Clinic contact is required."),
  bmRegNo: z.string().optional(),
  // nextDiaryNumber field removed
});

type ClinicInfoFormValues = z.infer<typeof clinicInfoFormSchema>;

export default function ClinicInformationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  const form = useForm<ClinicInfoFormValues>({
    resolver: zodResolver(clinicInfoFormSchema),
    defaultValues: {
      clinicName: '',
      doctorName: '',
      clinicAddress: '',
      clinicContact: '',
      bmRegNo: '',
      // nextDiaryNumber removed from defaultValues
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const currentSettings = await getClinicSettings();
        form.reset({
          clinicName: currentSettings.clinicName || '',
          doctorName: currentSettings.doctorName || '',
          clinicAddress: currentSettings.clinicAddress || '',
          clinicContact: currentSettings.clinicContact || '',
          bmRegNo: currentSettings.bmRegNo || '',
          // nextDiaryNumber removed from reset
        });
      } catch (error) {
          toast({ title: "Error", description: "Could not load clinic settings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [form, toast]);

  const onSubmit: SubmitHandler<ClinicInfoFormValues> = async (data) => {
    try {
      // No need to fetch currentSettings just for nextDiaryNumber
      const updatedSettings: ClinicSettings = {
        ...data, // Directly use form data
      };
      await saveClinicSettings(updatedSettings);
      toast({
        title: 'Clinic Information Saved',
        description: 'Clinic details have been updated successfully.',
      });
      window.dispatchEvent(new CustomEvent('firestoreDataChange'));
    } catch (error) {
      console.error('Failed to save clinic information:', error);
      toast({
        title: 'Save Failed',
        description: 'An error occurred while saving clinic information.',
        variant: 'destructive',
      });
    }
  };

  const inputWrapperClass = "flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary";
  const inputFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 text-base placeholder-muted-foreground";
  const textareaWrapperClass = "flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[80px]";
  const textareaFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y";

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="ml-3">ক্লিনিকের তথ্য লোড হচ্ছে...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <PageHeaderCard 
        title="Clinic Information"
        description="Manage your clinic&apos;s details for display on printed documents."
        actions={<Building className="h-8 w-8 text-primary" />}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Clinic Details</CardTitle>
              <CardDescription>This information will be used on printed documents like prescriptions and reports.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="e.g., Your Clinic Name" {...field} className={inputFieldClass} id="clinicNameInfo" />
                      </FormControl>
                       <MicrophoneButton
                          onTranscript={(t) => field.onChange(field.value + t)}
                          onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                          targetFieldDescription="ক্লিনিকের নাম"
                          fieldKey="clinicNameInfo"
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
                name="doctorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor&apos;s Name</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl className="flex-1">
                        <Input placeholder="e.g., Dr. John Doe" {...field} className={inputFieldClass} id="doctorNameInfo" />
                      </FormControl>
                      <MicrophoneButton
                          onTranscript={(t) => field.onChange(field.value + t)}
                          onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                          targetFieldDescription="ডাক্তারের নাম"
                          fieldKey="doctorNameInfo"
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
                name="clinicAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Clinic Address</FormLabel>
                    <div className={textareaWrapperClass}>
                      <FormControl className="flex-1">
                        <Textarea placeholder="Full clinic address" {...field} rows={3} className={textareaFieldClass} id="clinicAddressInfo" />
                      </FormControl>
                      <MicrophoneButton
                          onTranscript={(t) => field.onChange(field.value + t)}
                          onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                          targetFieldDescription="ক্লিনিকের ঠিকানা"
                          fieldKey="clinicAddressInfo"
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
                control={form.control}
                name="clinicContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Contact (Phone/Email)</FormLabel>
                     <div className={inputWrapperClass}>
                        <FormControl>
                          <Input placeholder="e.g., 01XXXXXXXXX, email@example.com" {...field} className={inputFieldClass} />
                        </FormControl>
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bmRegNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BMDC Registration No. (Optional)</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl>
                        <Input placeholder="e.g., 12345" {...field} className={inputFieldClass} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Removed nextDiaryNumber FormField */}
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-[120px]">
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Information
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
