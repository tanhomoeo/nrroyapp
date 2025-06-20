
'use client';
import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Patient, PaymentSlip, PaymentMethod } from '@/lib/types';
import { addPaymentSlip, formatCurrency } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Receipt } from 'lucide-react';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';

interface CreatePaymentSlipModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: (slipCreated?: boolean) => void;
  onSlipCreated?: (slip: PaymentSlip) => void;
  visitId?: string;
}

// Updated paymentMethodOptions
const paymentMethodOptions: { value: Exclude<PaymentMethod, ''>; label: string }[] = [
  { value: 'cash', label: 'ক্যাশ' },
  { value: 'bkash', label: 'বিকাশ' },
  { value: 'nagad', label: 'নগদ' },
  { value: 'rocket', label: 'রকেট' },
  // 'courier_medicine' removed
  { value: 'other', label: 'অন্যান্য' },
];

// Updated paymentSlipSchema
const paymentSlipSchema = z.object({
  amount: z.coerce.number().nonnegative("টাকার পরিমাণ অবশ্যই একটি অ-ঋণাত্মক সংখ্যা হতে হবে।"),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket', 'other', '']).optional(), // 'courier_medicine' removed
  receivedBy: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.amount > 0 && !data.paymentMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "টাকার পরিমাণ ০ এর বেশি হলে পেমেন্ট মাধ্যম আবশ্যক।",
      path: ["paymentMethod"],
    });
  }
});

type PaymentSlipFormValues = z.infer<typeof paymentSlipSchema>;

export function CreatePaymentSlipModal({ patient, isOpen, onClose, onSlipCreated, visitId }: CreatePaymentSlipModalProps) {
  const { toast } = useToast();
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  const form = useForm<PaymentSlipFormValues>({
    resolver: zodResolver(paymentSlipSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'cash',
      receivedBy: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        amount: 0,
        paymentMethod: 'cash',
        receivedBy: '',
      });
    }
  }, [isOpen, form]);

  const onSubmit: SubmitHandler<PaymentSlipFormValues> = async (data) => {
    try {
      const newSlipData: Omit<PaymentSlip, 'id' | 'createdAt'> = {
        patientId: patient.id,
        visitId: visitId,
        slipNumber: `SLIP-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        amount: data.amount,
        purpose: "সাধারণ পেমেন্ট", 
        paymentMethod: data.amount > 0 ? data.paymentMethod as Exclude<PaymentMethod, ''> : undefined,
        receivedBy: data.receivedBy,
      };
      const slipId = await addPaymentSlip(newSlipData);
      if (!slipId) {
        throw new Error("Failed to save payment slip to Firestore.");
      }
      const createdSlip = { ...newSlipData, id: slipId, createdAt: new Date().toISOString() };

      toast({
        title: 'পেমেন্ট স্লিপ তৈরি হয়েছে',
        description: `স্লিপ ${createdSlip.slipNumber} (${formatCurrency(createdSlip.amount)}) সফলভাবে তৈরি করা হয়েছে।`,
      });
      if (onSlipCreated) {
        onSlipCreated(createdSlip);
      }
      form.reset({ amount: 0, paymentMethod: 'cash', receivedBy: '' });
      onClose(true);
      window.dispatchEvent(new CustomEvent('firestoreDataChange'));
    } catch (error) {
      console.error("Failed to create payment slip:", error);
      toast({
        title: 'ত্রুটি',
        description: 'পেমেন্ট স্লিপ তৈরি করতে ব্যর্থ হয়েছে।',
        variant: 'destructive',
      });
      onClose(false);
    }
  };

  const inputWrapperClass = "flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary";
  const inputFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 text-base placeholder-muted-foreground";

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset({ amount: 0, paymentMethod: 'cash', receivedBy: '' }); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-primary" />
            {patient.name}-এর জন্য পেমেন্ট স্লিপ তৈরি করুন
          </DialogTitle>
          <DialogDescription>
            নতুন পেমেন্ট স্লিপের বিবরণ লিখুন।
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>টাকার পরিমাণ (BDT)</FormLabel>
                   <div className={inputWrapperClass}>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} className={inputFieldClass}/>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>পেমেন্ট মাধ্যম</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    defaultValue="cash"
                  >
                    <FormControl>
                      <SelectTrigger className={inputWrapperClass}>
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
              control={form.control}
              name="receivedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>গ্রহণকারী (ঐচ্ছিক)</FormLabel>
                  <div className={inputWrapperClass}>
                    <FormControl className="flex-1">
                      <Input placeholder="গ্রহণকারীর নাম" {...field} className={inputFieldClass} id="slipReceivedByModalBengali"/>
                    </FormControl>
                    <MicrophoneButton
                        onTranscript={(t) => field.onChange(field.value + t)}
                        onFinalTranscript={(t) => field.onChange(appendFinalTranscript(field.value, t))}
                        targetFieldDescription="গ্রহণকারী"
                        fieldKey="slipReceivedByModalBengali"
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
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose(false)}>বাতিল</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="mr-2 h-4 w-4" />
                )}
                স্লিপ তৈরি করুন
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    
