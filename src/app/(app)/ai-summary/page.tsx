
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Loader2, Sparkles, MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeComplaints, type ComplaintSummaryInput, type ComplaintSummaryOutput } from '@/ai/flows/complaint-summary-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const summaryFormSchema = z.object({
  complaintText: z.string().min(10, "Please enter at least 10 characters for complaints.").max(2000, "Complaint text is too long."),
});
type SummaryFormValues = z.infer<typeof summaryFormSchema>;

export default function AiSummaryPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summaryFormSchema),
    defaultValues: {
      complaintText: '',
    },
  });

  const onSubmit: SubmitHandler<SummaryFormValues> = async (data) => {
    setIsLoading(true);
    setSummary(null);
    try {
      const input: ComplaintSummaryInput = { complaintText: data.complaintText };
      const result: ComplaintSummaryOutput = await summarizeComplaints(input);
      setSummary(result.summary);
      toast({
        title: 'Summary Generated',
        description: 'AI has summarized the complaints.',
      });
    } catch (error: any) {
      console.error('Error generating summary (raw error object):', error);
      let description = 'Failed to generate summary. Please try again.';
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
        title: 'AI Error',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="AI Complaint Summarizer"
        description="Enter detailed patient complaints to get a concise AI-generated summary."
        actions={<MessageSquareText className="h-8 w-8 text-primary" />}
      />
      <Card className="shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Enter Complaints</CardTitle>
              <CardDescription>Provide the full complaint text below. The AI will process it.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="complaintText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="complaintText-ai">Patient's Full Complaints</FormLabel>
                     <div className="flex items-start w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[120px]">
                        <FormControl>
                          <Textarea
                            id="complaintText-ai"
                            placeholder="Describe all symptoms, duration, intensity, related history etc..."
                            rows={6}
                            {...field}
                            className="h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 py-2 text-base placeholder-muted-foreground resize-y"
                          />
                        </FormControl>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Summary
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {summary && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              AI Generated Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-primary/10 border-primary/30">
              <MessageSquareText className="h-4 w-4 !text-primary" />
              <AlertTitle className="font-headline text-primary">Summary</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap text-foreground">
                {summary}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
