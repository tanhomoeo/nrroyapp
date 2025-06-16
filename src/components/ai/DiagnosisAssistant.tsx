// Diagnosis Assistant component has been temporarily disabled.
'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Construction } from 'lucide-react';

interface DiagnosisAssistantProps {
  initialSymptoms?: string;
  initialPatientHistory?: string;
  onSuggestion?: (suggestion: string) => void;
}

export function DiagnosisAssistant({ initialSymptoms = '', initialPatientHistory = '', onSuggestion }: DiagnosisAssistantProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary opacity-50" />
          হোমিওপ্যাথিক AI সহকারী (বন্ধ আছে)
        </CardTitle>
        <CardDescription className="flex items-center">
            <Construction className="mr-2 h-4 w-4 text-amber-500" />
            এই ফিচারটি সাময়িকভাবে বন্ধ আছে।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center p-4 bg-muted/30 rounded-md">
          AI ভিত্তিক ঔষধের পরামর্শ প্রদানের সুবিধাটি শীঘ্রই আবার চালু করা হবে।
        </p>
      </CardContent>
    </Card>
  );
}
