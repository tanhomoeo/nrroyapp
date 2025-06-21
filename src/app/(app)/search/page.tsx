
import React, { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';
import { Loader2, Search } from 'lucide-react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';

// A fallback component to show while the client component is loading
const SearchPageLoadingFallback = () => (
    <div className="space-y-6">
        <PageHeaderCard
            title="রোগী অনুসন্ধান"
            description="রোগীর রেকর্ড খুঁজুন"
            actions={<Search className="h-8 w-8 text-primary" />}
        >
        <p className="text-sm text-muted-foreground mt-1">
          নাম, ডায়েরি নম্বর, ফোন, ঠিকানা বা অভিভাবকের নাম দ্বারা বিদ্যমান রোগীর রেকর্ড খুঁজতে নীচের অনুসন্ধান বার ব্যবহার করুন।
        </p>
      </PageHeaderCard>

      <div className="flex h-11 items-center w-full rounded-md border border-input bg-card shadow-inner animate-pulse">
        <div className="pl-3 pr-2 flex items-center pointer-events-none h-full">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

       <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">লোড হচ্ছে...</p>
        </div>
    </div>
);


export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoadingFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
