import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ThemeProvider } from '@/lib/themeContext';
import { SettingsDrawer } from '@/components/ui/SettingsDrawer';
import { OnboardingProvider } from '@/lib/onboardingContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { ToastProvider } from '@/lib/toastContext';
import { PresenceProvider } from '@/lib/presenceContext';
import { LiveCursors } from '@/components/collaboration/LiveCursors';
import './globals.css';

export const metadata = {
  title: 'EchoSync AI | Neural Zero-Shot Voice Synthesis Studio',
  description: 'State-of-the-art zero-shot voice cloning and real-time streaming text-to-speech engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <ToastProvider>
            <PresenceProvider>
              <html lang="en">
                <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
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
    </ClerkProvider>
  );
}
