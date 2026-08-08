import { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    if ((window as any).turnstile) { resolve(null); return; }
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(null));
    script.addEventListener('error', () => reject(new Error('Falha ao carregar o Turnstile.')));
  });
}

export default function Turnstile({ siteKey, onVerify, resetSignal }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !(window as any).turnstile) return;
        widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token) => onVerify(token),
          'expired-callback': () => onVerify(''),
          'error-callback': () => onVerify(''),
        });
      })
      .catch(() => onVerify(''));
    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (widgetIdRef.current != null && (window as any).turnstile) {
      (window as any).turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  return <div ref={containerRef} className="flex justify-center" />;
}
