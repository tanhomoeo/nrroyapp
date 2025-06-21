
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { appendFinalTranscript } from '@/lib/utils';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const FloatingVoiceInput: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [listeningMode, setListeningMode] = useState<'click' | 'keyboard' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const activeElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const { toast } = useToast();

  const insertTextIntoActiveElement = useCallback((textToInsert: string) => {
    const element = activeElementRef.current || document.activeElement;
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && textToInsert) {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value;
      const newText = appendFinalTranscript(currentValue, textToInsert);

      // Directly setting value and dispatching events for React compatibility
      const originalValueSetter = Object.getOwnPropertyDescriptor(inputElement.constructor.prototype, 'value')?.set;
      originalValueSetter?.call(inputElement, newText);
      
      const newCursorPosition = newText.length; // Set cursor to end
      inputElement.selectionStart = newCursorPosition;
      inputElement.selectionEnd = newCursorPosition;

      const eventOptions = { bubbles: true, cancelable: true };
      inputElement.dispatchEvent(new Event('input', eventOptions));
      inputElement.dispatchEvent(new Event('change', eventOptions));
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
    }
    // onend will handle setIsListening(false) and final transcript insertion
  }, [isListening]);

  const startRecognition = useCallback(async (mode: 'click' | 'keyboard') => {
    if (isListening) { // Already listening, probably a bug or race condition
        console.warn("startRecognition called while already listening. Mode:", mode, "Current Listening Mode:", listeningMode);
        if(mode !== listeningMode) { // if modes are different, stop current and attempt to restart with new mode.
             stopRecognition(); // This will eventually set isListening to false via onend
        } else {
            return; // if same mode, do nothing.
        }
    }

    if (!speechRecognitionRef.current || !isBrowserSupported) {
      toast({ title: 'ভয়েস রিকগনিশন প্রস্তুত নয়', description: 'অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।', variant: 'destructive' });
      return;
    }

    activeElementRef.current = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement
      ? document.activeElement
      : null;

    if (!activeElementRef.current) {
      toast({
        title: 'ইনপুট ফিল্ড নির্বাচন করুন',
        description: 'ভয়েস টাইপিং শুরু করার আগে একটি টেক্সট ফিল্ডে ক্লিক করুন।',
        variant: 'default'
      });
      return;
    }
    
    finalTranscriptRef.current = ""; // Clear buffer before starting

    try {
      // Check for microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted or already granted
      speechRecognitionRef.current.start();
      setIsListening(true);
      setListeningMode(mode);
      setError(null);
    } catch (permissionError: any) {
      let permErrorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি।';
      if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
        permErrorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।';
      } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
        permErrorMessage = 'কোনো মাইক্রোফোন খুঁজে পাওয়া যায়নি।';
      }
      setError(permErrorMessage);
      toast({ title: 'মাইক্রোফোন সমস্যা', description: permErrorMessage, variant: 'destructive' });
      setIsListening(false);
      setListeningMode(null);
    }
  }, [isBrowserSupported, toast, isListening, listeningMode, stopRecognition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsBrowserSupported(false);
      // Avoid repeated toasts if already shown
      if (!sessionStorage.getItem('voiceSupportToastShown')) {
          const unsupportedMessage = 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। অনুগ্রহ করে Chrome এর মতো একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।';
          setError(unsupportedMessage);
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
    recognition.continuous = true; // Keep true to allow longer speech, stop manually
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      // State update is handled by startRecognition
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptPart.trim() + " "; // Accumulate final parts
        } else {
          interimTranscript += transcriptPart;
        }
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'একটি অজানা ভয়েস টাইপিং ত্রুটি হয়েছে।';
      switch (event.error) {
        case 'no-speech': errorMessage = 'কোনো কথা শোনা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'; break;
        case 'audio-capture': errorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে আপনার মাইক্রোফোনের পারমিশন চেক করুন।'; break;
        case 'not-allowed': case 'service-not-allowed': errorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।'; break;
        case 'network': errorMessage = 'নেটওয়ার্ক সমস্যা। ভয়েস টাইপিংয়ের জন্য ইন্টারনেট সংযোগ প্রয়োজন।'; break;
        default: errorMessage = `একটি ত্রুটি হয়েছে: ${event.error}`;
      }
      setError(errorMessage);
      toast({ title: 'ভয়েস টাইপিং ত্রুটি', description: errorMessage, variant: 'destructive', duration: 7000 });
      
      // Ensure listening state is reset
      setIsListening(false);
      setListeningMode(null);
      finalTranscriptRef.current = "";
    };

    recognition.onend = () => {
      if (finalTranscriptRef.current.trim()) {
        insertTextIntoActiveElement(finalTranscriptRef.current.trim());
      }
      setIsListening(false);
      setListeningMode(null);
      finalTranscriptRef.current = "";
    };

    speechRecognitionRef.current = recognition;

    // Cleanup function
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort(); // Stop recognition if component unmounts
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current = null;
      }
    };
  }, [toast, insertTextIntoActiveElement]);

  const handleButtonClick = () => {
    if (!isBrowserSupported) return;
    if (isListening && listeningMode === 'click') {
      stopRecognition();
    } else if (isListening && listeningMode === 'keyboard') {
      // If keyboard listening is active, button click should stop it.
      stopRecognition();
    } else {
      startRecognition('click');
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control' && !event.repeat && !isListening) {
        startRecognition('keyboard');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' && isListening && listeningMode === 'keyboard') {
        stopRecognition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Ensure recognition is stopped if component unmounts while keyboard listening
      if (listeningMode === 'keyboard' && speechRecognitionRef.current) { 
          speechRecognitionRef.current.abort();
      }
    };
  }, [isListening, listeningMode, startRecognition, stopRecognition]); 


  if (!isBrowserSupported) {
    return null; 
  }

  const buttonTitle = isListening 
    ? (listeningMode === 'click' ? "শোনা বন্ধ করতে ক্লিক করুন" : "Control কী ছাড়ুন...")
    : (error ? `ত্রুটি: ${error} (পুনরায় চেষ্টা করতে ক্লিক করুন)` : "বাংলায় ভয়েস টাইপিং শুরু করতে ক্লিক করুন (অথবা Control কী ধরে রাখুন)");

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleButtonClick}
      className={cn(
        "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl bg-background hover:bg-muted text-primary border-2 border-primary",
        "transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95",
        isListening && "bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse",
        error && !isListening && "bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500"
      )}
      title={buttonTitle}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? (
        <Loader2 className="h-7 w-7 animate-spin" />
      ) : error && !isListening ? ( 
        <AlertCircle className="h-7 w-7" />
      ) : (
        <Keyboard className="h-6 w-6" /> 
      )}
    </Button>
  );
};
