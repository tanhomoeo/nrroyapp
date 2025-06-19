
'use client';
import React, { useState, useRef } from 'react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquareText, Wand2, AlertCircle, List, Pill } from 'lucide-react';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';
import { analyzeComplaint, type ComplaintAnalyzerInput, type ComplaintAnalyzerOutput } from '@/ai/flows/complaint-analyzer-flow'; // Updated import
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiSummaryPage() {
  const [complaintText, setComplaintText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ComplaintAnalyzerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);

  const handleAnalyzeComplaint = async () => {
    if (!complaintText.trim()) {
      setError("অনুগ্রহ করে রোগীর অভিযোগ লিখুন।");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const input: ComplaintAnalyzerInput = { complaintText };
      const result = await analyzeComplaint(input);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      let errorMessage = "অভিযোগ বিশ্লেষণ করার সময় একটি ত্রুটি হয়েছে।";
      if (err.message) {
        errorMessage = err.message.includes("deadline") || err.message.includes("timeout")
          ? "AI সার্ভার থেকে উত্তর পেতে বেশি সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
          : `বিশ্লেষণে ত্রুটি: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="AI দ্বারা অভিযোগ বিশ্লেষণ"
        description="রোগীর অভিযোগ ইনপুট করুন এবং AI দ্বারা তৈরি সারাংশ ও সম্ভাব্য ঔষধের তালিকা পান।"
        actions={<Wand2 className="h-8 w-8 text-primary" />}
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center">
            <MessageSquareText className="mr-3 h-6 w-6 text-primary" />
            রোগীর অভিযোগ
          </CardTitle>
          <CardDescription>
            রোগীর সম্পূর্ণ অভিযোগ এখানে লিখুন অথবা ভয়েস ইনপুট ব্যবহার করুন। AI এটি বিশ্লেষণ করে গুরুত্বপূর্ণ পয়েন্ট এবং সম্ভাব্য ঔষধের তালিকা দেবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[120px]">
              <Textarea
                id="aiSummaryComplaintText"
                placeholder="রোগীর সম্পূর্ণ অভিযোগ এখানে লিখুন..."
                rows={6}
                className="bg-card flex-1 border-0 shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
              />
              <MicrophoneButton
                onTranscript={(t) => {
                  // Continuous update while speaking, good for visual feedback if textarea updates live
                  // For now, let's rely on final transcript to avoid too many re-renders if not optimized
                }}
                onFinalTranscript={(t) => setComplaintText(prev => appendFinalTranscript(prev, t))}
                targetFieldDescription="রোগীর অভিযোগ"
                fieldKey="aiSummaryComplaintText"
                isListeningGlobal={isListeningGlobal}
                setIsListeningGlobal={setIsListeningGlobal}
                currentListeningField={currentListeningField}
                setCurrentListeningField={setCurrentListeningField}
                className="self-start mt-1 mr-1"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAnalyzeComplaint} disabled={isLoading} className="min-w-[180px]">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                অভিযোগ বিশ্লেষণ করুন
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ত্রুটি</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="mt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">AI আপনার অভিযোগ বিশ্লেষণ করছে...</p>
            </div>
          )}

          {analysisResult && !isLoading && (
            <div className="mt-8 space-y-6">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="font-headline text-md flex items-center">
                    <List className="mr-2 h-5 w-5 text-blue-600" />
                    অভিযোগের গুরুত্বপূর্ণ পয়েন্টসমূহ:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.summaryPoints.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {analysisResult.summaryPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">কোনো সারাংশ পয়েন্ট পাওয়া যায়নি।</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="font-headline text-md flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-green-600" />
                    সম্ভাব্য হোমিওপ্যাথিক ঔষধের তালিকা:
                  </CardTitle>
                  <CardDescription className="text-xs">
                    এটি শুধুমাত্র AI দ্বারা প্রস্তাবিত একটি তালিকা, চূড়ান্ত প্রেসক্রিপশন নয়। অনুগ্রহ করে একজন অভিজ্ঞ চিকিৎসকের পরামর্শ নিন।
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.medicineSuggestions.length > 0 ? (
                    <ul className="list-decimal space-y-1 pl-5 text-sm">
                      {analysisResult.medicineSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">কোনো ঔষধের প্রস্তাব পাওয়া যায়নি।</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
