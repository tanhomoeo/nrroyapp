
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { Settings as SettingsIcon, Download, Upload, AlertTriangle, Info, DatabaseZap, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getPatients, getVisits, getPrescriptions, getPaymentSlips, getClinicSettings, migrateLocalStorageToFirestore, clearAllLocalStorageData } from '@/lib/firestoreService';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import type { Patient, Visit, Prescription, PaymentSlip, ClinicSettings } from '@/lib/types';

interface AllData {
  patients: Patient[];
  visits: Visit[];
  prescriptions: Prescription[];
  paymentSlips: PaymentSlip[];
  clinicSettings: ClinicSettings; 
}

export default function AppSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleExportData = async () => {
    try {
      // Fetch all data from Firestore
      const patients = await getPatients();
      const visits = await getVisits();
      const prescriptions = await getPrescriptions();
      const paymentSlips = await getPaymentSlips();
      const clinicSettings = await getClinicSettings();

      const allData: AllData = { 
        patients,
        visits,
        prescriptions,
        paymentSlips,
        clinicSettings,
      };

      const jsonString = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateSuffix = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `${APP_NAME.toLowerCase().replace(/\s+/g, '_')}_firestore_export_${dateSuffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "ডেটা এক্সপোর্ট সম্পন্ন", description: "Firestore থেকে সকল অ্যাপ্লিকেশন ডেটা ডাউনলোড করা হয়েছে।" });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "এক্সপোর্ট ব্যর্থ হয়েছে", description: "ডেটা এক্সপোর্ট করা যায়নি।", variant: "destructive" });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setFileToImport(file);
    } else {
      setSelectedFileName(null);
      setFileToImport(null);
    }
  };

  const handleImportData = () => {
    if (!fileToImport) {
      toast({ title: "কোনো ফাইল নির্বাচন করা হয়নি", description: "অনুগ্রহ করে ইম্পোর্ট করার জন্য একটি JSON ফাইল নির্বাচন করুন।", variant: "destructive" });
      return;
    }

    toast({ title: "ইম্পোর্ট (Firestore)", description: "Firestore-এ ডেটা ইম্পোর্ট করার প্রক্রিয়া জটিল এবং বর্তমানে এই ডেমো অ্যাপে স্বয়ংক্রিয়ভাবে সমর্থিত নয়। ডেটা মাইগ্রেশনের জন্য বিশেষ স্ক্রিপ্ট প্রয়োজন।", variant: "default" });

    setSelectedFileName(null);
    setFileToImport(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    await migrateLocalStorageToFirestore();
    setIsMigrating(false);
    // Toast is handled within migrateLocalStorageToFirestore
  };
  
  const handleClearLocalStorage = () => {
    clearAllLocalStorageData();
    // Toast and reload is handled within clearAllLocalStorageData
  };


  if (!mounted) return (
    <div className="space-y-6 animate-pulse">
      <Card className="h-24"><CardHeader><div className="h-6 bg-muted rounded w-1/3"></div><div className="h-4 bg-muted rounded w-2/3 mt-1"></div></CardHeader></Card>
      <Card><CardHeader><CardTitle className="h-5 bg-muted rounded w-1/4"></CardTitle><CardDescription className="h-4 bg-muted rounded w-1/2 mt-1"></CardDescription></CardHeader><CardContent className="h-10"></CardContent></Card>
      <Card><CardHeader><CardTitle className="h-5 bg-muted rounded w-1/4"></CardTitle><CardDescription className="h-4 bg-muted rounded w-1/2 mt-1"></CardDescription></CardHeader><CardContent className="space-y-6 h-40"></CardContent></Card>
      <Card><CardHeader><CardTitle className="h-5 bg-muted rounded w-1/4"></CardTitle></CardHeader><CardContent className="h-10"></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="সেটিংস"
        description="অ্যাপ্লিকেশন কাস্টমাইজ করুন এবং ডেটা পরিচালনা করুন।"
        actions={<SettingsIcon className="h-8 w-8 text-primary" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">অ্যাপের ধরণ</CardTitle>
          <CardDescription>অ্যাপ্লিকেশনের কাস্টমাইজ করুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Dark mode toggle"
            />
            <Label htmlFor="dark-mode">ডার্ক মোড</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">ডেটা ম্যানেজমেন্ট (Firestore)</CardTitle>
          <CardDescription>আপনার অ্যাপ্লিকেশন ডেটা এক্সপোর্ট বা ইম্পোর্ট করুন। ইম্পোর্ট করার আগে সতর্কতা অবলম্বন করুন।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-1">ডেটা এক্সপোর্ট (Firestore থেকে)</h3>
            <p className="text-sm text-muted-foreground mb-2">আপনার সকল রোগী, ভিজিট, প্রেসক্রিপশন, এবং স্লিপ ডেটা একটি JSON ফাইল হিসেবে ডাউনলোড করুন।</p>
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" /> সকল ডেটা এক্সপোর্ট করুন
            </Button>
          </div>
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-1">ডেটা ইম্পোর্ট (Firestore-এ)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              পূর্বে এক্সপোর্ট করা JSON ফাইল থেকে ডেটা ইম্পোর্ট করুন। 
              <strong className="text-destructive"> এটি Firestore-এ বিদ্যমান ডেটা পরিবর্তন বা মুছে ফেলতে পারে। এই ফিচারটি সতর্কতার সাথে ব্যবহার করুন।</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                <Upload className="mr-2 h-4 w-4" /> ফাইল নির্বাচন করুন
              </Button>
              <span className="text-sm text-muted-foreground truncate" title={selectedFileName || "কোনো ফাইল নির্বাচন করা হয়নি"}>
                {selectedFileName || "কোনো ফাইল নির্বাচন করা হয়নি"}
              </span>
              <Input 
                type="file" 
                accept=".json" 
                onChange={handleFileChange} 
                ref={fileInputRef} 
                className="hidden" 
                id="import-file-input"
              />
            </div>
             {fileToImport && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-3">
                    <Upload className="mr-2 h-4 w-4" /> নির্বাচিত ফাইল ইম্পোর্ট করুন (Placeholder)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive"/> ডেটা ইম্পোর্ট নিশ্চিত করুন
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                       আপনি কি &quot;{selectedFileName}&quot; থেকে ডেটা Firestore-এ ইম্পোর্ট করতে চান? এই প্রক্রিয়াটি জটিল এবং বর্তমানে এই ডেমো অ্যাপে সম্পূর্ণ স্বয়ংক্রিয়ভাবে সমর্থিত নয়। এটি শুধুমাত্র একটি প্লেসহোল্ডার।
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImportData} className="bg-destructive hover:bg-destructive/90">
                      হ্যাঁ, ইম্পোর্ট করুন (Placeholder)
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="border-t pt-6 space-y-3">
            <h3 className="font-semibold">localStorage থেকে Firestore-এ ডেটা মাইগ্রেশন</h3>
            <p className="text-sm text-muted-foreground">
              যদি আপনার ব্রাউজারের localStorage-এ আগের ডেটা থাকে, তাহলে সেগুলোকে একবারের জন্য Firestore-এ কপি করতে এই বাটনটি ব্যবহার করুন।
              <strong className="text-destructive"> এই কাজটি করার আগে নিশ্চিত করুন আপনার Firestore ডেটাবেস খালি আছে অথবা আপনি ডেটা মার্জ করতে প্রস্তুত।</strong>
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="bg-orange-500 hover:bg-orange-600" disabled={isMigrating}>
                  {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                  localStorage থেকে Firestore-এ মাইগ্রেট করুন
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>মাইগ্রেশন নিশ্চিত করুন</AlertDialogTitle>
                  <AlertDialogDescription>
                    আপনি কি localStorage-এর সকল ডেটা Firestore-এ কপি করতে চান? যদি Firestore-এ একই আইডি সহ ডেটা থাকে, সেগুলো আপডেট হতে পারে। এই কাজটি করার আগে Firestore ব্যাকআপ নেওয়ার পরামর্শ দেওয়া হচ্ছে।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isMigrating}>বাতিল</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMigrateData} disabled={isMigrating} className="bg-orange-500 hover:bg-orange-600">
                    {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "হ্যাঁ, মাইগ্রেট করুন"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="border-t pt-6 space-y-3">
            <h3 className="font-semibold text-destructive">localStorage ডেটা মুছে ফেলুন</h3>
            <p className="text-sm text-muted-foreground">
              সতর্কতা: এই কাজটি আপনার ব্রাউজারের localStorage থেকে অ্যাপ্লিকেশনের সকল ডেটা (রোগী, ভিজিট, প্রেসক্রিপশন ইত্যাদি) স্থায়ীভাবে মুছে ফেলবে।
              <strong className="text-destructive"> যদি ডেটা Firestore-এ সফলভাবে মাইগ্রেট হয়ে থাকে, শুধুমাত্র তখনই এটি ব্যবহার করুন।</strong>
            </p>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> localStorage ডেটা মুছুন
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-destructive"/> আপনি কি নিশ্চিত?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            এই কাজটি আপনার ব্রাউজারের লোকাল স্টোরেজ থেকে <strong className="text-destructive">সকল অ্যাপ্লিকেশনের ডেটা স্থায়ীভাবে মুছে ফেলবে</strong>। এই ডেটা আর পুনরুদ্ধার করা যাবে না। আপনি যদি ইতিমধ্যে ডেটা Firestore-এ মাইগ্রেট করে থাকেন, তবেই এটি করুন।
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearLocalStorage} className="bg-destructive hover:bg-destructive/90">
                            হ্যাঁ, সকল লোকাল ডেটা মুছুন
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">সম্পর্কিত</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-semibold">{APP_NAME} - রোগী ম্যানেজমেন্ট সিস্টেম</p>
          <p className="text-muted-foreground">ভার্সন {APP_VERSION}</p>
        </CardContent>
      </Card>
    </div>
  );
}
