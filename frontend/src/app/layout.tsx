import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
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
      <html lang="en">
        <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
