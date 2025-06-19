
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  onTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  targetFieldDescription?: string;
  className?: string;
  isListeningGlobal: boolean;
  setIsListeningGlobal: (isListening: boolean) => void;
  currentListeningField: string | null;
  setCurrentListeningField: (field: string | null) => void;
  fieldKey: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onTranscript,
  onFinalTranscript,
  targetFieldDescription,
  className,
  isListeningGlobal,
  setIsListeningGlobal,
  currentListeningField,
  setCurrentListeningField,
  fieldKey,
}) => {
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const finalTranscriptBuffer = useRef<string>(""); // Buffer for final transcript parts

  const isCurrentlyListeningForThisField = isListeningGlobal && currentListeningField === fieldKey;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsBrowserSupported(false);
      // Only show toast once if multiple buttons are rendered and API is not supported
      if (!sessionStorage.getItem('voiceSupportToastShown')) {
          const unsupportedMessage = 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। অনুগ্রহ করে Chrome এর মতো একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।';
          toast({
            title: 'ব্রাউজার সাপোর্ট করে না',
            description: unsupportedMessage,
            variant: 'destructive',
            duration: 10000,
          });
          sessionStorage.setItem('voiceSupportToastShown', 'true');
      }
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening even after pauses, good for dictation
    recognition.interimResults = true; // Get results as they come in
    recognition.lang = 'bn-BD'; // Bangla (Bangladesh)

    recognition.onstart = () => {
      setError(null);
      finalTranscriptBuffer.current = ""; // Clear buffer on start
    };

    recognition.onresult = (event) => {
      let interimTranscriptSegment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptBuffer.current += transcriptPart;
        } else {
          interimTranscriptSegment += transcriptPart;
        }
      }

      if (interimTranscriptSegment.trim()) {
        try {
          onTranscript(interimTranscriptSegment); // For live feedback if needed
        } catch (e: any) {
          console.error(`Error in onTranscript callback for field ${fieldKey}:`, e);
        }
      }
    };

    recognition.onend = () => {
      if (currentListeningField === fieldKey) { // Only process if this button was the active one
        if (finalTranscriptBuffer.current.trim()) {
          try {
            onFinalTranscript(finalTranscriptBuffer.current.trim());
          } catch (e: any) { // Corrected line
            console.error(
              `Error in onFinalTranscript callback for field ${fieldKey}:`,
              e
            );
          }
        }
        finalTranscriptBuffer.current = ""; // Clear buffer
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
    };

    recognition.onerror = (event) => {
      let errorMessage = 'একটি অজানা ভয়েস টাইপিং ত্রুটি হয়েছে।';
       switch (event.error) {
        case 'no-speech':
          errorMessage = 'কোনো কথা শোনা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
          break;
        case 'audio-capture':
          errorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে আপনার মাইক্রোফোনের পারমিশন চেক করুন।';
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।';
          break;
        case 'network':
          errorMessage = 'নেটওয়ার্ক সমস্যা। ভয়েস টাইপিংয়ের জন্য ইন্টারনেট সংযোগ প্রয়োজন।';
          break;
        default:
          errorMessage = `একটি ত্রুটি হয়েছে: ${event.error}`;
      }
      setError(errorMessage);
      if (currentListeningField === fieldKey) { // Only show toast if this button caused the error
        toast({
            title: 'ভয়েস টাইপিং ত্রুটি',
            description: errorMessage,
            variant: 'destructive',
            duration: 7000,
        });
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
      finalTranscriptBuffer.current = ""; // Clear buffer on error
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
      }
    };
  }, [toast, onTranscript, onFinalTranscript, fieldKey, currentListeningField, isListeningGlobal, setIsListeningGlobal, setCurrentListeningField]);

  const toggleListening = () => {
    if (!isBrowserSupported) {
      toast({
        title: 'ব্রাউজার সাপোর্ট করে না',
        description: 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই।',
        variant: 'destructive',
      });
      return;
    }
    if (!speechRecognitionRef.current) {
       toast({
        title: 'ভয়েস টাইপিং প্রস্তুত নয়',
        description: error || 'একটি ত্রুটি হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।',
        variant: 'destructive',
      });
      return;
    }

    if (isCurrentlyListeningForThisField) {
      speechRecognitionRef.current.stop(); // onend will handle state changes
    } else {
      if (isListeningGlobal && currentListeningField && currentListeningField !== fieldKey) {
          toast({title: `অন্য ফিল্ড (${targetFieldDescription || currentListeningField}) শুনছে`, description: `একই সময়ে একাধিক ফিল্ডের জন্য ভয়েস ইনপুট চালু করা যাবে না।`, variant: "default"});
          return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          if (speechRecognitionRef.current) {
            setIsListeningGlobal(true);
            setCurrentListeningField(fieldKey);
            finalTranscriptBuffer.current = ""; // Clear buffer before starting a new session
            speechRecognitionRef.current.start();
          }
        })
        .catch(permissionError => {
          let permErrorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি।';
            if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
              permErrorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।';
            } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
              permErrorMessage = 'কোনো মাইক্রোফোন খুঁজে পাওয়া যায়নি।';
            }
            setError(permErrorMessage);
            toast({
              title: 'মাইক্রোফোন সমস্যা',
              description: permErrorMessage,
              variant: 'destructive',
            });
            setIsListeningGlobal(false);
            setCurrentListeningField(null);
        });
    }
  };

  if (!isBrowserSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-full w-auto px-2 text-muted-foreground opacity-50 cursor-not-allowed", className)}
        disabled
        title="ভয়েস টাইপিং এই ব্রাউজারে সাপোর্ট করে না"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleListening}
      className={cn(
        "h-full w-auto px-2 text-primary hover:text-primary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        isCurrentlyListeningForThisField && "text-red-500 hover:text-red-600 animate-pulse",
        error && !isCurrentlyListeningForThisField && "text-yellow-600 hover:text-yellow-700",
        className
      )}
      title={isCurrentlyListeningForThisField ? `${targetFieldDescription || 'এই ফিল্ডের'} জন্য শোনা বন্ধ করুন` : (error ? `ত্রুটি (পুনরায় চেষ্টা করুন)` : `${targetFieldDescription || 'এই ফিল্ডের'} জন্য ভয়েস টাইপিং শুরু করুন`)}
      aria-label={isCurrentlyListeningForThisField ? "Stop voice input" : "Start voice input"}
    >
      {isCurrentlyListeningForThisField ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : error && !isCurrentlyListeningForThisField && !isListeningGlobal ? ( // Show error only if not globally listening for another field
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
