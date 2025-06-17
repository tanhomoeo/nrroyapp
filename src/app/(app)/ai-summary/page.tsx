
'use client';
import React, { useState, useRef } from 'react'; // Added useState, useRef
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareText, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton'; // Added

// Helper for appending final transcript (can be moved to a util if used in many places)
const appendFinalTranscript = (currentValue: string | undefined, transcript: string): string => {
  let textToSet = currentValue || "";
  if (textToSet.length > 0 && !textToSet.endsWith(" ") && !textToSet.endsWith("\n")) {
     textToSet += " ";
  }
  textToSet += transcript + " ";
  return textToSet;
};


export default function AiSummaryPage() {
  const [complaintText, setComplaintText] = useState(''); // Added state for textarea
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="AI Complaint Summarizer"
        description="AI-powered complaint summarization feature."
        actions={<MessageSquareText className="h-8 w-8 text-primary" />}
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center">
            <Construction className="mr-3 h-6 w-6 text-amber-500" />
            এই ফিচারটি শীঘ্রই আসছে!
          </CardTitle>
          <CardDescription>
            আমরা বর্তমানে AI দ্বারা অভিযোগ সারাংশ করার মডিউলটির আরও উন্নয়নে কাজ করছি। এই কার্যকারিতা সাময়িকভাবে অনুপলব্ধ।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[120px]">
                <Textarea
                  id="aiSummaryComplaintText"
                  placeholder="রোগীর সম্পূর্ণ অভিযোগ এখানে লিখুন..."
                  rows={6}
                  disabled // Feature is disabled
                  className="bg-muted/50 flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
                  value={complaintText} // Controlled component
                  onChange={(e) => setComplaintText(e.target.value)} // Allow manual typing if needed
                />
                <MicrophoneButton
                    onTranscript={(t) => setComplaintText(prev => prev + t)}
                    onFinalTranscript={(t) => setComplaintText(prev => appendFinalTranscript(prev, t))}
                    targetFieldDescription="রোগীর অভিযোগ"
                    fieldKey="aiSummaryComplaintText"
                    isListeningGlobal={isListeningGlobal}
                    setIsListeningGlobal={setIsListeningGlobal}
                    currentListeningField={currentListeningField}
                    setCurrentListeningField={setCurrentListeningField}
                    className="self-start mt-1 mr-1" // Adjusted margin
                    // disabled={true} // Match textarea disabled state if strictly needed, but usually mic can still work
                />
            </div>
            <div className="flex justify-end">
              <Button disabled className="min-w-[150px]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                সারাংশ তৈরি করুন (বন্ধ আছে)
              </Button>
            </div>
          </div>
          <div className="p-6 mt-6 text-center bg-muted/50 rounded-lg">
            <Construction className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              AI সারাংশ ফিচারটি উন্নত করে শীঘ্রই আবার উপলব্ধ করা হবে। আমাদের সাথে থাকার জন্য ধন্যবাদ!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
