// MicrophoneButton component has been temporarily disabled as Genkit AI voice typing is removed.
'use client';
import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { MicOff } from 'lucide-react'; // Using MicOff to indicate it's disabled
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  onTranscription?: (text: string) => void; // Made optional
  targetInputId?: string;
  language?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  className,
  ...props
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled
      className={cn(
        "relative text-muted-foreground opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label="ভয়েস টাইপিং সাময়িকভাবে বন্ধ আছে"
      title="ভয়েস টাইপিং সাময়িকভাবে বন্ধ আছে"
      {...props}
    >
      <MicOff className="h-5 w-5" />
    </Button>
  );
};
