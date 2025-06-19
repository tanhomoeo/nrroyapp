
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const FloatingVoiceInput: React.FC = () => {
  const [isListeningByClick, setIsListeningByClick] = useState(false);
  const [isListeningByKeyboard, setIsListeningByKeyboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const activeElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { toast } = useToast();

  const isActuallyListening = isListeningByClick || isListeningByKeyboard;

  const insertTextIntoActiveElement = useCallback((textToInsert: string) => {
    const element = activeElementRef.current || document.activeElement;
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      let textToSet = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
      
      // Add a space if the inserted text doesn't end with one and there's content before it
      if (textToInsert.trim().length > 0 && !textToInsert.endsWith(" ") && start > 0 && !currentValue.substring(start -1, start).match(/\s$/) ) {
         textToSet = currentValue.substring(0, start) + " " + textToInsert + currentValue.substring(end);
      } else if (textToInsert.trim().length > 0 && !textToInsert.endsWith(" ")) {
         textToSet = currentValue.substring(0, start) + textToInsert + " " + currentValue.substring(end);
      }


      const originalValueSetter = Object.getOwnPropertyDescriptor(inputElement.constructor.prototype, 'value')?.set;
      originalValueSetter?.call(inputElement, textToSet);

      const newCursorPosition = start + textToInsert.length + (textToSet.endsWith(" ") && textToInsert.trim().length > 0 ? 1 : 0);
      inputElement.selectionStart = newCursorPosition;
      inputElement.selectionEnd = newCursorPosition;
      // inputElement.focus(); // Keep commented to avoid stealing focus if user types

      const eventOptions = { bubbles: true, cancelable: true };
      inputElement.dispatchEvent(new Event('input', eventOptions));
      inputElement.dispatchEvent(new Event('change', eventOptions));
    } else if (isActuallyListening) {
      toast({
        title: 'কোনো ইনপুট ফিল্ড ফোকাস করা নেই',
        description: 'ভয়েস টাইপিং ব্যবহার করার জন্য একটি টেক্সটবক্স বা ইনপুট ফিল্ডে ক্লিক করুন।',
        variant: 'default',
        duration: 5000,
      });
    }
  }, [toast, isActuallyListening]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsBrowserSupported(false);
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
    recognition.continuous = true; // Keep continuous true for push-to-talk like behavior
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscriptSegment = '';
      let interimTranscriptSegment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptSegment += transcriptPart;
        } else {
          interimTranscriptSegment += transcriptPart;
        }
      }
      // For push-to-talk, we primarily care about the final transcript upon release,
      // but interim can be used if desired for live feedback.
      // For now, let's focus on accumulating final results and inserting on keyup/stop.
      // For click mode, we can insert interim results.
      if (isListeningByClick && interimTranscriptSegment.trim()) {
        insertTextIntoActiveElement(interimTranscriptSegment);
      } else if (finalTranscriptSegment.trim()){
        insertTextIntoActiveElement(finalTranscriptSegment); // Insert final segment for keyboard mode or click mode final
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
      setIsListeningByClick(false);
      setIsListeningByKeyboard(false);
    };

    recognition.onend = () => {
      setIsListeningByClick(false);
      setIsListeningByKeyboard(false); // Ensure keyboard listening also stops
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
  }, [toast, insertTextIntoActiveElement]);

  const startRecognition = useCallback(() => {
    if (!speechRecognitionRef.current || !isBrowserSupported) return;
    
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

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        if (speechRecognitionRef.current) {
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
        toast({ title: 'মাইক্রোফোন সমস্যা', description: permErrorMessage, variant: 'destructive' });
        setIsListeningByClick(false);
        setIsListeningByKeyboard(false);
      });
  }, [isBrowserSupported, toast]);

  const stopRecognition = useCallback(() => {
    if (speechRecognitionRef.current && isActuallyListening) {
      speechRecognitionRef.current.stop();
    }
    // onend handler will set listening states to false
  }, [isActuallyListening]);

  // Click handler
  const toggleListeningByClick = () => {
    if (!isBrowserSupported) return;
    if (isListeningByKeyboard) { // If keyboard is active, click stops everything
      stopRecognition();
      return;
    }
    if (isListeningByClick) {
      stopRecognition();
    } else {
      setIsListeningByClick(true); // Set state before starting
      startRecognition();
    }
  };
  
  // Keyboard "push-to-talk" effect for Control key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control' && !event.repeat && !isActuallyListening) {
        setIsListeningByKeyboard(true);
        startRecognition();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' && isListeningByKeyboard) {
        // isListeningByKeyboard will be set to false by onend
        stopRecognition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (isListeningByKeyboard && speechRecognitionRef.current) { // Cleanup if component unmounts while key is held
          speechRecognitionRef.current.stop();
      }
    };
  }, [isActuallyListening, isListeningByKeyboard, startRecognition, stopRecognition]);


  if (!isBrowserSupported) {
    return null;
  }

  const buttonTitle = isListeningByClick 
    ? "শোনা বন্ধ করতে ক্লিক করুন" 
    : isListeningByKeyboard 
    ? "Control কী ধরে কথা বলুন..." 
    : (error ? `ত্রুটি: ${error} (পুনরায় চেষ্টা করতে ক্লিক করুন)` : "বাংলায় ভয়েস টাইপিং শুরু করতে ক্লিক করুন (অথবা Control কী ধরে রাখুন)");

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleListeningByClick}
      className={cn(
        "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl bg-background hover:bg-muted text-primary border-2 border-primary",
        "transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95",
        isActuallyListening && "bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse",
        error && !isActuallyListening && "bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500"
      )}
      title={buttonTitle}
      aria-label={isActuallyListening ? "Stop voice input" : "Start voice input"}
    >
      {isActuallyListening ? (
        <Loader2 className="h-7 w-7 animate-spin" />
      ) : error && !isActuallyListening ? (
        <AlertCircle className="h-7 w-7" />
      ) : (
        <Keyboard className="h-6 w-6" /> // Keyboard icon to signify it can be used with keyboard
      )}
    </Button>
  );
};
