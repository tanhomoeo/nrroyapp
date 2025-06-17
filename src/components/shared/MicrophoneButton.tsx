
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

  const isCurrentlyListeningForThisField = isListeningGlobal && currentListeningField === fieldKey;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsBrowserSupported(false);
      // Show toast only once, e.g., for the first mic button mounted or based on a global flag.
      // This example simplifies by potentially showing it per instance if no global flag exists.
      if (currentListeningField === null && !isListeningGlobal) { // Attempt to show only once
          const unsupportedMessage = 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। অনুগ্রহ করে Chrome এর মতো একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।';
          toast({
            title: 'ব্রাউজার সাপোর্ট করে না',
            description: unsupportedMessage,
            variant: 'destructive',
            duration: 10000,
          });
      }
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Listen for longer periods, less likely to stop on short pauses
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscriptSegment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptSegment += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (interimTranscript.trim()) {
        onTranscript(interimTranscript);
      }
      if (finalTranscriptSegment.trim()) {
        onFinalTranscript(finalTranscriptSegment.trim());
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
      toast({
        title: 'ভয়েস টাইপিং ত্রুটি',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
      if (currentListeningField === fieldKey) {
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
    };

    recognition.onend = () => {
      // It might stop itself if continuous is true but speech ends for a while.
      // We only forcefully change global state if this specific instance was supposed to be listening.
      if (currentListeningField === fieldKey && speechRecognitionRef.current) {
         // If it ended but was supposed to be listening for this field,
         // it might be an unexpected stop, so reset.
         // However, `recognition.stop()` also triggers onend.
         // We need to differentiate. If `isCurrentlyListeningForThisField` is still true,
         // it means `recognition.stop()` wasn't called by our toggle.
         if(isListeningGlobal){ 
            // This case might indicate an unexpected stop by the browser.
            // Allow restarting by user.
         }
      }
      // Always ensure global state is reset if this button *was* the active one.
      if (currentListeningField === fieldKey) {
        setIsListeningGlobal(false);
        setCurrentListeningField(null);
      }
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop(); // Ensure it stops cleanly
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
      }
    };
  }, [toast, onTranscript, onFinalTranscript, fieldKey, currentListeningField, isListeningGlobal, setIsListeningGlobal, setCurrentListeningField]); // Removed targetFieldDescription from deps as it's for UI

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
      speechRecognitionRef.current.stop();
      // onend will update global state
    } else {
      // If another field is listening, stop it first.
      if (isListeningGlobal && currentListeningField && currentListeningField !== fieldKey) {
          // This scenario is tricky with current design where each button has its own recognition instance.
          // A truly global stop would require a central manager for the SpeechRecognition instance.
          // For now, we'll rely on the user clicking the active one to stop it, or starting a new one
          // might implicitly stop the old one if the browser enforces single active recognition.
          // Or, we could just toast a message.
          toast({title: "সতর্কতা", description: `অন্য একটি ফিল্ড (${currentListeningField}) বর্তমানে শুনছে। প্রথমে সেটি বন্ধ করুন।`, variant: "default"});
          // To be more robust, one could try to signal the other button to stop.
          // For now, let's allow this new one to start, browsers usually handle one active session.
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          if (speechRecognitionRef.current) {
            setIsListeningGlobal(true);
            setCurrentListeningField(fieldKey);
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
        "h-full w-auto px-2 text-primary hover:text-primary/80",
        isCurrentlyListeningForThisField && "text-red-500 hover:text-red-600 animate-pulse",
        error && !isCurrentlyListeningForThisField && "text-yellow-600 hover:text-yellow-700",
        className
      )}
      title={isCurrentlyListeningForThisField ? `${targetFieldDescription}-এর জন্য শোনা বন্ধ করুন` : (error ? `ত্রুটি (পুনরায় চেষ্টা করুন)` : `${targetFieldDescription}-এর জন্য ভয়েস টাইপিং শুরু করুন`)}
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
