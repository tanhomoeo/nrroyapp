
'use client';
import React from 'react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareText, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function AiSummaryPage() {
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
            <Textarea
              placeholder="রোগীর সম্পূর্ণ অভিযোগ এখানে লিখুন..."
              rows={6}
              disabled
              className="bg-muted/50"
            />
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
