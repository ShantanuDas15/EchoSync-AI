import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ThemeProvider } from '@/lib/themeContext';
import { SettingsDrawer } from '@/components/ui/SettingsDrawer';
import { OnboardingProvider } from '@/lib/onboardingContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { ToastProvider } from '@/lib/toastContext';
import { PresenceProvider } from '@/lib/presenceContext';
import { LiveCursors } from '@/components/collaboration/LiveCursors';
import { TextureOverlay } from '@/components/ui/TextureOverlay';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'EchoSync AI | Neural Zero-Shot Voice Synthesis Studio',
  description: 'State-of-the-art zero-shot voice cloning and real-time streaming text-to-speech engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <ThemeProvider>
      <OnboardingProvider>
        <ToastProvider>
          <PresenceProvider>
            <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
              <body className="bg-surface-root text-text-primary min-h-screen flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-100 antialiased relative">
                <TextureOverlay opacity={0.028} />
                {children}
                <LiveCursors />
                <CommandPalette />
                <SettingsDrawer />
                <OnboardingTour />
              </body>
            </html>
          </PresenceProvider>
        </ToastProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );

  if (publishableKey) {
    return <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>;
  }

  return content;
}
