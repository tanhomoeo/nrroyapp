
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle } from 'lucide-react'; // Zap icon removed as it's not used
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const FloatingVoiceInput: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      const unsupportedMessage = 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। অনুগ্রহ করে Chrome এর মতো একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।';
      setError(unsupportedMessage);
      toast({
        title: 'ব্রাউজার সাপোর্ট করে না',
        description: unsupportedMessage,
        variant: 'destructive',
        duration: 10000, // Longer duration for important messages
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // Process after each pause
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'bn-BD'; // Set to Bangla

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      // transcript state removed as text is directly inserted
    };

    recognition.onresult = (event) => {
      let finalTranscriptSegment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptSegment += event.results[i][0].transcript;
        }
        // Interim results can be shown if needed, but direct insertion handles final segments
      }

      if (finalTranscriptSegment.trim()) {
        insertTextIntoActiveElement(finalTranscriptSegment.trim() + ' '); // Add space after insertion
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
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort(); // Use abort to stop immediately
      }
    };
  }, [toast]);

  const insertTextIntoActiveElement = (textToInsert: string) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
      
      // For better compatibility with React controlled components,
      // simulate native input behavior if possible, or directly set value and dispatch event.
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      
      const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
      
      // Directly setting value and then dispatching events is often more reliable for React
      // This method is from a previous implementation and generally works.
      // For more complex state management (e.g. Redux), direct DOM manipulation might need careful handling.
      
      // Backup original value setter
      const originalValueSetter = Object.getOwnPropertyDescriptor(inputElement.constructor.prototype, 'value')?.set;
      originalValueSetter?.call(inputElement, newValue);
      
      // Update cursor position
      const newCursorPosition = start + textToInsert.length;
      inputElement.selectionStart = newCursorPosition;
      inputElement.selectionEnd = newCursorPosition;
      
      inputElement.focus();
      
      // Dispatch input and change events to trigger React state updates
      const eventOptions = { bubbles: true, cancelable: true };
      inputElement.dispatchEvent(new Event('input', eventOptions));
      inputElement.dispatchEvent(new Event('change', eventOptions)); // Some components might listen for 'change'

    } else {
      toast({
        title: 'কোনো ইনপুট ফিল্ড ফোকাস করা নেই',
        description: 'ভয়েস টাইপিং ব্যবহার করার জন্য একটি টেক্সটবক্স বা ইনপুট ফিল্ডে ক্লিক করুন।',
        variant: 'default',
        duration: 5000,
      });
    }
  };

  const toggleListening = () => {
    if (!isMounted || !speechRecognitionRef.current) {
      toast({
        title: 'ভয়েস টাইপিং প্রস্তুত নয়',
        description: error || 'এই ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই অথবা একটি ত্রুটি হয়েছে।',
        variant: 'destructive',
        duration: 7000,
      });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop(); // Request to stop, onend will set isListening to false
    } else {
      try {
        // Ensure microphone permission before starting, or handle errors from start()
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
            toast({
              title: 'মাইক্রোফোন সমস্যা',
              description: permErrorMessage,
              variant: 'destructive',
            });
            setIsListening(false); // Ensure state is correct if permission fails
          });
      } catch (e: any) {
         setError('ভয়েস রিকগনিশন শুরু করা যায়নি: ' + (e.message || String(e)));
         toast({
            title: 'শুরু করতে সমস্যা',
            description: 'ভয়েস রিকগনিশন শুরু করা যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
            variant: 'destructive',
         });
      }
    }
  };
  
  if (!isMounted) {
    return null;
  }

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition && isMounted) {
    // API not supported, button should not be rendered if error state is set in useEffect.
    // Error toast is already handled.
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleListening}
      className={cn(
        "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl bg-background hover:bg-muted text-primary border-2 border-primary",
        "transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95",
        isListening && "bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse",
        error && !isListening && "bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500"
      )}
      title={isListening ? "শোনা বন্ধ করতে ক্লিক করুন" : (error ? `ত্রুটি: ${error} (পুনরায় চেষ্টা করতে ক্লিক করুন)` : "বাংলায় ভয়েস টাইপিং শুরু করতে ক্লিক করুন")}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? (
        <Loader2 className="h-7 w-7 animate-spin" />
      ) : error ? (
        <AlertCircle className="h-7 w-7" />
      ) : (
        <Mic className="h-7 w-7" />
      )}
    </Button>
  );
};
