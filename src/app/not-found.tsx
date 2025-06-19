// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <PageHeaderCard
        title="404 - পৃষ্ঠা খুঁজে পাওয়া যায়নি"
        description="দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি এখানে নেই।"
        actions={<AlertTriangle className="w-10 h-10 text-destructive" />}
        className="w-full max-w-2xl text-center"
        titleClassName="text-destructive"
      />
      <div className="mt-8 text-center">
        <p className="text-lg text-muted-foreground mb-6">
          সম্ভবত ঠিকানাটি ভুল লেখা হয়েছে অথবা পৃষ্ঠাটি সরিয়ে ফেলা হয়েছে।
        </p>
        <Link href="/dashboard">
          <Button size="lg" variant="default">
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </Link>
      </div>
    </div>
  );
}
