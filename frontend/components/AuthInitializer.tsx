'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/stores/auth.store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize();
    setReady(true);
  }, [initialize]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-medium">Initializing OpsMind AI...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
