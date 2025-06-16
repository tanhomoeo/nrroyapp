
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { banglaVoiceTyping, type BanglaVoiceTypingInput } from '@/ai/flows/bangla-voice-typing';

interface MicrophoneButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  onTranscription: (text: string) => void;
  targetInputId?: string;
  language?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onTranscription,
  targetInputId,
  language = 'bn-BD',
  className,
  ...props
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For AI processing
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const accumulatedFinalTranscriptRef = useRef<string>('');
  const initialFieldValueRef = useRef<string>(''); // To store text before this voice session

  const cleanupStreamAndRecognition = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupStreamAndRecognition();
    };
  }, []);

  const startRecognition = async () => {
    if (isLoading || isRecording) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({
        title: 'কণ্ঠস্বর ইনপুট অনুপলব্ধ',
        description: 'আপনার ব্রাউজারে স্পিচ রিকগনিশন API উপলব্ধ নেই।',
        variant: 'destructive',
      });
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: 'ত্রুটি',
        description: 'মিডিয়া ডিভাইস API সমর্থিত নয়।',
        variant: 'destructive',
      });
      return;
    }

    if (targetInputId) {
      const targetInput = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
      if (targetInput) {
        initialFieldValueRef.current = targetInput.value;
        if (initialFieldValueRef.current.length > 0 && !initialFieldValueRef.current.endsWith(' ')) {
          initialFieldValueRef.current += ' ';
        }
      } else {
        initialFieldValueRef.current = '';
      }
    } else {
      initialFieldValueRef.current = '';
    }

    accumulatedFinalTranscriptRef.current = '';
    setIsRecording(true);
    setIsLoading(false);

    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;

      recognition.lang = language;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let currentFinalTranscriptSegment = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalTranscriptSegment += event.results[i][0].transcript.trim() + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (currentFinalTranscriptSegment) {
            accumulatedFinalTranscriptRef.current += currentFinalTranscriptSegment;
        }

        if (targetInputId) {
          const targetInput = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
          if (targetInput) {
            targetInput.value = initialFieldValueRef.current + accumulatedFinalTranscriptRef.current + interimTranscript;
          }
        }
      };

      recognition.onend = () => {
        cleanupStreamAndRecognition();
        if (isRecording) {
            stopRecognitionAndProcess(true);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        let description = `অডিও প্রতিলিপি করা যায়নি: ${event.error}।`;
        if (event.error === 'no-speech') description = 'কোনো কথা শনাক্ত করা যায়নি।';
        else if (event.error === 'audio-capture') description = 'অডিও ক্যাপচার ব্যর্থ হয়েছে।';
        else if (event.error === 'not-allowed') description = 'মাইক্রোফোন অনুমতি প্রত্যাখ্যাত হয়েছে।';
        else if (event.error === 'network') description = 'স্পিচ সার্ভিসের সাথে নেটওয়ার্ক সমস্যা। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।';

        toast({ title: 'প্রতিলিপি ত্রুটি', description, variant: 'destructive' });

        cleanupStreamAndRecognition();
        setIsRecording(false);
        setIsLoading(false);
        initialFieldValueRef.current = '';
        accumulatedFinalTranscriptRef.current = '';
      };

      recognition.start();
      toast({ title: 'এখন কথা বলুন...', description: 'আপনার কথা শোনা হচ্ছে...', duration: 3000 });

    } catch (err: any) {
      console.error('Error starting recognition:', err);
      let description = 'রেকর্ডিং শুরু করা যায়নি।';
      if (err.name === 'NotAllowedError') description = 'মাইক্রোফোন অনুমতি প্রত্যাখ্যাত হয়েছে।';
      else if (err.name === 'NotFoundError') description = 'কোনো মাইক্রোফোন পাওয়া যায়নি।';

      toast({ title: 'রেকর্ডিং ত্রুটি', description, variant: 'destructive' });

      cleanupStreamAndRecognition();
      setIsRecording(false);
      setIsLoading(false);
      initialFieldValueRef.current = '';
    }
  };

  const stopRecognitionAndProcess = async (autoStopped = false) => {
    if (recognitionRef.current && isRecording && !autoStopped) {
      recognitionRef.current.stop();
    }
    if (!autoStopped) setIsRecording(false);

    const finalUtteranceToProcess = accumulatedFinalTranscriptRef.current.trim();

    if (autoStopped && isRecording) setIsRecording(false);


    if (finalUtteranceToProcess) {
      setIsLoading(true);
      toast({ title: 'প্রসেসিং চলছে...', description: 'আপনার অডিও প্রসেস করা হচ্ছে।', duration: 2000 });
      try {
        const aiInput: BanglaVoiceTypingInput = { voiceInput: finalUtteranceToProcess };
        const result = await banglaVoiceTyping(aiInput);

        const fullCorrectedText = initialFieldValueRef.current + result.correctedText;
        onTranscription(fullCorrectedText.trim());

        toast({ title: 'প্রতিলিপি সফল', description: 'AI সংশোধন সহ টেক্সট প্রবেশ করানো হয়েছে।', duration: 3000 });
      } catch (aiError: any) {
        console.error('AI processing error (raw error object):', aiError);
        let errorDescription = 'AI দ্বারা পাঠ্য সংশোধন করতে ব্যর্থ হয়েছে। কাঁচা প্রতিলিপি ব্যবহার করা হচ্ছে।';
        if (aiError instanceof Error) {
            errorDescription = aiError.message;
        } else if (typeof aiError === 'string') {
            errorDescription = aiError;
        } else if (aiError && typeof aiError.toString === 'function') {
            const errorString = aiError.toString();
            if (!errorString.toLowerCase().includes('<html') && !errorString.toLowerCase().includes('<!doctype')) {
                errorDescription = errorString;
            } else {
                 errorDescription = "Server returned an unexpected response to AI. Using raw transcript. Check console.";
            }
        }
        toast({
          title: 'AI প্রসেসিং ত্রুটি',
          description: errorDescription,
          variant: 'default',
          duration: 4000,
        });
        const fullRawText = initialFieldValueRef.current + finalUtteranceToProcess;
        onTranscription(fullRawText.trim());
      } finally {
        setIsLoading(false);
        accumulatedFinalTranscriptRef.current = '';
        initialFieldValueRef.current = '';
        if (targetInputId) {
          const targetInput = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
          targetInput?.focus();
        }
      }
    } else {
      setIsLoading(false);
      accumulatedFinalTranscriptRef.current = '';
      if (initialFieldValueRef.current.trim() && !finalUtteranceToProcess) {
          onTranscription(initialFieldValueRef.current.trim());
      }
      initialFieldValueRef.current = '';
       if (targetInputId) {
          const targetInput = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
          targetInput?.focus();
        }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecognitionAndProcess();
    } else {
      if (recognitionRef.current) {
          cleanupStreamAndRecognition();
      }
      startRecognition();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleRecording}
      disabled={isLoading}
      className={cn(
        "relative",
        className,
        (isRecording && !isLoading) ? 'text-destructive border-destructive hover:bg-destructive/10 animate-pulse' : 'text-muted-foreground hover:text-primary',
        isLoading ? 'cursor-not-allowed opacity-70' : ''
      )}
      aria-label={isRecording ? "রেকর্ডিং বন্ধ করুন" : "ভয়েস টাইপিং শুরু করুন"}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <StopCircle className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};
