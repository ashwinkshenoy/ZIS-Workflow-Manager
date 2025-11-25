// utils/oauth.ts
type WatchOptions = {
  timeoutMs?: number;
  popupCheckIntervalMs?: number;
};

export function watchForVerificationToken(authWindow: Window | null, options?: WatchOptions): Promise<string> {
  const { timeoutMs = 2 * 60 * 1000, popupCheckIntervalMs = 500 } = options || {};

  return new Promise((resolve, reject) => {
    if (!authWindow) {
      return reject(new Error('Popup window not available'));
    }

    const expectedOrigin = window.location.origin;
    let settled = false;

    function cleanup() {
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(popupInterval);
      clearTimeout(timeoutTimer);
    }

    function onMessage(e: MessageEvent) {
      // SECURITY: verify origin and shape
      if (e.origin !== expectedOrigin) return;
      const data = e.data;
      if (!data || data.type !== 'oauth_verification_token') return;

      cleanup();
      resolve(String(data.token));
    }

    window.addEventListener('message', onMessage);

    // detect if popup closed by user
    const popupInterval = setInterval(() => {
      try {
        if (!authWindow || authWindow.closed) {
          if (!settled) {
            cleanup();
            reject(new Error('Popup closed by user'));
          }
        }
      } catch (err) {
        // ignore - cross-origin access might throw while popup is on other origin
      }
    }, popupCheckIntervalMs);

    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error('Timed out waiting for verification token'));
      }
    }, timeoutMs);
  });
}
