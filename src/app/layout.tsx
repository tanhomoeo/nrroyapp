
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // For FloatingVoiceInput notifications
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
  manifest: "/manifest.json", // Link to the manifest file
  icons: {
    icon: [
      { url: '/image/favicon.ico', sizes: 'any', rel: 'icon', type: 'image/x-icon' },
      { url: '/image/icon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/image/icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon.png', type: 'image/png', sizes: '192x192' }, // PWA icon
      { url: '/icons/icon.png', type: 'image/png', sizes: '512x512' }, // PWA icon
    ],
    apple: '/image/apple-touch-icon.png',
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
        <meta name="theme-color" content="#1D9A9A" />
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
