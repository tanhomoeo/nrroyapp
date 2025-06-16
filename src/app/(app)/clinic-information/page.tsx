
'use client';
import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getClinicSettings, saveClinicSettings } from '@/lib/localStorage';
import type { ClinicSettings } from '@/lib/types';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Loader2, Save, Building } from 'lucide-react';

const clinicInfoFormSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required."),
  doctorName: z.string().min(1, "Doctor's name is required."),
  clinicAddress: z.string().min(1, "Clinic address is required."),
  clinicContact: z.string().min(1, "Clinic contact is required."),
  bmRegNo: z.string().optional(),
});

type ClinicInfoFormValues = z.infer<typeof clinicInfoFormSchema>;

export default function ClinicInformationPage() {
  const { toast } = useToast();
  const form = useForm<ClinicInfoFormValues>({
    resolver: zodResolver(clinicInfoFormSchema),
    defaultValues: {
      clinicName: '',
      doctorName: '',
      clinicAddress: '',
      clinicContact: '',
      bmRegNo: '',
    },
  });

  useEffect(() => {
    const currentSettings = getClinicSettings();
    form.reset({
      clinicName: currentSettings.clinicName || '',
      doctorName: currentSettings.doctorName || '',
      clinicAddress: currentSettings.clinicAddress || '',
      clinicContact: currentSettings.clinicContact || '',
      bmRegNo: currentSettings.bmRegNo || '',
    });
  }, [form]);

  const onSubmit: SubmitHandler<ClinicInfoFormValues> = (data) => {
    try {
      const currentSettings = getClinicSettings();
      const updatedSettings: ClinicSettings = {
        ...currentSettings, 
        ...data,
      };
      saveClinicSettings(updatedSettings);
      toast({
        title: 'Clinic Information Saved',
        description: 'Clinic details have been updated successfully.',
      });
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


  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="Clinic Information"
        description="Manage your clinic's details for display on printed documents."
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
                      <FormControl>
                        <Input placeholder="e.g., Your Clinic Name" {...field} className={inputFieldClass} />
                      </FormControl>
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
                    <FormLabel>Doctor's Name</FormLabel>
                    <div className={inputWrapperClass}>
                      <FormControl>
                        <Input placeholder="e.g., Dr. John Doe" {...field} className={inputFieldClass} />
                      </FormControl>
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
                      <FormControl>
                        <Textarea placeholder="Full clinic address" {...field} rows={3} className={textareaFieldClass} />
                      </FormControl>
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
