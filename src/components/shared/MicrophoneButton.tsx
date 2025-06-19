
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  onTranscript: (transcript: string) => void; // For interim results
  onFinalTranscript: (transcript: string) => void; // For final result of a speech segment
  targetFieldDescription?: string;
  className?: string;
  isListeningGlobal: boolean; // From parent, indicates if *any* mic is active
  setIsListeningGlobal: (isListening: boolean) => void; // To update parent's global state
  currentListeningField: string | null; // From parent, key of the field currently listened by global mic
  setCurrentListeningField: (field: string | null) => void; // To update parent
  fieldKey: string; // Unique key for this button's target field
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
  const finalTranscriptBuffer = useRef<string>(""); // Buffer for accumulating final results

  // Check if this specific button is the one currently active
  const isCurrentlyListeningForThisField = isListeningGlobal && currentListeningField === fieldKey;

  // Memoize callbacks to stabilize dependencies in useEffect
  const stableOnTranscript = useCallback(onTranscript, [onTranscript]);
  const stableOnFinalTranscript = useCallback(onFinalTranscript, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsBrowserSupported(false);
      if (!sessionStorage.getItem('voiceSupportToastShownInline')) {
          const unsupportedMessage = 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। Chrome ব্যবহার করুন।';
          toast({
            title: 'ব্রাউজার সাপোর্ট করে না',
            description: unsupportedMessage,
            variant: 'destructive',
            duration: 10000,
          });
          sessionStorage.setItem('voiceSupportToastShownInline', 'true');
      }
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Allows for longer speech, manually stopped
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      setError(null);
      finalTranscriptBuffer.current = ""; // Clear buffer on start
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptBuffer.current += transcriptPart.trim() + " "; // Accumulate final parts
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      if (interimTranscript.trim() && isListeningGlobal && currentListeningField === fieldKey) {
        try {
          stableOnTranscript(interimTranscript);
        } catch (e: any) {
          console.error(`Error in onTranscript callback for field ${fieldKey}:`, e);
        }
      }
    };

    recognition.onend = () => {
      if (isListeningGlobal && currentListeningField === fieldKey) { // Process only if this instance was active
        if (finalTranscriptBuffer.current.trim()) {
          try {
            stableOnFinalTranscript(finalTranscriptBuffer.current.trim()); 
          } catch (e: any) {
            console.error(`Error in onFinalTranscript callback for field ${fieldKey}:`, e);
          }
        }
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
      finalTranscriptBuffer.current = ""; // Always clear buffer on end
    };

    recognition.onerror = (event) => {
      let errorMessage = 'একটি অজানা ভয়েস টাইপিং ত্রুটি হয়েছে।';
       switch (event.error) {
        case 'no-speech': errorMessage = 'কোনো কথা শোনা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'; break;
        case 'audio-capture': errorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে আপনার মাইক্রোফোনের পারমিশন চেক করুন।'; break;
        case 'not-allowed': case 'service-not-allowed': errorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।'; break;
        case 'network': errorMessage = 'নেটওয়ার্ক সমস্যা। ভয়েস টাইপিংয়ের জন্য ইন্টারনেট সংযোগ প্রয়োজন।'; break;
        default: errorMessage = `একটি ত্রুটি হয়েছে: ${event.error}`;
      }
      setError(errorMessage);
      
      if (isListeningGlobal && currentListeningField === fieldKey) { // Report error only if this instance was active
        toast({
            title: 'ভয়েস টাইপিং ত্রুটি',
            description: errorMessage,
            variant: 'destructive',
            duration: 7000,
        });
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
      finalTranscriptBuffer.current = "";
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current = null;
      }
    };
  // stableOnTranscript and stableOnFinalTranscript are now stable
  }, [toast, stableOnTranscript, stableOnFinalTranscript, fieldKey, setIsListeningGlobal, setCurrentListeningField, isListeningGlobal, currentListeningField]);


  const toggleListening = async () => {
    if (!isBrowserSupported) {
      toast({ title: 'ব্রাউজার সাপোর্ট করে না', description: 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই।', variant: 'destructive' });
      return;
    }
    if (!speechRecognitionRef.current) {
       toast({ title: 'ভয়েস টাইপিং প্রস্তুত নয়', description: error || 'একটি ত্রুটি হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।', variant: 'destructive' });
      return;
    }

    if (isCurrentlyListeningForThisField) {
      speechRecognitionRef.current.stop(); // This will trigger onend, which resets global state
    } else {
      // Check if another field (or global mic) is already listening
      if (isListeningGlobal && currentListeningField && currentListeningField !== fieldKey) {
          const otherFieldDesc = currentListeningField === 'FloatingVoiceInputActive' // Assuming FloatingVoiceInput uses this key
            ? 'ফ্লোটিং ইনপুট (কন্ট্রোল কী)' 
            : `অন্য একটি ফিল্ড (${targetFieldDescription || currentListeningField})`;
          toast({title: `${otherFieldDesc} শুনছে`, description: `একই সময়ে একাধিক ফিল্ডের জন্য ভয়েস ইনপুট চালু করা যাবে না।`, variant: "default"});
          return;
      }
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Check permission
        if (speechRecognitionRef.current) {
            setIsListeningGlobal(true);
            setCurrentListeningField(fieldKey);
            finalTranscriptBuffer.current = ""; // Clear buffer before starting
            speechRecognitionRef.current.start();
            setError(null); // Clear previous errors
        }
      } catch (permissionError: any) {
        let permErrorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি।';
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
            permErrorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।';
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
            permErrorMessage = 'কোনো মাইক্রোফোন খুঁজে পাওয়া যায়নি।';
        }
        setError(permErrorMessage);
        toast({ title: 'মাইক্রোফোন সমস্যা', description: permErrorMessage, variant: 'destructive' });
        // Ensure global state is reset if start fails
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
    }
  };

  if (!isBrowserSupported) {
    return (
      <Button type="button" variant="ghost" size="icon" className={cn("h-full w-auto px-2 text-muted-foreground opacity-50 cursor-not-allowed", className)} disabled title="ভয়েস টাইপিং এই ব্রাউজারে সাপোর্ট করে না">
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
      title={isCurrentlyListeningForThisField ? `${targetFieldDescription || 'এই ফিল্ডের'} জন্য শোনা বন্ধ করুন` : (error && !isCurrentlyListeningForThisField ? `ত্রুটি (পুনরায় চেষ্টা করুন)` : `${targetFieldDescription || 'এই ফিল্ডের'} জন্য ভয়েস টাইপিং শুরু করুন`)}
      aria-label={isCurrentlyListeningForThisField ? "Stop voice input for this field" : "Start voice input for this field"}
    >
      {isCurrentlyListeningForThisField ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : error && !isCurrentlyListeningForThisField ? ( 
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
    
