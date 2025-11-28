'use client';

import { useEffect, useState } from 'react';
import ZDClient from '@/lib/ZDClient';

export default function ClientGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = await ZDClient.init();
        if (client) {
          ZDClient.events.ON_APP_REGISTERED((data: any) => {
            console.log('App registered:', data);
          });
        }
        const colorScheme = await ZDClient.get('colorScheme');
        ZDClient.setAppTheme(colorScheme);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <></>;
  }

  return <>{children}</>;
}
