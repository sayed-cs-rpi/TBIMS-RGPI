'use client';

import { isFirebaseConfigured } from '@/lib/firebase';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cardClass, primaryBtnClass, secondaryBtnClass } from '@/components/app-shell';

export function SetupCheck() {
  if (isFirebaseConfigured) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className={`${cardClass} max-w-md space-y-6`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Firebase Setup Required</h2>
          </div>
          <p className="text-sm text-foreground/60">
            Configure Firebase environment variables to enable the application.
          </p>
        </div>

        <div className="glass-input rounded-xl p-4 space-y-2">
          <p className="text-xs font-mono text-foreground/70">Missing:</p>
          <ul className="text-xs space-y-1 text-foreground/60 font-mono">
            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
            <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href="https://github.com/vercel/v0/blob/main/SETUP.md"
            target="_blank"
            className={`flex-1 text-center text-sm ${primaryBtnClass}`}
          >
            Setup Guide
          </Link>
          <button
            onClick={() => window.location.reload()}
            className={`flex-1 text-sm ${secondaryBtnClass}`}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
