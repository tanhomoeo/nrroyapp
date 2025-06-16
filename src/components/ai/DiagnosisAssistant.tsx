
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { diagnosePatient, type DiagnosePatientInput, type DiagnosePatientOutput } from '@/ai/flows/diagnosis-assistant';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DiagnosisAssistantProps {
  initialSymptoms?: string;
  initialPatientHistory?: string;
  onSuggestion?: (suggestion: string) => void;
}

export function DiagnosisAssistant({ initialSymptoms = '', initialPatientHistory = '', onSuggestion }: DiagnosisAssistantProps) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [patientHistory, setPatientHistory] = useState(initialPatientHistory);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast({ title: 'তথ্য প্রয়োজন', description: 'অনুগ্রহ করে রোগীর লক্ষণগুলি লিখুন।', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setSuggestions(null);
    try {
      const input: DiagnosePatientInput = {
        symptoms,
        patientHistory: patientHistory || "কোনো বিশেষ ইতিহাস দেওয়া হয়নি।"
      };
      const result: DiagnosePatientOutput = await diagnosePatient(input);
      setSuggestions(result.diagnosisSuggestions);
      if (onSuggestion) {
        onSuggestion(result.diagnosisSuggestions);
      }
    } catch (error: any) {
      console.error('Error fetching diagnosis suggestions (raw error object):', error);
      let description = 'ঔষধের পরামর্শ পেতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (error instanceof Error) {
        description = error.message;
      } else if (typeof error === 'string') {
        description = error;
      } else if (error && typeof error.toString === 'function') {
        const errorString = error.toString();
         if (!errorString.toLowerCase().includes('<html') && !errorString.toLowerCase().includes('<!doctype')) {
          description = errorString;
        } else {
          description = "Server returned an unexpected response. Check console for details.";
        }
      }
      toast({
        title: 'AI ত্রুটি',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          হোমিওপ্যাথিক AI সহকারী
        </CardTitle>
        <CardDescription>রোগীর লক্ষণ ও ইতিহাস অনুসারে সম্ভাব্য হোমিওপ্যাথিক ঔষধ সম্পর্কে AI থেকে পরামর্শ নিন।</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symptoms-ai">রোগীর লক্ষণসমূহ</Label>
            <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[80px]">
              <Textarea
                id="symptoms-ai"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="রোগীর শারীরিক, মানসিক এবং সাধারণ লক্ষণগুলি বিস্তারিতভাবে লিখুন..."
                rows={3}
                required
                className="h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="patientHistory-ai">রোগীর ইতিহাস (ঐচ্ছিক)</Label>
            <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[80px]">
              <Textarea
                id="patientHistory-ai"
                value={patientHistory}
                onChange={(e) => setPatientHistory(e.target.value)}
                placeholder="যেমন: ডায়াবেটিস, উচ্চ রক্তচাপ, পূর্বের রোগ বা পারিবারিক অসুস্থতার ইতিহাস..."
                rows={3}
                className="h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            পরামর্শ নিন
          </Button>
        </CardFooter>
      </form>
      {suggestions && (
        <div className="p-6 pt-0">
          <Alert variant="default" className="bg-primary/10 border-primary/30">
            <Sparkles className="h-4 w-4 !text-primary" />
            <AlertTitle className="font-headline text-primary">হোমিওপ্যাথিক ঔষধের পরামর্শ</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap text-foreground">
              {suggestions}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
