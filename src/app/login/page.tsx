
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { ROUTES, APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';

const loginFormSchema = z.object({
  email: z.string().email({ message: "অনুগ্রহ করে একটি বৈধ ইমেইল লিখুন।" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/icons/icon.png");


  useEffect(() => {
    if (!authLoading && user) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: 'cybercrime.bd.gov@gmail.com',
      password: 'Password-Shaon@5823',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'সফলভাবে সাইন ইন হয়েছে',
        description: `আপনাকে ${APP_NAME}-এ স্বাগতম!`,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "সাইন ইন করার সময় একটি ত্রুটি হয়েছে।";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        errorMessage = "আপনার ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।";
      }
      toast({
        title: 'সাইন ইন ব্যর্থ হয়েছে',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputWrapperClass = "flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary";
  const inputFieldClass = "h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-3 text-base placeholder-muted-foreground";


  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(var(--primary)/0.2)] via-[hsl(var(--background))] to-[hsl(var(--secondary)/0.2)] p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4">
            <Image
              src={logoSrc}
              alt={`${APP_NAME} Logo`}
              width={64}
              height={64}
              className="rounded-lg object-contain"
              data-ai-hint="clinic health logo"
              onError={() => {
                console.warn('Login page logo failed to load. Using placeholder.');
                setLogoSrc("https://placehold.co/64x64.png?text=TAN");
              }}
            />
          </Link>
          <CardTitle className="font-headline text-2xl text-primary">{APP_NAME}-এ সাইন ইন করুন</CardTitle>
          <CardDescription>আপনার একাউন্টে প্রবেশ করতে আপনার ইমেইল ও পাসওয়ার্ড দিন।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email-login" className="text-sm font-medium">ইমেইল</Label>
                     <div className={inputWrapperClass}>
                        <FormControl>
                          <Input id="email-login" type="email" placeholder="your.email@example.com" {...field} className={inputFieldClass} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password-login" className="text-sm font-medium">পাসওয়ার্ড</Label>
                    <div className={inputWrapperClass}>
                        <FormControl>
                        <Input
                            id="password-login"
                            type={showPassword ? "text" : "password"}
                            placeholder="আপনার পাসওয়ার্ড"
                            {...field}
                            className={inputFieldClass}
                        />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="h-full w-10 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                সাইন ইন করুন
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground pt-6">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}। সর্বস্বত্ব সংরক্ষিত।</p>
        </CardFooter>
      </Card>
    </div>
  );
}
