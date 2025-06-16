
'use client';
import React, { useState }from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle } from 'lucide-react'; // Using Mic
import { cn } from '@/lib/utils';
import { banglaVoiceTyping, type BanglaVoiceOutput } from '@/ai/flows/bangla-voice-typing';
import { useToast } from '@/hooks/use-toast';

interface MicrophoneButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  onTranscription: (text: string) => void;
  targetInputId: string; // ID of the input/textarea field to get text from and update
  language?: string; // Currently not used by the Genkit flow but kept for potential future use
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  className,
  onTranscription,
  targetInputId,
  language = 'bn-BD', // Default to Bangla
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCorrectText = async () => {
    const inputElement = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!inputElement || !inputElement.value.trim()) {
      toast({
        title: "খালি ইনপুট",
        description: "অনুগ্রহ করে পরিমার্জন করার জন্য কিছু টেক্সট লিখুন।",
        variant: "default",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result: BanglaVoiceOutput = await banglaVoiceTyping({ voiceInput: inputElement.value });
      onTranscription(result.correctedText);
      toast({
        title: "টেক্সট পরিমার্জিত",
        description: "আপনার টেক্সট সফলভাবে পরিমার্জন করা হয়েছে।",
      });
    } catch (error: any) {
      console.error("Error correcting text with AI:", error);
      toast({
        title: "পরিমার্জনে ত্রুটি",
        description: `টেক্সট পরিমার্জন করার সময় একটি সমস্যা হয়েছে: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "relative text-primary hover:bg-primary/10",
        isProcessing && "text-muted-foreground cursor-not-allowed",
        className,
      )}
      onClick={handleCorrectText}
      disabled={isProcessing}
      aria-label="টেক্সট পরিমার্জন করুন"
      title="বর্তমান টেক্সট AI দ্বারা পরিমার্জন করুন"
      {...props}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};
