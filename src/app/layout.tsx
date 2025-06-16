
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from '@/contexts/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { Poppins, PT_Sans } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

const pt_sans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: `Patient Management System for ${APP_NAME}`,
  icons: {
    icon: '/icons/favicon.ico', // Default path, change if your icon has a different name/format
    // apple: '/icons/apple-touch-icon.png', // Optional: for Apple devices
    // shortcut: '/icons/favicon.ico', // Optional: for shortcut icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${poppins.variable} ${pt_sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Favicon link is now handled by the metadata object above for Next.js App Router */}
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
