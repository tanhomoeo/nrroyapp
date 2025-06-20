
'use client';
import React, { useState, useRef } from 'react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquareText, Wand2, AlertCircle, List, Pill } from 'lucide-react';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';
import { analyzeComplaint, type ComplaintAnalyzerInput, type ComplaintAnalyzerOutput } from '@/ai/flows/complaint-analyzer-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiSummaryPage() {
  const [complaintText, setComplaintText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ComplaintAnalyzerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);
  const complaintTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleAnalyzeComplaint = async () => {
    if (!complaintText.trim()) {
      setError("অনুগ্রহ করে রোগীর অভিযোগ লিখুন।");
      complaintTextAreaRef.current?.focus();
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
      let errorMessage = "অভিযোগ বিশ্লেষণ করার সময় একটি ত্রুটি হয়েছে।";
      if (err.message) {
           errorMessage = err.message; // Use the error message from the flow directly
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
            রোগীর সম্পূর্ণ অভিযোগ এখানে বাংলা ভাষায় লিখুন অথবা ভয়েস ইনপুট ব্যবহার করুন। AI এটি বিশ্লেষণ করে গুরুত্বপূর্ণ পয়েন্ট এবং সম্ভাব্য ঔষধের তালিকা দেবে। অনুগ্রহ করে কমপক্ষে ১০ শব্দের অভিযোগ লিখুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[120px]">
              <Textarea
                id="aiSummaryComplaintText"
                ref={complaintTextAreaRef}
                placeholder="রোগীর সম্পূর্ণ অভিযোগ এখানে বাংলা ভাষায় লিখুন..."
                rows={6}
                className="bg-card flex-1 border-0 shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                aria-label="রোগীর অভিযোগ"
              />
              <MicrophoneButton
                onTranscript={(t) => {
                  // Continuous update (interim results) can be choppy for textareas
                  // Relying on final transcript might be smoother user experience
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
                  {analysisResult.summaryPoints && analysisResult.summaryPoints.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {analysisResult.summaryPoints.map((point, index) => (
                        <li key={`summary-${index}`}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">AI কোনো সারাংশ পয়েন্ট তৈরি করতে পারেনি। অনুগ্রহ করে অভিযোগটি আরও বিস্তারিতভাবে লিখুন।</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="font-headline text-md flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-green-600" />
                    সম্ভাব্য হোমিওপ্যাথিক ঔষধের তালিকা:
                  </CardTitle>
                  <CardDescription className="text-xs text-destructive font-medium">
                    সতর্কীকরণ: এটি শুধুমাত্র AI দ্বারা প্রস্তাবিত একটি তালিকা, চূড়ান্ত প্রেসক্রিপশন নয়। যে কোনো ঔষধ সেবনের পূর্বে অবশ্যই একজন অভিজ্ঞ ও রেজিস্টার্ড চিকিৎসকের পরামর্শ নিন।
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.medicineSuggestions && analysisResult.medicineSuggestions.length > 0 ? (
                    <ul className="list-decimal space-y-1 pl-5 text-sm">
                      {analysisResult.medicineSuggestions.map((suggestion, index) => (
                        <li key={`med-${index}`}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">AI কোনো ঔষধের প্রস্তাব দিতে পারেনি। অভিযোগটি আরও স্পষ্ট করার চেষ্টা করুন।</p>
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
