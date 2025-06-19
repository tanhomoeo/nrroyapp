
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
  const finalTranscriptBuffer = useRef<string>(""); // Buffer for accumulating final transcript parts

  const isCurrentlyListeningForThisField = isListeningGlobal && currentListeningField === fieldKey;

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
    recognition.continuous = true; // Continuous for field dictation
    recognition.interimResults = true; // Allow interim results
    recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      setError(null);
      finalTranscriptBuffer.current = ""; // Clear buffer on new start
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscriptSegment = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptSegment += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      if (interimTranscript.trim()) {
        try {
          onTranscript(interimTranscript);
        } catch (e: any) {
          console.error(`Error in onTranscript callback for field ${fieldKey}:`, e);
        }
      }
      if (finalTranscriptSegment.trim()) {
        finalTranscriptBuffer.current += finalTranscriptSegment + " "; // Accumulate final parts
      }
    };

    recognition.onend = () => {
      if (currentListeningField === fieldKey) { // Ensure this onEnd is for the current field
        if (finalTranscriptBuffer.current.trim()) {
          try {
            // Send the entire accumulated final transcript
            onFinalTranscript(finalTranscriptBuffer.current.trim()); 
          } catch (e: any) {
            console.error(`Error in onFinalTranscript callback for field ${fieldKey}:`, e);
          }
        }
        finalTranscriptBuffer.current = ""; // Clear buffer after sending
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
      if (currentListeningField === fieldKey) { // Only show toast if error is for this field
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
        speechRecognitionRef.current.stop(); // Gracefully stop
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
      }
    };
  // Dependencies are crucial for re-initializing recognition if props change
  }, [toast, onTranscript, onFinalTranscript, fieldKey, currentListeningField, setIsListeningGlobal, setCurrentListeningField]);


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
      speechRecognitionRef.current.stop(); // Will trigger onend
    } else {
      // Check if another field or the global floating input is listening
      if (isListeningGlobal && currentListeningField && currentListeningField !== fieldKey) {
          const otherFieldDesc = currentListeningField === 'FloatingVoiceInputActive' ? 'ফ্লোটিং ইনপুট' : `অন্য একটি ফিল্ড (${currentListeningField})`;
          toast({title: `${otherFieldDesc} শুনছে`, description: `একই সময়ে একাধিক ফিল্ডের জন্য ভয়েস ইনপুট চালু করা যাবে না।`, variant: "default"});
          return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          if (speechRecognitionRef.current) {
            setIsListeningGlobal(true);
            setCurrentListeningField(fieldKey);
            finalTranscriptBuffer.current = ""; // Clear buffer before new start
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
        error && !isCurrentlyListeningForThisField && !isListeningGlobal && "text-yellow-600 hover:text-yellow-700", // Show error color only if not listening for THIS field and no GLOBAL listening
        className
      )}
      title={isCurrentlyListeningForThisField ? `${targetFieldDescription || 'এই ফিল্ডের'} জন্য শোনা বন্ধ করুন` : (error && !isListeningGlobal ? `ত্রুটি (পুনরায় চেষ্টা করুন)` : `${targetFieldDescription || 'এই ফিল্ডের'} জন্য ভয়েস টাইপিং শুরু করুন`)}
      aria-label={isCurrentlyListeningForThisField ? "Stop voice input" : "Start voice input"}
    >
      {isCurrentlyListeningForThisField ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : error && !isListeningGlobal && !isCurrentlyListeningForThisField ? ( // Show error icon only if no field is globally listening and this one isn't either
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
    
