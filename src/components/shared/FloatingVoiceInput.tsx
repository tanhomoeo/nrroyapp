
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, Zap, AlertCircle } from 'lucide-react';
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
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      toast({
        title: 'ব্রাউজার সাপোর্ট করে না',
        description: 'আপনার ব্রাউজারে ভয়েস টাইপিং সুবিধাটি নেই। অনুগ্রহ করে Chrome এর মতো একটি সাপোর্টেড ব্রাউজার ব্যবহার করুন।',
        variant: 'destructive',
        duration: 7000,
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // Changed to false: process after each pause
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Set to Bangla

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript); // Show interim results

      // If final transcript has content, attempt to insert it
      if (finalTranscript.trim()) {
        insertTextIntoActiveElement(finalTranscript.trim() + ' '); // Add space after insertion
      }
    };

    recognition.onerror = (event) => {
      let errorMessage = 'একটি ত্রুটি হয়েছে।';
      if (event.error === 'no-speech') {
        errorMessage = 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'মাইক্রোফোন অ্যাক্সেস করা যায়নি। পারমিশন চেক করুন।';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি।';
      } else if (event.error === 'network') {
        errorMessage = 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
      }
      setError(errorMessage);
      toast({
        title: 'ভয়েস টাইপিং ত্রুটি',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // The final transcript is handled in onresult
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [toast]);

  const insertTextIntoActiveElement = (textToInsert: string) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      
      inputElement.value = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
      
      // Update cursor position
      const newCursorPosition = start + textToInsert.length;
      inputElement.selectionStart = newCursorPosition;
      inputElement.selectionEnd = newCursorPosition;
      
      inputElement.focus();
      // Dispatch input event to trigger any React state updates if the input is controlled
      inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
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
      });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      try {
        speechRecognitionRef.current.start();
      } catch (e: any) {
         setError('ভয়েস রিকগনিশন শুরু করা যায়নি: ' + e.message);
         toast({
            title: 'শুরু করতে সমস্যা',
            description: 'ভয়েস রিকগনিশন শুরু করা যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
            variant: 'destructive',
         });
      }
    }
  };
  
  if (!isMounted) { // Don't render button on server or before mount
    return null;
  }

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    // If API is not supported at all, don't render the button
    // Toast notification is already handled in useEffect
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleListening}
      className={cn(
        "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg bg-background hover:bg-muted text-primary border-2 border-primary",
        isListening && "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
        error && !isListening && "bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-400/90"
      )}
      title={isListening ? "শোনা বন্ধ করুন" : (error ? `ত্রুটি: ${error}` : "বাংলায় ভয়েস টাইপিং শুরু করুন")}
    >
      {isListening ? (
        <Loader2 className="h-7 w-7 animate-spin" />
      ) : error ? (
        <AlertCircle className="h-7 w-7" />
      ) : (
        <Mic className="h-7 w-7" />
      )}
      <span className="sr-only">{isListening ? "শোনা বন্ধ করুন" : "ভয়েস টাইপিং"}</span>
    </Button>
  );
};
