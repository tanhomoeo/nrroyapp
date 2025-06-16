
'use client';
import React from 'react';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Construction } from 'lucide-react'; // Added Construction icon

export default function PersonalExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="ব্যক্তিগত খরচ"
        description="আপনার ব্যক্তিগত খরচ এবং হিসাব পরিচালনা করুন।"
        actions={<DollarSign className="h-8 w-8 text-primary" />}
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center">
            <Construction className="mr-3 h-6 w-6 text-amber-500" />
            এই ফিচারটি শীঘ্রই আসছে!
          </CardTitle>
          <CardDescription>
            আমরা বর্তমানে ব্যক্তিগত খরচ ট্র্যাকিং মডিউলটির উন্নয়নে কাজ করছি। এটি আপনাকে আপনার খরচগুলি রেকর্ড করতে, বাজেট সেট করতে এবং আর্থিক অবস্থার উপর নজর রাখতে সাহায্য করবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center bg-muted/50 rounded-lg">
            <Construction className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              ব্যক্তিগত খরচ ব্যবস্থাপনার এই মডিউলটি শীঘ্রই চালু করা হবে। আমাদের সাথে থাকার জন্য ধন্যবাদ!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
